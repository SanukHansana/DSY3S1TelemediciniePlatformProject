import crypto from "crypto";

import {
  createOrGetSession,
  getAppointmentById,
  getAppointments,
  getPatientReports,
  updateAppointment
} from "../lib/serviceClients.js";
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
    patch.consultation_fee = Number(patch.consultation_fee) || 0;
  }

  if (Object.hasOwn(patch, "experience_years")) {
    patch.experience_years =
      patch.experience_years === null || patch.experience_years === ""
        ? null
        : Number(patch.experience_years);
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

const toPrescription = (prescription) => {
  const { __v, ...rest } = prescription;

  return {
    ...rest
  };
};

const getDoctorDefaults = (userId) => ({
  _id: userId,
  auth_user_id: userId,
  full_name: "",
  specialty: "",
  consultation_fee: 0,
  bio: "",
  experience_years: null,
  qualifications: [],
  languages: [],
  hospital_affiliation: "",
  license_number: "",
  is_verified: false,
  is_active: true
});

const ensureDoctorProfile = async (userId) =>
  Doctor.findByIdAndUpdate(
    userId,
    {
      $setOnInsert: getDoctorDefaults(userId)
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).lean();

const getSlotsByDoctorId = async (doctorIds) => {
  const slots = await AvailabilitySlot.find({
    doctor_id: { $in: doctorIds }
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

export const listPublicDoctors = async (req, res) => {
  const doctors = await Doctor.find({
    is_active: true,
    is_verified: true
  })
    .sort({ full_name: 1 })
    .lean();

  const slotMap = await getSlotsByDoctorId(doctors.map((doctor) => doctor._id));

  return res.json(
    doctors.map((doctor) => toDoctor(doctor, slotMap.get(doctor._id) || []))
  );
};

export const getDoctorByPublicId = async (req, res) => {
  const doctor = await Doctor.findById(req.params.doctorId).lean();

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const slots = await AvailabilitySlot.find({ doctor_id: doctor._id })
    .sort({ specific_date: 1, start_time: 1 })
    .lean();

  return res.json(toDoctor(doctor, slots.map(toSlot)));
};

export const getDoctorSlots = async (req, res) => {
  const doctor = await Doctor.findById(req.params.doctorId).lean();

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const slots = await AvailabilitySlot.find({ doctor_id: doctor._id })
    .sort({ specific_date: 1, start_time: 1 })
    .lean();

  return res.json(slots.map(toSlot));
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
      $setOnInsert: getDoctorDefaults(req.user.id),
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

  return res.json(
    appointments.filter((appointment) => appointment.doctor_id === req.user.id)
  );
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
    ...appointment,
    status: req.body.status,
    doctor_notes: req.body.doctor_notes ?? appointment.doctor_notes
  });

  return res.json(updated);
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

  const medications = Array.isArray(req.body.medications)
    ? req.body.medications
    : [];

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

export const listMyPrescriptions = async (req, res) => {
  const prescriptions = await Prescription.find({ doctor_id: req.user.id })
    .sort({ issued_at: -1 })
    .lean();

  return res.json(prescriptions.map(toPrescription));
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

  return res.json(prescriptions.map(toPrescription));
};

export const listPatientReports = async (req, res) => {
  const reports = await getPatientReports(req.params.patientId, req.authHeader);
  return res.json(reports);
};

export const listAllDoctorsForAdmin = async (req, res) => {
  const doctors = await Doctor.find().sort({ created_at: -1 }).lean();
  const slotMap = await getSlotsByDoctorId(doctors.map((doctor) => doctor._id));

  return res.json(
    doctors.map((doctor) => toDoctor(doctor, slotMap.get(doctor._id) || []))
  );
};

export const getAdminOverview = async (req, res) => {
  const [totalDoctors, verifiedDoctors, totalSlots, totalPrescriptions] =
    await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ is_verified: true }),
      AvailabilitySlot.countDocuments(),
      Prescription.countDocuments()
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

  const doctor = await Doctor.findByIdAndUpdate(
    req.params.doctorId,
    {
      $set: {
        is_verified: Boolean(req.body.is_verified)
      }
    },
    {
      new: true
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
