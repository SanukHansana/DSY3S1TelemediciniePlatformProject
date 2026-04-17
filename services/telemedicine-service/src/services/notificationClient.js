const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5000";
const AUTH_SERVICE_API_KEY =
  process.env.AUTH_SERVICE_API_KEY || "auth-service-api-key-2024";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4006";
const NOTIFICATION_SERVICE_API_KEY =
  process.env.NOTIFICATION_SERVICE_API_KEY || "notification-service-api-key-2024";

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
      data?.message || data?.msg || data?.error || `Request failed with ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const getAuthUserById = async (userId) => {
  if (!objectIdPattern.test(String(userId || ""))) {
    return null;
  }

  return requestJson(`${AUTH_SERVICE_URL}/auth/users/${userId}`, {
    headers: {
      "x-service-api-key": AUTH_SERVICE_API_KEY
    }
  });
};

const getDateParts = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "Not specified",
      time: "Not specified"
    };
  }

  return {
    date: date.toLocaleDateString("en-LK"),
    time: date.toLocaleTimeString("en-LK", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
};

const normalizeEmail = (value) => {
  const email = String(value || "").trim();
  return email.includes("@") ? email : "";
};

const resolveName = (...values) =>
  values.map((value) => String(value || "").trim()).find(Boolean) || "";

const buildPayload = ({ appointment, patient, doctor, recipient }) => {
  const dateParts = getDateParts(appointment.scheduled_at);
  const appointmentId = appointment._id || appointment.id;

  return {
    email: recipient.email,
    recipientName: recipient.name,
    patientName: patient.name,
    doctorName: doctor.name,
    appointmentId,
    appointmentDate: dateParts.date,
    appointmentTime: dateParts.time,
    patient: {
      id: appointment.patient_id,
      name: patient.name,
      email: patient.email
    },
    doctor: {
      id: appointment.doctor_id,
      name: doctor.name,
      email: doctor.email
    },
    appointment: {
      id: appointmentId,
      date: dateParts.date,
      time: dateParts.time,
      scheduledAt: appointment.scheduled_at,
      status: appointment.status,
      type: appointment.appointment_type
    }
  };
};

const sendEmailNotification = async ({ recipientId, recipientRole, eventType, payload }) =>
  requestJson(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-service-api-key": NOTIFICATION_SERVICE_API_KEY
    },
    body: JSON.stringify({
      recipientId,
      recipientRole,
      channel: "EMAIL",
      eventType,
      payload
    })
  });

export const sendConsultationCompletedNotifications = async ({ appointment }) => {
  try {
    const [patientUserResult, doctorUserResult] = await Promise.allSettled([
      getAuthUserById(appointment.patient_id),
      getAuthUserById(appointment.doctor_id)
    ]);

    const patientUser =
      patientUserResult.status === "fulfilled" ? patientUserResult.value : null;
    const doctorUser =
      doctorUserResult.status === "fulfilled" ? doctorUserResult.value : null;

    const patient = {
      name: resolveName(patientUser?.name, "Patient"),
      email: normalizeEmail(patientUser?.email)
    };
    const doctor = {
      name: resolveName(doctorUser?.name, "Doctor"),
      email: normalizeEmail(doctorUser?.email)
    };

    const recipients = [
      {
        id: appointment.patient_id,
        role: "PATIENT",
        name: patient.name,
        email: patient.email
      },
      {
        id: appointment.doctor_id,
        role: "DOCTOR",
        name: doctor.name,
        email: doctor.email
      }
    ].filter((recipient) => objectIdPattern.test(String(recipient.id || "")) && recipient.email);

    await Promise.allSettled(
      recipients.map((recipient) =>
        sendEmailNotification({
          recipientId: recipient.id,
          recipientRole: recipient.role,
          eventType: "CONSULTATION_COMPLETED",
          payload: buildPayload({
            appointment,
            patient,
            doctor,
            recipient
          })
        })
      )
    );
  } catch (error) {
    console.error("Could not send consultation completion emails:", error.message);
  }
};
