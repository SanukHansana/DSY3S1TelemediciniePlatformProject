const API = "http://localhost:5001/api";

export const getAvailableDoctors = async () => {
  const res = await fetch(`${API}/doctors`);
  return res.json();
};

export const getDoctorSlots = async (doctorId) => {
  const res = await fetch(`${API}/doctors/${doctorId}/slots`);
  return res.json();
};