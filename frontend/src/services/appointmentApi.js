const API = "http://localhost:4003/api/appointments";

export const createAppointment = async (data) => {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return res.json();
};

export const getAppointments = async () => {
  const res = await fetch(API);
  return res.json();
};