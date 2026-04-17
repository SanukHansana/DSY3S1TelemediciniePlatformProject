import { apiRequest, downloadFile } from "./apiClient";

const API = "/api/patients";

const parseTextPayload = (text) => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

const getErrorMessage = (payload) =>
  payload?.message || payload?.msg || payload?.error || "Request failed";

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

export const uploadPatientReport = async (token, payload) => {
  const { file, ...meta } = payload;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/octet-stream",
    "X-Report-Meta": encodeURIComponent(JSON.stringify(meta))
  };

  const response = await fetch(`${API}/me/reports`, {
    method: "POST",
    headers,
    body: file
  });

  const contentType = response.headers.get("content-type") || "";
  const responsePayload = contentType.includes("application/json")
    ? await response.json()
    : parseTextPayload(await response.text());

  if (!response.ok) {
    throw new Error(getErrorMessage(responsePayload));
  }

  return responsePayload;
};

export const downloadPatientReport = (token, reportId) =>
  downloadFile(`${API}/reports/${reportId}/file`, token);

export const updatePatientReport = (token, reportId, payload) =>
  apiRequest(`${API}/me/reports/${reportId}`, {
    method: "PUT",
    token,
    body: payload
  });

export const deletePatientReport = (token, reportId) =>
  apiRequest(`${API}/me/reports/${reportId}`, {
    method: "DELETE",
    token
  });

export const getMyPatientAppointments = (token) =>
  apiRequest(`${API}/me/appointments`, { token });

export const createPatientAppointment = (token, payload) =>
  apiRequest(`${API}/me/appointments`, {
    method: "POST",
    token,
    body: payload
  });

export const updatePatientAppointment = (token, appointmentId, payload) =>
  apiRequest(`${API}/me/appointments/${appointmentId}`, {
    method: "PUT",
    token,
    body: payload
  });

export const deletePatientAppointment = (token, appointmentId) =>
  apiRequest(`${API}/me/appointments/${appointmentId}`, {
    method: "DELETE",
    token
  });

export const getMyPatientPrescriptions = (token) =>
  apiRequest(`${API}/me/prescriptions`, { token });

export const getMyPatientMedicalHistory = (token) =>
  apiRequest(`${API}/me/medical-history`, { token });
