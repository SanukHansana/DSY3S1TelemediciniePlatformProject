import crypto from "crypto";

import {
  createOrGetSession,
  deleteAppointment,
  getAuthUserById,
  getAppointmentById,
  getAppointments,
  getPatientReports,
  updateAppointment
} from "../lib/serviceClients.js";
import {
  downloadDocument,
  getDocumentProperties,
  getEmbeddedSignLink,
  sendPrescriptionForSignature
} from "../lib/boldsignClient.js";
import mockDoctors from "../data/mockDoctors.js";
import AvailabilitySlot from "../models/availability.model.js";
import Doctor from "../models/doctor.model.js";
import Prescription from "../models/prescription.model.js";

const doctorProfileFields = [
  "full_name",
  "specialty",
  "consultation_fee",
  "bio",
  "experience_years",
  "qualifications",
  "languages",
  "hospital_affiliation",
  "license_number",
  "is_active"
];

const mockDoctorIds = mockDoctors.map((doctor) => doctor._id);

const isMockSeedEnabled = () =>
  ["1", "true", "yes", "on"].includes(
    String(process.env.ENABLE_DOCTOR_MOCK_SEED || "").trim().toLowerCase()
  );

const withVisibleDoctorFilter = (filter = {}) =>
  isMockSeedEnabled() || mockDoctorIds.length === 0
    ? filter
    : {
        ...filter,
        _id: {
          $nin: mockDoctorIds
        }
      };

const isHiddenMockDoctorId = (doctorId) =>
  !isMockSeedEnabled() && mockDoctorIds.includes(String(doctorId || ""));

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

const buildProfilePatch = (body) => {
  const patch = {};

  for (const field of doctorProfileFields) {
    if (Object.hasOwn(body, field)) {
      patch[field] = body[field];
    }
  }

  if (Object.hasOwn(patch, "consultation_fee")) {
    if (
      patch.consultation_fee === null ||
      patch.consultation_fee === undefined ||
      patch.consultation_fee === ""
    ) {
      patch.consultation_fee = null;
    } else {
      const consultationFee = Number(patch.consultation_fee);
      patch.consultation_fee = Number.isFinite(consultationFee)
        ? consultationFee
        : null;
    }
  }

  if (Object.hasOwn(patch, "experience_years")) {
    if (
      patch.experience_years === null ||
      patch.experience_years === undefined ||
      patch.experience_years === ""
    ) {
      patch.experience_years = null;
    } else {
      const experienceYears = Number(patch.experience_years);
      patch.experience_years = Number.isFinite(experienceYears)
        ? experienceYears
        : null;
    }
  }

  if (Object.hasOwn(patch, "qualifications")) {
    patch.qualifications = normalizeStringArray(patch.qualifications);
  }

  if (Object.hasOwn(patch, "languages")) {
    patch.languages = normalizeStringArray(patch.languages);
  }

  if (Object.hasOwn(patch, "is_active")) {
    patch.is_active = Boolean(patch.is_active);
  }

  return patch;
};

const validateSlotPayload = (body) => {
  if (!body.start_time || !body.end_time) {
    return "start_time and end_time are required";
  }

  if (!body.day_of_week && !body.specific_date) {
    return "day_of_week or specific_date is required";
  }

  return null;
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

const toDoctor = (doctor, slots = []) => {
  const { __v, ...rest } = doctor;

  return {
    ...rest,
    slots
  };
};

const toSlot = (slot) => {
  const { __v, ...rest } = slot;

  return {
    ...rest
  };
};

const toPrescription = (prescription, doctor = null, patient = null) => {
  const { __v, ...rest } = prescription;
  const patientSummary = patient
    ? {
        _id: prescription.patient_id,
        name: patient.name || "",
        email: patient.email || ""
      }
    : null;

  if (!doctor) {
    return {
      ...rest,
      ...(patientSummary ? { patient: patientSummary } : {})
    };
  }

  return {
    ...rest,
    ...(patientSummary ? { patient: patientSummary } : {}),
    doctor: {
      _id: doctor._id,
      full_name: doctor.full_name || "",
      specialty: doctor.specialty || "",
      qualifications: doctor.qualifications || [],
      hospital_affiliation: doctor.hospital_affiliation || "",
      license_number: doctor.license_number || ""
    }
  };
};

const getDoctorInsertDefaults = (userId) => ({
  _id: userId,
  auth_user_id: userId
});

const ensureDoctorProfile = async (userId) =>
  Doctor.findByIdAndUpdate(
    userId,
    {
      $setOnInsert: getDoctorInsertDefaults(userId)
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).lean();

const getSlotsByDoctorId = async (doctorIds, { onlyAvailable = false } = {}) => {
  const filter = {
    doctor_id: { $in: doctorIds }
  };

  if (onlyAvailable) {
    filter.status = "available";
  }

  const slots = await AvailabilitySlot.find({
    ...filter
  })
    .sort({ specific_date: 1, start_time: 1 })
    .lean();

  const map = new Map();

  for (const slot of slots) {
    const existing = map.get(slot.doctor_id) || [];
    existing.push(toSlot(slot));
    map.set(slot.doctor_id, existing);
  }

  return map;
};

const toPatientSummary = (patientId, patientUser) => ({
  _id: patientId,
  name: patientUser?.name || "",
  email: patientUser?.email || ""
});

const enrichAppointmentsWithPatientDetails = async (appointments) => {
  const patientIds = [
    ...new Set(appointments.map((appointment) => appointment.patient_id).filter(Boolean))
  ];
  const patientResults = await Promise.allSettled(
    patientIds.map((patientId) => getAuthUserById(patientId))
  );
  const patientMap = new Map();

  patientResults.forEach((result, index) => {
    const patientId = patientIds[index];
    const patientUser = result.status === "fulfilled" ? result.value : null;
    patientMap.set(patientId, toPatientSummary(patientId, patientUser));
  });

  return appointments.map((appointment) => ({
    ...appointment,
    patient: patientMap.get(appointment.patient_id) ||
      toPatientSummary(appointment.patient_id, null)
  }));
};

const isVisibleToDoctor = (appointment) =>
  !["pending_payment", "payment_failed"].includes(appointment.status);

const lockedAppointmentStatuses = new Set(["in-consultation", "completed"]);

const normalizeMedications = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => ({
      medication_name: String(item.medication_name || "").trim(),
      dosage: String(item.dosage || "").trim(),
      frequency: String(item.frequency || "").trim(),
      duration: String(item.duration || "").trim(),
      instructions: String(item.instructions || "").trim()
    }))
    .filter((item) => item.medication_name);

const normalizeSignatureStatus = (value) => {
  const status = String(value || "in_progress").trim().toLowerCase();

  if (status === "completed") {
    return "completed";
  }

  if (["declined", "revoked", "expired", "failed"].includes(status)) {
    return status;
  }

  if (["sent", "waiting for others", "inprogress", "in progress"].includes(status)) {
    return "in_progress";
  }

  return status || "in_progress";
};

const getEmptySignature = () => ({
  provider: null,
  document_id: "",
  status: "not_sent",
  signer_email: "",
  signer_name: "",
  file_name: "",
  sent_at: null,
  completed_at: null,
  last_checked_at: null
});

const canAccessPrescription = (req, prescription) =>
  req.user.role === "admin" ||
  (req.user.role === "doctor" && prescription.doctor_id === req.user.id) ||
  (req.user.role === "patient" && prescription.patient_id === req.user.id);

const updatePrescriptionSignatureFromBoldSign = async (prescription) => {
  const documentId = prescription.signature?.document_id;

  if (!documentId) {
    return prescription;
  }

  const properties = await getDocumentProperties(documentId);
  const status = normalizeSignatureStatus(properties?.status);
  const updates = {
    "signature.status": status,
    "signature.last_checked_at": new Date()
  };

  if (status === "completed" && !prescription.signature?.completed_at) {
    updates["signature.completed_at"] = new Date();
  }

  return Prescription.findByIdAndUpdate(
    prescription._id,
    {
      $set: updates
    },
    {
      new: true
    }
  ).lean();
};

export const listPublicDoctors = async (req, res) => {
  const doctors = await Doctor.find(
    withVisibleDoctorFilter({
      is_active: true
    })
  )
    .sort({ full_name: 1 })
    .lean();

  const slotMap = await getSlotsByDoctorId(doctors.map((doctor) => doctor._id), {
    onlyAvailable: true
  });

  return res.json(
    doctors
      .map((doctor) =>
        toDoctor(
          doctor,
          (slotMap.get(doctor._id) || []).filter(isBookablePublicSlot)
        )
      )
      .filter((doctor) => doctor.slots.length > 0)
  );
};

export const getDoctorByPublicId = async (req, res) => {
  if (isHiddenMockDoctorId(req.params.doctorId)) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const doctor = await Doctor.findById(req.params.doctorId).lean();

  if (!doctor || doctor.is_active !== true) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const slots = await AvailabilitySlot.find({
    doctor_id: doctor._id,
    status: "available"
  })
    .sort({ specific_date: 1, start_time: 1 })
    .lean();

  return res.json(
    toDoctor(doctor, slots.map(toSlot).filter(isBookablePublicSlot))
  );
};

export const getDoctorSlots = async (req, res) => {
  if (isHiddenMockDoctorId(req.params.doctorId)) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const doctor = await Doctor.findById(req.params.doctorId).lean();

  if (!doctor || doctor.is_active !== true) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const slots = await AvailabilitySlot.find({
    doctor_id: doctor._id,
    status: "available"
  })
    .sort({ specific_date: 1, start_time: 1 })
    .lean();

  return res.json(slots.map(toSlot).filter(isBookablePublicSlot));
};

export const getMyProfile = async (req, res) => {
  const doctor = await ensureDoctorProfile(req.user.id);
  const slots = await AvailabilitySlot.find({ doctor_id: doctor._id })
    .sort({ specific_date: 1, start_time: 1 })
    .lean();

  return res.json(toDoctor(doctor, slots.map(toSlot)));
};

export const updateMyProfile = async (req, res) => {
  const patch = buildProfilePatch(req.body);

  const doctor = await Doctor.findByIdAndUpdate(
    req.user.id,
    {
      $setOnInsert: getDoctorInsertDefaults(req.user.id),
      $set: patch
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).lean();

  const slots = await AvailabilitySlot.find({ doctor_id: doctor._id })
    .sort({ specific_date: 1, start_time: 1 })
    .lean();

  return res.json(toDoctor(doctor, slots.map(toSlot)));
};

export const getMyAvailability = async (req, res) => {
  await ensureDoctorProfile(req.user.id);

  const slots = await AvailabilitySlot.find({ doctor_id: req.user.id })
    .sort({ specific_date: 1, start_time: 1 })
    .lean();

  return res.json(slots.map(toSlot));
};

export const createAvailabilitySlot = async (req, res) => {
  const validationError = validateSlotPayload(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  await ensureDoctorProfile(req.user.id);

  const slot = await AvailabilitySlot.create({
    _id: `slot-${crypto.randomUUID()}`,
    doctor_id: req.user.id,
    day_of_week: req.body.day_of_week || null,
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    specific_date: req.body.specific_date || null,
    status: req.body.status || "available"
  });

  return res.status(201).json(toSlot(slot.toObject()));
};

export const updateAvailabilitySlot = async (req, res) => {
  const updates = {};

  if (Object.hasOwn(req.body, "day_of_week")) {
    updates.day_of_week = req.body.day_of_week;
  }

  if (Object.hasOwn(req.body, "start_time")) {
    updates.start_time = req.body.start_time;
  }

  if (Object.hasOwn(req.body, "end_time")) {
    updates.end_time = req.body.end_time;
  }

  if (Object.hasOwn(req.body, "specific_date")) {
    updates.specific_date = req.body.specific_date;
  }

  if (Object.hasOwn(req.body, "status")) {
    updates.status = req.body.status;
  }

  const slot = await AvailabilitySlot.findOneAndUpdate(
    {
      _id: req.params.slotId,
      doctor_id: req.user.id
    },
    {
      $set: updates
    },
    {
      new: true
    }
  ).lean();

  if (!slot) {
    return res.status(404).json({ message: "Availability slot not found" });
  }

  return res.json(toSlot(slot));
};

export const deleteAvailabilitySlot = async (req, res) => {
  const deleted = await AvailabilitySlot.findOneAndDelete({
    _id: req.params.slotId,
    doctor_id: req.user.id
  }).lean();

  if (!deleted) {
    return res.status(404).json({ message: "Availability slot not found" });
  }

  return res.json({ message: "Availability slot deleted" });
};

export const listMyAppointments = async (req, res) => {
  await ensureDoctorProfile(req.user.id);
  const appointments = await getAppointments();
  const myAppointments = appointments.filter(
    (appointment) =>
      appointment.doctor_id === req.user.id && isVisibleToDoctor(appointment)
  );

  return res.json(await enrichAppointmentsWithPatientDetails(myAppointments));
};

export const updateAppointmentRequest = async (req, res) => {
  const appointment = await getAppointmentById(req.params.appointmentId);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (appointment.doctor_id !== req.user.id) {
    return res.status(403).json({
      message: "You can only update appointments assigned to your profile"
    });
  }

  if (!req.body.status) {
    return res.status(400).json({ message: "status is required" });
  }

  const updated = await updateAppointment(req.params.appointmentId, {
    patient_id: appointment.patient_id,
    doctor_id: appointment.doctor_id,
    slot_id: appointment.slot_id || null,
    status: req.body.status,
    appointment_type: appointment.appointment_type || "video",
    patient_notes: appointment.patient_notes || "",
    doctor_notes: req.body.doctor_notes ?? appointment.doctor_notes,
    fee_amount: appointment.fee_amount,
    scheduled_at: appointment.scheduled_at
  });

  return res.json(updated);
};

export const deleteAppointmentRequest = async (req, res) => {
  const appointment = await getAppointmentById(req.params.appointmentId);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (appointment.doctor_id !== req.user.id) {
    return res.status(403).json({
      message: "You can only delete appointments assigned to your profile"
    });
  }

  if (lockedAppointmentStatuses.has(appointment.status)) {
    return res.status(400).json({
      message: "This appointment can no longer be deleted"
    });
  }

  await deleteAppointment(req.params.appointmentId);
  return res.json({ message: "Appointment deleted" });
};

export const createConsultationSession = async (req, res) => {
  const appointment = await getAppointmentById(req.params.appointmentId);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (appointment.doctor_id !== req.user.id) {
    return res.status(403).json({
      message: "You can only start sessions for your appointments"
    });
  }

  const doctor = await ensureDoctorProfile(req.user.id);
  const payload = await createOrGetSession(req.params.appointmentId, {
    participantId: req.user.id,
    participantRole: "doctor",
    participantName: req.body.participant_name || doctor.full_name || "Doctor"
  });

  return res.status(201).json(payload);
};

export const issuePrescription = async (req, res) => {
  const appointmentId = req.body.appointment_id || null;
  let patientId = req.body.patient_id || null;

  if (!req.body.diagnosis) {
    return res.status(400).json({ message: "diagnosis is required" });
  }

  const medications = normalizeMedications(req.body.medications);

  if (medications.length === 0) {
    return res
      .status(400)
      .json({ message: "medications must be a non-empty array" });
  }

  if (appointmentId) {
    const appointment = await getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.doctor_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only prescribe for your own appointments"
      });
    }

    // When a prescription is tied to an appointment, always trust the
    // appointment's patient_id instead of any client-provided value.
    patientId = appointment.patient_id;
  }

  if (!patientId) {
    return res
      .status(400)
      .json({ message: "patient_id or appointment_id is required" });
  }

  const prescription = await Prescription.create({
    _id: `rx-${crypto.randomUUID()}`,
    doctor_id: req.user.id,
    patient_id: patientId,
    appointment_id: appointmentId,
    diagnosis: req.body.diagnosis,
    medications,
    notes: req.body.notes || "",
    follow_up_date: req.body.follow_up_date || null,
    issued_at: new Date()
  });

  return res.status(201).json(toPrescription(prescription.toObject()));
};

export const updatePrescription = async (req, res) => {
  const prescription = await Prescription.findOne({
    _id: req.params.prescriptionId,
    doctor_id: req.user.id
  });

  if (!prescription) {
    return res.status(404).json({ message: "Prescription not found" });
  }

  const updates = {};

  if (Object.hasOwn(req.body, "appointment_id")) {
    const appointmentId = req.body.appointment_id || null;

    if (appointmentId) {
      const appointment = await getAppointmentById(appointmentId);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      if (appointment.doctor_id !== req.user.id) {
        return res.status(403).json({
          message: "You can only prescribe for your own appointments"
        });
      }

      updates.appointment_id = appointmentId;
      updates.patient_id = appointment.patient_id;
    }
  }

  if (Object.hasOwn(req.body, "diagnosis")) {
    const diagnosis = String(req.body.diagnosis || "").trim();

    if (!diagnosis) {
      return res.status(400).json({ message: "diagnosis is required" });
    }

    updates.diagnosis = diagnosis;
  }

  if (Object.hasOwn(req.body, "medications")) {
    const medications = normalizeMedications(req.body.medications);

    if (medications.length === 0) {
      return res
        .status(400)
        .json({ message: "medications must be a non-empty array" });
    }

    updates.medications = medications;
  }

  if (Object.hasOwn(req.body, "notes")) {
    updates.notes = req.body.notes || "";
  }

  if (Object.hasOwn(req.body, "follow_up_date")) {
    updates.follow_up_date = req.body.follow_up_date || null;
  }

  const setUpdates = {
    ...updates
  };

  if (prescription.signature?.document_id) {
    setUpdates.signature = getEmptySignature();
  }

  const updated = await Prescription.findOneAndUpdate(
    {
      _id: req.params.prescriptionId,
      doctor_id: req.user.id
    },
    {
      $set: setUpdates
    },
    {
      new: true
    }
  ).lean();

  const [doctor, patient] = await Promise.all([
    Doctor.findById(req.user.id).lean(),
    getAuthUserById(updated.patient_id).catch(() => null)
  ]);

  return res.json(toPrescription(updated, doctor, patient));
};

export const deletePrescription = async (req, res) => {
  const deleted = await Prescription.findOneAndDelete({
    _id: req.params.prescriptionId,
    doctor_id: req.user.id
  }).lean();

  if (!deleted) {
    return res.status(404).json({ message: "Prescription not found" });
  }

  return res.json({ message: "Prescription deleted" });
};

export const createPrescriptionSignatureRequest = async (req, res) => {
  const prescription = await Prescription.findOne({
    _id: req.params.prescriptionId,
    doctor_id: req.user.id
  }).lean();

  if (!prescription) {
    return res.status(404).json({ message: "Prescription not found" });
  }

  const [doctor, doctorUser] = await Promise.all([
    Doctor.findById(req.user.id).lean(),
    getAuthUserById(req.user.id).catch(() => null)
  ]);
  const signerEmail = prescription.signature?.signer_email || doctorUser?.email;
  const signerName =
    prescription.signature?.signer_name ||
    doctor?.full_name ||
    doctorUser?.name ||
    "Doctor";

  if (!signerEmail) {
    return res.status(400).json({
      message: "Doctor email is required before sending to BoldSign"
    });
  }

  if (prescription.signature?.document_id) {
    const synced = await updatePrescriptionSignatureFromBoldSign(prescription);

    if (synced.signature?.status === "completed") {
      return res.json({
        signature: synced.signature,
        signLink: null
      });
    }

    const embeddedLink = await getEmbeddedSignLink(
      synced.signature.document_id,
      signerEmail
    );

    return res.json({
      signature: synced.signature,
      signLink: embeddedLink?.signLink || null
    });
  }

  const created = await sendPrescriptionForSignature({
    prescriptionId: prescription._id,
    pdfBase64: req.body.pdfBase64 || req.body.dataUrl,
    fileName: req.body.fileName,
    title: `Prescription ${prescription._id}`,
    doctorName: signerName,
    doctorEmail: signerEmail
  });
  const documentId = created?.documentId;

  if (!documentId) {
    return res.status(502).json({
      message: "BoldSign did not return a document ID"
    });
  }

  const updated = await Prescription.findByIdAndUpdate(
    prescription._id,
    {
      $set: {
        signature: {
          provider: "boldsign",
          document_id: documentId,
          status: "in_progress",
          signer_email: signerEmail,
          signer_name: signerName,
          file_name: req.body.fileName || `prescription-${prescription._id}.pdf`,
          sent_at: new Date(),
          completed_at: null,
          last_checked_at: new Date()
        }
      }
    },
    {
      new: true
    }
  ).lean();

  let signLink = null;

  try {
    const embeddedLink = await getEmbeddedSignLink(documentId, signerEmail);
    signLink = embeddedLink?.signLink || null;
  } catch (error) {
    signLink = null;
  }

  return res.status(201).json({
    signature: updated.signature,
    signLink
  });
};

export const refreshPrescriptionSignatureStatus = async (req, res) => {
  const prescription = await Prescription.findById(
    req.params.prescriptionId
  ).lean();

  if (!prescription) {
    return res.status(404).json({ message: "Prescription not found" });
  }

  if (!canAccessPrescription(req, prescription)) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!prescription.signature?.document_id) {
    return res.status(400).json({
      message: "Prescription has not been sent to BoldSign"
    });
  }

  const updated = await updatePrescriptionSignatureFromBoldSign(prescription);

  return res.json({
    signature: updated.signature
  });
};

export const downloadSignedPrescription = async (req, res) => {
  const prescription = await Prescription.findById(
    req.params.prescriptionId
  ).lean();

  if (!prescription) {
    return res.status(404).json({ message: "Prescription not found" });
  }

  if (!canAccessPrescription(req, prescription)) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!prescription.signature?.document_id) {
    return res.status(400).json({
      message: "Prescription has not been sent to BoldSign"
    });
  }

  const updated = await updatePrescriptionSignatureFromBoldSign(prescription);

  if (updated.signature?.status !== "completed") {
    return res.status(400).json({
      message: "Prescription is not signed yet"
    });
  }

  const pdf = await downloadDocument(updated.signature.document_id);
  const fileName =
    updated.signature.file_name ||
    `signed-prescription-${updated._id || req.params.prescriptionId}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", String(pdf.length));
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(
      fileName
    )}`
  );

  return res.send(pdf);
};

export const listMyPrescriptions = async (req, res) => {
  const [doctor, prescriptions] = await Promise.all([
    Doctor.findById(req.user.id).lean(),
    Prescription.find({ doctor_id: req.user.id }).sort({ issued_at: -1 }).lean()
  ]);
  const patientIds = [
    ...new Set(prescriptions.map((prescription) => prescription.patient_id))
  ];
  const patientResults = await Promise.allSettled(
    patientIds.map((patientId) => getAuthUserById(patientId))
  );
  const patientMap = new Map();

  patientResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      patientMap.set(patientIds[index], result.value);
    }
  });

  return res.json(
    prescriptions.map((prescription) =>
      toPrescription(
        prescription,
        doctor,
        patientMap.get(prescription.patient_id)
      )
    )
  );
};

export const listPrescriptionsForPatient = async (req, res) => {
  const { patientId } = req.params;

  if (req.user.role === "patient" && req.user.id !== patientId) {
    return res.status(403).json({
      message: "Patients can only view their own prescriptions"
    });
  }

  const prescriptions = await Prescription.find({ patient_id: patientId })
    .sort({ issued_at: -1 })
    .lean();

  const doctorIds = [...new Set(prescriptions.map((item) => item.doctor_id))];
  const doctors = await Doctor.find({ _id: { $in: doctorIds } }).lean();
  const doctorMap = new Map(doctors.map((doctor) => [doctor._id, doctor]));

  return res.json(
    prescriptions.map((prescription) =>
      toPrescription(prescription, doctorMap.get(prescription.doctor_id))
    )
  );
};

export const listPatientReports = async (req, res) => {
  const reports = await getPatientReports(req.params.patientId, req.authHeader);
  return res.json(reports);
};

export const listAllDoctorsForAdmin = async (req, res) => {
  const doctors = await Doctor.find(withVisibleDoctorFilter({}))
    .sort({ created_at: -1 })
    .lean();
  const slotMap = await getSlotsByDoctorId(doctors.map((doctor) => doctor._id));

  return res.json(
    doctors.map((doctor) => toDoctor(doctor, slotMap.get(doctor._id) || []))
  );
};

export const getAdminOverview = async (req, res) => {
  const doctorFilter = withVisibleDoctorFilter({});
  const slotFilter =
    isMockSeedEnabled() || mockDoctorIds.length === 0
      ? {}
      : {
          doctor_id: {
            $nin: mockDoctorIds
          }
        };
  const prescriptionFilter =
    isMockSeedEnabled() || mockDoctorIds.length === 0
      ? {}
      : {
          doctor_id: {
            $nin: mockDoctorIds
          }
        };
  const [totalDoctors, verifiedDoctors, totalSlots, totalPrescriptions] =
    await Promise.all([
      Doctor.countDocuments(doctorFilter),
      Doctor.countDocuments(withVisibleDoctorFilter({ is_verified: true })),
      AvailabilitySlot.countDocuments(slotFilter),
      Prescription.countDocuments(prescriptionFilter)
    ]);

  return res.json({
    total_doctors: totalDoctors,
    verified_doctors: verifiedDoctors,
    pending_verification: totalDoctors - verifiedDoctors,
    total_availability_slots: totalSlots,
    total_prescriptions: totalPrescriptions
  });
};

export const updateDoctorVerification = async (req, res) => {
  if (!Object.hasOwn(req.body, "is_verified")) {
    return res
      .status(400)
      .json({ message: "is_verified must be provided as a boolean" });
  }

  if (isHiddenMockDoctorId(req.params.doctorId)) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const doctor = await Doctor.findByIdAndUpdate(
    req.params.doctorId,
    {
      $setOnInsert: getDoctorInsertDefaults(req.params.doctorId),
      $set: {
        is_verified: Boolean(req.body.is_verified)
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).lean();

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const slots = await AvailabilitySlot.find({ doctor_id: doctor._id })
    .sort({ specific_date: 1, start_time: 1 })
    .lean();

  return res.json(toDoctor(doctor, slots.map(toSlot)));
};
