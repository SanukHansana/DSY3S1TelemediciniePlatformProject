const API = "http://localhost:4003/api/appointments";

const parseResponse = async (response) => {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
};

export const createAppointment = async (data) => {
  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return parseResponse(response);
};

export const getAppointments = async () => {
  const response = await fetch(API);
  return parseResponse(response);
};

export const getAppointment = async (appointmentId) => {
  const response = await fetch(`${API}/${appointmentId}`);
  return parseResponse(response);
};
