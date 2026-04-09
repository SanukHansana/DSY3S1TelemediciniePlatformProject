import express from "express";

import {
  completeSession,
  createOrGetSession,
  getAppointmentSession,
  getSessionById,
  getSessionEvents,
  logSessionEvent
} from "../controllers/session.controller.js";

const router = express.Router();

router.post("/appointment/:appointmentId", createOrGetSession);
router.get("/appointment/:appointmentId", getAppointmentSession);
router.get("/:sessionId", getSessionById);
router.get("/:sessionId/events", getSessionEvents);
router.post("/:sessionId/events", logSessionEvent);
router.patch("/:sessionId/complete", completeSession);

export default router;
