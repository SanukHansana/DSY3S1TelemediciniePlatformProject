import { Router } from "express";

import {
  createAvailabilitySlot,
  createConsultationSession,
  getAdminOverview,
  getDoctorByPublicId,
  getDoctorSlots,
  getMyAvailability,
  getMyProfile,
  issuePrescription,
  listAllDoctorsForAdmin,
  listMyAppointments,
  listMyPrescriptions,
  listPatientReports,
  listPrescriptionsForPatient,
  listPublicDoctors,
  updateAppointmentRequest,
  updateAvailabilitySlot,
  updateDoctorVerification,
  updateMyProfile,
  deleteAvailabilitySlot
} from "../controllers/doctor.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", listPublicDoctors);
router.get("/admin/all", authenticate, authorize("admin"), listAllDoctorsForAdmin);
router.get(
  "/admin/overview",
  authenticate,
  authorize("admin"),
  getAdminOverview
);
router.patch(
  "/:doctorId/verification",
  authenticate,
  authorize("admin"),
  updateDoctorVerification
);
router.get("/me", authenticate, authorize("doctor"), getMyProfile);
router.put("/me", authenticate, authorize("doctor"), updateMyProfile);
router.get(
  "/me/availability",
  authenticate,
  authorize("doctor"),
  getMyAvailability
);
router.post(
  "/me/availability",
  authenticate,
  authorize("doctor"),
  createAvailabilitySlot
);
router.put(
  "/me/availability/:slotId",
  authenticate,
  authorize("doctor"),
  updateAvailabilitySlot
);
router.delete(
  "/me/availability/:slotId",
  authenticate,
  authorize("doctor"),
  deleteAvailabilitySlot
);
router.get(
  "/me/appointments",
  authenticate,
  authorize("doctor"),
  listMyAppointments
);
router.patch(
  "/appointments/:appointmentId/status",
  authenticate,
  authorize("doctor"),
  updateAppointmentRequest
);
router.post(
  "/appointments/:appointmentId/session",
  authenticate,
  authorize("doctor"),
  createConsultationSession
);
router.post(
  "/prescriptions",
  authenticate,
  authorize("doctor"),
  issuePrescription
);
router.get(
  "/me/prescriptions",
  authenticate,
  authorize("doctor"),
  listMyPrescriptions
);
router.get(
  "/prescriptions/patient/:patientId",
  authenticate,
  authorize("patient", "doctor", "admin"),
  listPrescriptionsForPatient
);
router.get(
  "/patients/:patientId/reports",
  authenticate,
  authorize("doctor", "admin"),
  listPatientReports
);
router.get("/:doctorId/slots", getDoctorSlots);
router.get("/:doctorId", getDoctorByPublicId);

export default router;
