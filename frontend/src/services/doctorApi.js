import { apiRequest } from "./apiClient";

const API = "/api/doctors";

export const getAvailableDoctors = () => apiRequest(API);

export const getDoctorSlots = (doctorId) =>
  apiRequest(`${API}/${doctorId}/slots`);

export const getMyDoctorProfile = (token) =>
  apiRequest(`${API}/me`, { token });

export const updateMyDoctorProfile = (token, payload) =>
  apiRequest(`${API}/me`, {
    method: "PUT",
    token,
    body: payload
  });

export const getMyDoctorAvailability = (token) =>
  apiRequest(`${API}/me/availability`, { token });

export const createDoctorAvailability = (token, payload) =>
  apiRequest(`${API}/me/availability`, {
    method: "POST",
    token,
    body: payload
  });

export const updateDoctorAvailability = (token, slotId, payload) =>
  apiRequest(`${API}/me/availability/${slotId}`, {
    method: "PUT",
    token,
    body: payload
  });

export const deleteDoctorAvailability = (token, slotId) =>
  apiRequest(`${API}/me/availability/${slotId}`, {
    method: "DELETE",
    token
  });

export const getMyDoctorAppointments = (token) =>
  apiRequest(`${API}/me/appointments`, { token });

export const updateDoctorAppointmentStatus = (token, appointmentId, payload) =>
  apiRequest(`${API}/appointments/${appointmentId}/status`, {
    method: "PATCH",
    token,
    body: payload
  });

export const createDoctorPrescription = (token, payload) =>
  apiRequest(`${API}/prescriptions`, {
    method: "POST",
    token,
    body: payload
  });

export const getMyDoctorPrescriptions = (token) =>
  apiRequest(`${API}/me/prescriptions`, { token });

export const getPatientReportsForDoctor = (token, patientId) =>
  apiRequest(`${API}/patients/${patientId}/reports`, { token });
