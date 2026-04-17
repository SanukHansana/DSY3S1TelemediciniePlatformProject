import { apiRequest, downloadFile } from "./apiClient";

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

export const deleteDoctorAppointment = (token, appointmentId) =>
  apiRequest(`${API}/appointments/${appointmentId}`, {
    method: "DELETE",
    token
  });

export const createDoctorPrescription = (token, payload) =>
  apiRequest(`${API}/prescriptions`, {
    method: "POST",
    token,
    body: payload
  });

export const updateDoctorPrescription = (token, prescriptionId, payload) =>
  apiRequest(`${API}/prescriptions/${prescriptionId}`, {
    method: "PUT",
    token,
    body: payload
  });

export const deleteDoctorPrescription = (token, prescriptionId) =>
  apiRequest(`${API}/prescriptions/${prescriptionId}`, {
    method: "DELETE",
    token
  });

export const requestDoctorPrescriptionSignature = (
  token,
  prescriptionId,
  payload
) =>
  apiRequest(`${API}/prescriptions/${prescriptionId}/signature-request`, {
    method: "POST",
    token,
    body: payload
  });

export const refreshPrescriptionSignatureStatus = (token, prescriptionId) =>
  apiRequest(`${API}/prescriptions/${prescriptionId}/signature-status`, {
    method: "POST",
    token
  });

export const downloadSignedPrescriptionPdf = (token, prescriptionId) =>
  downloadFile(`${API}/prescriptions/${prescriptionId}/signed-pdf`, token);

export const getMyDoctorPrescriptions = (token) =>
  apiRequest(`${API}/me/prescriptions`, { token });

export const getPatientReportsForDoctor = (token, patientId) =>
  apiRequest(`${API}/patients/${patientId}/reports`, { token });
