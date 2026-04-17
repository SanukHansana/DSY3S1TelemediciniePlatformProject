import { apiRequest, downloadFile } from "./apiClient";

const API = "/api/patients";

export const getMyPatientProfile = (token) =>
  apiRequest(`${API}/me`, { token });

export const updateMyPatientProfile = (token, payload) =>
  apiRequest(`${API}/me`, {
    method: "PUT",
    token,
    body: payload
  });

export const getMyPatientReports = (token) =>
  apiRequest(`${API}/me/reports`, { token });

export const uploadPatientReport = (token, payload) =>
  apiRequest(`${API}/me/reports`, {
    method: "POST",
    token,
    body: payload
  });

export const downloadPatientReport = (token, reportId) =>
  downloadFile(`${API}/reports/${reportId}/file`, token);

export const getMyPatientAppointments = (token) =>
  apiRequest(`${API}/me/appointments`, { token });

export const createPatientAppointment = (token, payload) =>
  apiRequest(`${API}/me/appointments`, {
    method: "POST",
    token,
    body: payload
  });

export const getMyPatientPrescriptions = (token) =>
  apiRequest(`${API}/me/prescriptions`, { token });

export const getMyPatientMedicalHistory = (token) =>
  apiRequest(`${API}/me/medical-history`, { token });
