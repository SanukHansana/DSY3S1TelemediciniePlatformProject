import crypto from "crypto";
import { Session } from "../models/Session.js";
import { SessionEvent } from "../models/SessionEvent.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

const buildRoomName = (appointmentId) => {
  const compactId = appointmentId.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "room";
  const suffix = crypto.randomUUID().split("-")[0];

  return `telemed-${compactId}-${suffix}`;
};

const calculateDurationSeconds = (session) => {
  if (!session.startedAt || !session.endedAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
    )
  );
};

export const createSessionForAppointment = async ({
  appointmentId,
  patientId,
  doctorId,
  provider,
  scheduledAt
}) => {
  try {
    const existingSession = await Session.findByAppointmentId(appointmentId);

    if (existingSession) {
      return {
        created: false,
        session: clone(existingSession.toJSON())
      };
    }

    const sessionData = {
      id: crypto.randomUUID(),
      appointmentId,
      patientId,
      doctorId,
      provider,
      roomName: buildRoomName(appointmentId),
      status: "created",
      scheduledAt,
      startedAt: null,
      endedAt: null,
      durationSeconds: 0,
      recordingUrl: null
    };

    const session = await Session.create(sessionData);

    return {
      created: true,
      session: clone(session.toJSON())
    };
  } catch (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
};

export const getSessionByAppointmentId = async (appointmentId) => {
  try {
    const session = await Session.findByAppointmentId(appointmentId);
    return session ? clone(session.toJSON()) : null;
  } catch (error) {
    throw new Error(`Failed to get session by appointment ID: ${error.message}`);
  }
};

export const getSessionRecordById = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId);
    return session ? clone(session.toJSON()) : null;
  } catch (error) {
    throw new Error(`Failed to get session by ID: ${error.message}`);
  }
};

export const getEventsBySessionId = async (sessionId) => {
  try {
    const events = await SessionEvent.findBySessionId(sessionId);
    return clone(events.map(event => event.toJSON()));
  } catch (error) {
    throw new Error(`Failed to get events by session ID: ${error.message}`);
  }
};

export const storeSessionEvent = async (
  sessionId,
  { eventType, participantId, participantRole, participantName }
) => {
  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return null;
    }

    const eventData = {
      id: crypto.randomUUID(),
      eventType,
      participantId,
      participantRole,
      participantName
    };

    const event = await SessionEvent.create(sessionId, eventData);

    // Update session's updatedAt timestamp
    await session.update({});

    return clone(event.toJSON());
  } catch (error) {
    throw new Error(`Failed to store session event: ${error.message}`);
  }
};

export const markSessionStarted = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return null;
    }

    const updates = { status: "live" };
    if (!session.startedAt) {
      updates.startedAt = new Date().toISOString();
    }

    const updatedSession = await session.update(updates);

    return clone(updatedSession.toJSON());
  } catch (error) {
    throw new Error(`Failed to mark session started: ${error.message}`);
  }
};

export const completeSessionById = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return null;
    }

    const endedAt = new Date().toISOString();
    const durationSeconds = calculateDurationSeconds({
      ...session,
      endedAt
    });

    const updatedSession = await session.update({
      status: "completed",
      endedAt,
      durationSeconds
    });

    return clone(updatedSession.toJSON());
  } catch (error) {
    throw new Error(`Failed to complete session: ${error.message}`);
  }
};
