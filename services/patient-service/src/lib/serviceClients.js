const APPOINTMENT_SERVICE_URL =
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:4003";
const DOCTOR_SERVICE_URL =
  process.env.DOCTOR_SERVICE_URL || "http://localhost:4002";
const TELEMEDICINE_SERVICE_URL =
  process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:4004";

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

export const createAppointment = async (payload) =>
  requestJson(`${APPOINTMENT_SERVICE_URL}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

export const getPrescriptionsForPatient = async (patientId, authHeader) =>
  requestJson(
    `${DOCTOR_SERVICE_URL}/api/doctors/prescriptions/patient/${patientId}`,
    {
      headers: authHeader
        ? {
            Authorization: authHeader
          }
        : {}
    }
  );

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
