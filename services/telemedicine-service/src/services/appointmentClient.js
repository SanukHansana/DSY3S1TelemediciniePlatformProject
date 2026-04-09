const APPOINTMENT_SERVICE_URL =
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:4003";

const parseResponse = async (response) => {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return raw;
  }
};

export const fetchAppointmentById = async (appointmentId) => {
  const response = await fetch(
    `${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`
  );

  if (response.status === 404) {
    return null;
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch appointment");
  }

  return data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const response = await fetch(
      `${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to update appointment status");
    }

    return data;
  } catch (error) {
    console.error("Could not sync appointment status:", error.message);
    return null;
  }
};
