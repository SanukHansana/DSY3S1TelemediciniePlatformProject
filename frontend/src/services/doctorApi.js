const API = "http://localhost:4002/api";

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

export const getAvailableDoctors = async () => {
  const response = await fetch(`${API}/doctors`);
  return parseResponse(response);
};

export const getDoctorSlots = async (doctorId) => {
  const response = await fetch(`${API}/doctors/${doctorId}/slots`);
  return parseResponse(response);
};
