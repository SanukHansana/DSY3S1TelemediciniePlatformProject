const APPOINTMENT_SERVICE_URL =
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:4003";
const PATIENT_SERVICE_URL =
  process.env.PATIENT_SERVICE_URL || "http://localhost:4001";
const TELEMEDICINE_SERVICE_URL =
  process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:4004";
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5000";
const AUTH_SERVICE_API_KEY =
  process.env.AUTH_SERVICE_API_KEY || "auth-service-api-key-2024";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const parseBody = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await parseBody(response);

  if (!response.ok) {
    const error = new Error(
      data?.message || `Request failed with ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const getAppointments = async () =>
  requestJson(`${APPOINTMENT_SERVICE_URL}/api/appointments`);

export const getAppointmentById = async (appointmentId) =>
  requestJson(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`);

export const updateAppointment = async (appointmentId, payload) =>
  requestJson(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

export const deleteAppointment = async (appointmentId) =>
  requestJson(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`, {
    method: "DELETE"
  });

export const getPatientReports = async (patientId, authHeader) =>
  requestJson(`${PATIENT_SERVICE_URL}/api/patients/${patientId}/reports`, {
    headers: authHeader
      ? {
          Authorization: authHeader
        }
      : {}
  });

export const getAuthUserById = async (userId) => {
  if (!objectIdPattern.test(String(userId || ""))) {
    return null;
  }

  return requestJson(`${AUTH_SERVICE_URL}/auth/users/${userId}`, {
    headers: {
      "x-service-api-key": AUTH_SERVICE_API_KEY
    }
  });
};

export const createOrGetSession = async (appointmentId, payload) =>
  requestJson(
    `${TELEMEDICINE_SERVICE_URL}/api/sessions/appointment/${appointmentId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );
