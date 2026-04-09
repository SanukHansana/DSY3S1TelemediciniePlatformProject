const API = "http://localhost:4004/api/sessions";

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

export const createOrGetSession = async (appointmentId, payload) => {
  const response = await fetch(`${API}/appointment/${appointmentId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
};

export const logSessionEvent = async (sessionId, payload) => {
  const response = await fetch(`${API}/${sessionId}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
};

export const completeSession = async (sessionId, payload) => {
  const response = await fetch(`${API}/${sessionId}/complete`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
};
