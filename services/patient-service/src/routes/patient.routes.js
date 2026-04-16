import { Router } from "express";

import {
  createConsultationSession,
  createMyAppointment,
  downloadReportFile,
  getAdminOverview,
  getMyMedicalHistory,
  getMyProfile,
  getPatientMedicalHistory,
  listAllPatientsForAdmin,
  listMyAppointments,
  listMyPrescriptions,
  listMyReports,
  listPatientReports,
  updateMyProfile,
  uploadReport
} from "../controllers/patient.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/admin/all", authenticate, authorize("admin"), listAllPatientsForAdmin);
router.get(
  "/admin/overview",
  authenticate,
  authorize("admin"),
  getAdminOverview
);
router.get("/me", authenticate, authorize("patient"), getMyProfile);
router.put("/me", authenticate, authorize("patient"), updateMyProfile);
router.post(
  "/me/reports",
  authenticate,
  authorize("patient"),
  uploadReport
);
router.get(
  "/me/reports",
  authenticate,
  authorize("patient"),
  listMyReports
);
router.get(
  "/me/appointments",
  authenticate,
  authorize("patient"),
  listMyAppointments
);
router.post(
  "/me/appointments",
  authenticate,
  authorize("patient"),
  createMyAppointment
);
router.get(
  "/me/prescriptions",
  authenticate,
  authorize("patient"),
  listMyPrescriptions
);
router.get(
  "/me/medical-history",
  authenticate,
  authorize("patient"),
  getMyMedicalHistory
);
router.post(
  "/appointments/:appointmentId/session",
  authenticate,
  authorize("patient"),
  createConsultationSession
);
router.get(
  "/reports/:reportId/file",
  authenticate,
  authorize("patient", "doctor", "admin"),
  downloadReportFile
);
router.get(
  "/:patientId/reports",
  authenticate,
  authorize("patient", "doctor", "admin"),
  listPatientReports
);
router.get(
  "/:patientId/medical-history",
  authenticate,
  authorize("patient", "doctor", "admin"),
  getPatientMedicalHistory
);

export default router;
