import {
  completeSessionById,
  createSessionForAppointment,
  getEventsBySessionId,
  getSessionByAppointmentId,
  getSessionRecordById,
  markSessionStarted,
  storeSessionEvent
} from "../data/sessionStore.js";
import {
  fetchAppointmentById,
  updateAppointmentStatus
} from "../services/appointmentClient.js";
import { sendConsultationCompletedNotifications } from "../services/notificationClient.js";

const allowedRoles = new Set(["patient", "doctor", "admin"]);

const buildParticipant = (body = {}) => {
  const role = allowedRoles.has(body.participantRole)
    ? body.participantRole
    : "patient";

  const safeName = typeof body.participantName === "string"
    ? body.participantName.trim()
    : "";

  return {
    id: body.participantId || `${role}-${Date.now()}`,
    role,
    name:
      safeName ||
      (role === "doctor" ? "Doctor" : role === "admin" ? "Coordinator" : "Patient")
  };
};

const respondWithSession = (res, session, participant, statusCode = 200) => {
  res.status(statusCode).json({
    session,
    participant,
    embed: {
      domain: process.env.JITSI_DOMAIN || "meet.jit.si",
      roomName: session.roomName
    }
  });
};

export const createOrGetSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const participant = buildParticipant(req.body);

    const appointment = await fetchAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const { session, created } = await createSessionForAppointment({
      appointmentId,
      patientId: appointment.patient_id,
      doctorId: appointment.doctor_id,
      scheduledAt: appointment.scheduled_at,
      provider: process.env.VIDEO_PROVIDER || "jitsi"
    });

    await storeSessionEvent(session.id, {
      eventType: created ? "session_created" : "session_reused",
      participantId: participant.id,
      participantRole: participant.role,
      participantName: participant.name
    });

    return respondWithSession(res, session, participant, created ? 201 : 200);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAppointmentSession = async (req, res) => {
  try {
    const session = await getSessionByAppointmentId(req.params.appointmentId);

    if (!session) {
      return res.status(404).json({ message: "No video session created yet" });
    }

    return res.json({ session });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await getSessionRecordById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json({ session });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSessionEvents = async (req, res) => {
  try {
    const session = await getSessionRecordById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const events = await getEventsBySessionId(req.params.sessionId);

    return res.json({ events });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const logSessionEvent = async (req, res) => {
  try {
    const session = await getSessionRecordById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const participant = buildParticipant(req.body);
    const eventType = req.body.eventType || "custom_event";

    const event = await storeSessionEvent(req.params.sessionId, {
      eventType,
      participantId: participant.id,
      participantRole: participant.role,
      participantName: participant.name
    });

    if (eventType === "conference_joined") {
      const updatedSession = await markSessionStarted(req.params.sessionId);

      if (updatedSession?.status === "live") {
        await updateAppointmentStatus(updatedSession.appointmentId, "in-consultation");
      }
    }

    return res.status(201).json({ event });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const completeSession = async (req, res) => {
  try {
    const session = await completeSessionById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const participant = buildParticipant(req.body);

    await storeSessionEvent(session.id, {
      eventType: "session_completed",
      participantId: participant.id,
      participantRole: participant.role,
      participantName: participant.name
    });

    const appointment = await updateAppointmentStatus(session.appointmentId, "completed");

    if (appointment) {
      await sendConsultationCompletedNotifications({ appointment });
    }

    return res.json({ session });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
