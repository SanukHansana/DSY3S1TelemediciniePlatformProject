import express from "express";
import {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getStatusLogs
} from "../controllers/appointment.controller.js";

const router = express.Router();

router.post("/", createAppointment);
router.get("/", getAppointments);
router.get("/:id", getAppointment);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

router.get("/:id/status", getStatusLogs);

export default router;