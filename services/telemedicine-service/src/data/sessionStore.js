import crypto from "crypto";

const sessions = new Map();
const appointmentIndex = new Map();
const sessionEvents = new Map();

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

export const createSessionForAppointment = ({
  appointmentId,
  patientId,
  doctorId,
  provider,
  scheduledAt
}) => {
  const existingId = appointmentIndex.get(appointmentId);

  if (existingId) {
    return {
      created: false,
      session: clone(sessions.get(existingId))
    };
  }

  const session = {
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
    recordingUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  sessions.set(session.id, session);
  appointmentIndex.set(appointmentId, session.id);
  sessionEvents.set(session.id, []);

  return {
    created: true,
    session: clone(session)
  };
};

export const getSessionByAppointmentId = (appointmentId) => {
  const sessionId = appointmentIndex.get(appointmentId);

  if (!sessionId) {
    return null;
  }

  return clone(sessions.get(sessionId));
};

export const getSessionRecordById = (sessionId) => {
  const session = sessions.get(sessionId);
  return session ? clone(session) : null;
};

export const getEventsBySessionId = (sessionId) => {
  return clone(sessionEvents.get(sessionId) || []);
};

export const storeSessionEvent = (
  sessionId,
  { eventType, participantId, participantRole, participantName }
) => {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  const event = {
    id: crypto.randomUUID(),
    sessionId,
    eventType,
    participantId,
    participantRole,
    participantName,
    occurredAt: new Date().toISOString()
  };

  const events = sessionEvents.get(sessionId) || [];
  events.push(event);
  sessionEvents.set(sessionId, events);

  session.updatedAt = new Date().toISOString();

  return clone(event);
};

export const markSessionStarted = (sessionId) => {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (!session.startedAt) {
    session.startedAt = new Date().toISOString();
  }

  session.status = "live";
  session.updatedAt = new Date().toISOString();

  return clone(session);
};

export const completeSessionById = (sessionId) => {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  session.status = "completed";
  session.endedAt = new Date().toISOString();
  session.durationSeconds = calculateDurationSeconds(session);
  session.updatedAt = new Date().toISOString();

  return clone(session);
};
