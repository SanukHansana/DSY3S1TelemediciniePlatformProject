import crypto from "crypto";

import {
  createAppointment,
  createOrGetSession,
  getAppointmentById,
  getAppointments,
  getDoctorById,
  getDoctorSlots,
  getPrescriptionsForPatient
} from "../lib/serviceClients.js";
import MedicalReport from "../models/medicalReport.model.js";
import Patient from "../models/patient.model.js";

const patientProfileFields = [
  "full_name",
  "email",
  "date_of_birth",
  "gender",
  "phone",
  "address",
  "emergency_contact",
  "blood_group",
  "allergies",
  "chronic_conditions"
];

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || "").trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

const sanitizeFileName = (value) =>
  String(value || "report.bin")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);

const toFileBuffer = (value) => {
  if (!value) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value?._bsontype === "Binary" && value.buffer) {
    return Buffer.from(value.buffer);
  }

  if (value?.buffer) {
    return Buffer.from(value.buffer);
  }

  if (Array.isArray(value?.data)) {
    return Buffer.from(value.data);
  }

  return Buffer.alloc(0);
};

const parseReportMetaHeader = (value) => {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(decodeURIComponent(String(value)));
  } catch (error) {
    return {};
  }
};

const toDateOnlyString = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const isBookablePublicSlot = (slot) => {
  if (!slot || slot.status !== "available") {
    return false;
  }

  if (!slot.specific_date) {
    return true;
  }

  const datePart = toDateOnlyString(slot.specific_date);

  if (!datePart) {
    return false;
  }

  const endTime = String(slot.end_time || "").trim();
  const fallbackTime = String(slot.start_time || "").trim() || "23:59";
  const clock = endTime || fallbackTime;
  const slotEnd = new Date(`${datePart}T${clock}:00`);

  if (Number.isNaN(slotEnd.getTime())) {
    return true;
  }

  return slotEnd.getTime() >= Date.now();
};

const resolveFeeAmount = (requestedFee, doctorFee) => {
  const nextDoctorFee = Number(doctorFee);
  const nextRequestedFee = Number(requestedFee);

  if (Number.isFinite(nextDoctorFee) && nextDoctorFee >= 0) {
    return nextDoctorFee;
  }

  if (Number.isFinite(nextRequestedFee) && nextRequestedFee > 0) {
    return nextRequestedFee;
  }

  return null;
};

const buildProfilePatch = (body) => {
  const patch = {};

  for (const field of patientProfileFields) {
    if (Object.hasOwn(body, field)) {
      patch[field] = body[field];
    }
  }

  if (Object.hasOwn(patch, "allergies")) {
    patch.allergies = normalizeStringArray(patch.allergies);
  }

  if (Object.hasOwn(patch, "chronic_conditions")) {
    patch.chronic_conditions = normalizeStringArray(patch.chronic_conditions);
  }

  return patch;
};

const getPatientInsertDefaults = (userId) => ({
  _id: userId,
  auth_user_id: userId
});

const ensurePatientProfile = async (userId) =>
  Patient.findByIdAndUpdate(
    userId,
    {
      $setOnInsert: getPatientInsertDefaults(userId)
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).lean();

const canAccessPatient = (req, patientId) =>
  req.user.role === "admin" ||
  req.user.role === "doctor" ||
  req.user.id === patientId;

const toPatient = (patient) => {
  const { __v, ...rest } = patient;

  return {
    ...rest
  };
};

const toReport = (report) => ({
  _id: report._id,
  patient_id: report.patient_id,
  title: report.title,
  category: report.category,
  description: report.description,
  file_name: report.file_name,
  mime_type: report.mime_type,
  size_bytes: report.size_bytes,
  uploaded_at: report.uploaded_at,
  created_at: report.created_at,
  updated_at: report.updated_at,
  download_url: `/api/patients/reports/${report._id}/file`
});

const buildMedicalHistory = async (patientId, authHeader) => {
  const [reports, appointments, prescriptions] = await Promise.all([
    MedicalReport.find({ patient_id: patientId })
      .sort({ uploaded_at: -1 })
      .lean(),
    getAppointments(),
    getPrescriptionsForPatient(patientId, authHeader)
  ]);

  return {
    reports: reports.map(toReport),
    appointments: appointments.filter(
      (appointment) => appointment.patient_id === patientId
    ),
    prescriptions
  };
};

export const getMyProfile = async (req, res) => {
  const patient = await ensurePatientProfile(req.user.id);
  return res.json(toPatient(patient));
};

export const updateMyProfile = async (req, res) => {
  const patch = buildProfilePatch(req.body);

  const patient = await Patient.findByIdAndUpdate(
    req.user.id,
    {
      $setOnInsert: getPatientInsertDefaults(req.user.id),
      $set: patch
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).lean();

  return res.json(toPatient(patient));
};

export const uploadReport = async (req, res) => {
  await ensurePatientProfile(req.user.id);
  const meta = Buffer.isBuffer(req.body)
    ? parseReportMetaHeader(req.headers["x-report-meta"])
    : req.body || {};
  const title = String(meta.title || "").trim();
  const fileName = meta.file_name || meta.fileName;
  const mimeType =
    meta.mime_type || meta.mimeType || "application/octet-stream";
  const category = meta.category || "general";
  const description = meta.description || "";
  const buffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(
        meta.content_base64 || meta.contentBase64 || "",
        "base64"
      );

  if (!title || !fileName || buffer.length === 0) {
    return res.status(400).json({
      message: "title, file_name, and file content are required"
    });
  }

  if (buffer.length === 0) {
    return res.status(400).json({
      message: "Uploaded report file is empty or could not be decoded"
    });
  }

  const report = await MedicalReport.create({
    _id: `report-${crypto.randomUUID()}`,
    patient_id: req.user.id,
    auth_user_id: req.user.id,
    title,
    category,
    description,
    file_name: sanitizeFileName(fileName),
    mime_type: mimeType,
    size_bytes: buffer.length,
    file_data: buffer,
    uploaded_at: new Date()
  });

  return res.status(201).json(toReport(report.toObject()));
};

export const listMyReports = async (req, res) => {
  await ensurePatientProfile(req.user.id);

  const reports = await MedicalReport.find({ patient_id: req.user.id })
    .sort({ uploaded_at: -1 })
    .lean();

  return res.json(reports.map(toReport));
};

export const listPatientReports = async (req, res) => {
  const { patientId } = req.params;

  if (!canAccessPatient(req, patientId)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const reports = await MedicalReport.find({ patient_id: patientId })
    .sort({ uploaded_at: -1 })
    .lean();

  return res.json(reports.map(toReport));
};

export const downloadReportFile = async (req, res) => {
  const report = await MedicalReport.findById(req.params.reportId);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  if (!canAccessPatient(req, report.patient_id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const fileName = sanitizeFileName(report.file_name || "report.bin");
  const fileBuffer = toFileBuffer(report.file_data);

  if (fileBuffer.length === 0) {
    return res.status(500).json({ message: "Report file is empty or unreadable" });
  }

  res.setHeader("Content-Type", report.mime_type || "application/octet-stream");
  res.setHeader("Content-Length", String(fileBuffer.length));
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(
      fileName
    )}`
  );

  return res.send(fileBuffer);
};

export const listMyAppointments = async (req, res) => {
  await ensurePatientProfile(req.user.id);
  const appointments = await getAppointments();

  return res.json(
    appointments.filter((appointment) => appointment.patient_id === req.user.id)
  );
};

export const createMyAppointment = async (req, res) => {
  await ensurePatientProfile(req.user.id);

  if (!req.body.doctor_id) {
    return res
      .status(400)
      .json({ message: "doctor_id is required" });
  }

  let doctor;

  try {
    doctor = await getDoctorById(req.body.doctor_id);
  } catch (error) {
    return res.status(error.status === 404 ? 404 : 400).json({
      message: error.status === 404 ? "Doctor not found" : "Could not load doctor details"
    });
  }

  let validatedSlot = null;

  if (req.body.slot_id) {
    try {
      const doctorSlots = await getDoctorSlots(req.body.doctor_id);
      validatedSlot = Array.isArray(doctorSlots)
        ? doctorSlots.find((slot) => slot._id === req.body.slot_id)
        : null;
    } catch (error) {
      return res.status(400).json({
        message: "Could not validate the selected doctor slot"
      });
    }

    if (!validatedSlot || !isBookablePublicSlot(validatedSlot)) {
      return res.status(400).json({
        message: "Selected doctor slot is not available"
      });
    }
  }

  if (!req.body.scheduled_at) {
    return res
      .status(400)
      .json({ message: "scheduled_at is required" });
  }

  const payload = {
    patient_id: req.user.id,
    doctor_id: req.body.doctor_id,
    slot_id: validatedSlot?._id || null,
    status: "scheduled",
    appointment_type: req.body.appointment_type || "video",
    patient_notes: req.body.patient_notes || "",
    fee_amount: resolveFeeAmount(req.body.fee_amount, doctor?.consultation_fee),
    scheduled_at: req.body.scheduled_at
  };

  const appointment = await createAppointment(payload);
  return res.status(201).json(appointment);
};

export const listMyPrescriptions = async (req, res) => {
  const prescriptions = await getPrescriptionsForPatient(
    req.user.id,
    req.authHeader
  );

  return res.json(prescriptions);
};

export const createConsultationSession = async (req, res) => {
  const appointment = await getAppointmentById(req.params.appointmentId);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (appointment.patient_id !== req.user.id) {
    return res.status(403).json({
      message: "You can only join sessions for your appointments"
    });
  }

  const patient = await ensurePatientProfile(req.user.id);
  const payload = await createOrGetSession(req.params.appointmentId, {
    participantId: req.user.id,
    participantRole: "patient",
    participantName: req.body.participant_name || patient.full_name || "Patient"
  });

  return res.status(201).json(payload);
};

export const getMyMedicalHistory = async (req, res) => {
  const history = await buildMedicalHistory(req.user.id, req.authHeader);
  return res.json(history);
};

export const getPatientMedicalHistory = async (req, res) => {
  const { patientId } = req.params;

  if (!canAccessPatient(req, patientId)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const history = await buildMedicalHistory(patientId, req.authHeader);
  return res.json(history);
};

export const listAllPatientsForAdmin = async (req, res) => {
  const patients = await Patient.find().sort({ created_at: -1 }).lean();
  return res.json(patients.map(toPatient));
};

export const getAdminOverview = async (req, res) => {
  const [totalPatients, totalReports] = await Promise.all([
    Patient.countDocuments(),
    MedicalReport.countDocuments()
  ]);

  return res.json({
    total_patients: totalPatients,
    total_reports: totalReports
  });
};
