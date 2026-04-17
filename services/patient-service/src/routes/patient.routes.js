import express, { Router } from "express";

import {
  createConsultationSession,
  createMyAppointment,
  deleteMyAppointment,
  deleteMyReport,
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
  updateMyAppointment,
  updateMyProfile,
  updateMyReport,
  uploadReport
} from "../controllers/patient.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
const rawReportUpload = express.raw({
  type: "application/octet-stream",
  limit: "25mb"
});

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
  rawReportUpload,
  uploadReport
);
router.get(
  "/me/reports",
  authenticate,
  authorize("patient"),
  listMyReports
);
router.put(
  "/me/reports/:reportId",
  authenticate,
  authorize("patient"),
  updateMyReport
);
router.delete(
  "/me/reports/:reportId",
  authenticate,
  authorize("patient"),
  deleteMyReport
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
router.put(
  "/me/appointments/:appointmentId",
  authenticate,
  authorize("patient"),
  updateMyAppointment
);
router.delete(
  "/me/appointments/:appointmentId",
  authenticate,
  authorize("patient"),
  deleteMyAppointment
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
