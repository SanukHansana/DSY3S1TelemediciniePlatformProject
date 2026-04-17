import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { getAvailableDoctors, getDoctorSlots } from "../services/doctorApi";
import {
  createPatientAppointment,
  downloadPatientReport,
  getMyPatientMedicalHistory,
  getMyPatientProfile,
  updateMyPatientProfile,
  uploadPatientReport
} from "../services/patientApi";

const emptyProfile = {
  full_name: "",
  email: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  address: "",
  emergency_contact: "",
  blood_group: "",
  allergies: "",
  chronic_conditions: ""
};

const emptyAppointment = {
  doctor_id: "",
  slot_id: "",
  scheduled_at: "",
  patient_notes: ""
};

const emptyReport = {
  title: "",
  category: "general",
  description: "",
  file: null
};

const toCsv = (value) => (Array.isArray(value) ? value.join(", ") : "");

const fromCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "Not set";

const formatSlotLabel = (slot) => {
  if (slot.specific_date) {
    return new Date(slot.specific_date).toLocaleString();
  }

  return [slot.day_of_week, `${slot.start_time} - ${slot.end_time}`]
    .filter(Boolean)
    .join(" | ");
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Could not read the selected file"));
    reader.readAsDataURL(file);
  });

const saveDownload = ({ blob, fileName }) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function PatientDashboard() {
  const { token, user } = useContext(AuthContext);
  const currentRole = user?.role || localStorage.getItem("role");
  const [profile, setProfile] = useState(emptyProfile);
  const [history, setHistory] = useState({
    reports: [],
    appointments: [],
    prescriptions: []
  });
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);
  const [reportForm, setReportForm] = useState(emptyReport);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [booking, setBooking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const [profileData, historyData, doctorData] = await Promise.all([
        getMyPatientProfile(token),
        getMyPatientMedicalHistory(token),
        getAvailableDoctors()
      ]);

      setProfile({
        full_name: profileData.full_name || "",
        email: profileData.email || "",
        date_of_birth: profileData.date_of_birth
          ? String(profileData.date_of_birth).slice(0, 10)
          : "",
        gender: profileData.gender || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        emergency_contact: profileData.emergency_contact || "",
        blood_group: profileData.blood_group || "",
        allergies: toCsv(profileData.allergies),
        chronic_conditions: toCsv(profileData.chronic_conditions)
      });
      setHistory({
        reports: Array.isArray(historyData?.reports) ? historyData.reports : [],
        appointments: Array.isArray(historyData?.appointments)
          ? historyData.appointments
          : [],
        prescriptions: Array.isArray(historyData?.prescriptions)
          ? historyData.prescriptions
          : []
      });
      setDoctors(Array.isArray(doctorData) ? doctorData : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load the patient dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [token]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!appointmentForm.doctor_id) {
        setSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        const data = await getDoctorSlots(appointmentForm.doctor_id);
        setSlots(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError.message || "Could not load doctor slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [appointmentForm.doctor_id]);

  if (!token) {
    return (
      <section className="panel">
        <h2>Patient Dashboard</h2>
        <p className="form-hint">Login with a patient account to use patient services.</p>
        <Link className="primary-button inline-button" to="/login">
          Go to login
        </Link>
      </section>
    );
  }

  if (currentRole !== "patient") {
    return (
      <section className="panel">
        <h2>Patient Dashboard</h2>
        <p className="status-message error">
          This page is available only for patient accounts.
        </p>
      </section>
    );
  }

  const handleProfileSave = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setMessage("");
      setError("");
      await updateMyPatientProfile(token, {
        ...profile,
        allergies: fromCsv(profile.allergies),
        chronic_conditions: fromCsv(profile.chronic_conditions)
      });
      setMessage("Profile saved.");
    } catch (saveError) {
      setError(saveError.message || "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAppointmentCreate = async (event) => {
    event.preventDefault();

    try {
      setBooking(true);
      setMessage("");
      setError("");
      await createPatientAppointment(token, {
        doctor_id: appointmentForm.doctor_id,
        slot_id: appointmentForm.slot_id || null,
        scheduled_at: appointmentForm.scheduled_at,
        appointment_type: "video",
        patient_notes: appointmentForm.patient_notes
      });
      setAppointmentForm(emptyAppointment);
      setSlots([]);
      await loadDashboard();
      setMessage("Appointment booked successfully.");
    } catch (bookingError) {
      setError(bookingError.message || "Could not create appointment");
    } finally {
      setBooking(false);
    }
  };

  const handleReportUpload = async (event) => {
    event.preventDefault();

    if (!reportForm.file) {
      setError("Choose a report file first");
      return;
    }

    try {
      setUploading(true);
      setMessage("");
      setError("");
      const contentBase64 = await fileToBase64(reportForm.file);

      await uploadPatientReport(token, {
        title: reportForm.title || reportForm.file.name,
        category: reportForm.category,
        description: reportForm.description,
        file_name: reportForm.file.name,
        mime_type: reportForm.file.type || "application/octet-stream",
        content_base64: contentBase64
      });

      setReportForm(emptyReport);
      await loadDashboard();
      setMessage("Report uploaded successfully.");
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload report");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (reportId, fileName) => {
    try {
      const result = await downloadPatientReport(token, reportId);
      saveDownload({
        blob: result.blob,
        fileName: fileName || result.fileName
      });
    } catch (downloadError) {
      setError(downloadError.message || "Could not download report");
    }
  };

  if (loading) {
    return (
      <section className="panel">
        <h2>Patient Dashboard</h2>
        <p>Loading patient services...</p>
      </section>
    );
  }

  return (
    <div className="dashboard-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Patient Service</p>
            <h2>Profile, appointments, reports, and prescriptions</h2>
          </div>
        </div>
        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">My Profile</p>
              <h3>Update patient details</h3>
            </div>
          </div>

          <form className="field-grid" onSubmit={handleProfileSave}>
            <input placeholder="Full name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            <input placeholder="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <input type="date" value={profile.date_of_birth} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} />
            <input placeholder="Gender" value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} />
            <input placeholder="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            <input placeholder="Blood group" value={profile.blood_group} onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })} />
            <input className="full-span" placeholder="Emergency contact" value={profile.emergency_contact} onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })} />
            <textarea className="full-span" rows="3" placeholder="Address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            <input className="full-span" placeholder="Allergies (comma separated)" value={profile.allergies} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} />
            <input className="full-span" placeholder="Chronic conditions (comma separated)" value={profile.chronic_conditions} onChange={(e) => setProfile({ ...profile, chronic_conditions: e.target.value })} />
            <button className="primary-button inline-button" disabled={savingProfile} type="submit">
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Book Appointment</p>
              <h3>Create a patient appointment</h3>
            </div>
          </div>

          <form className="field-grid" onSubmit={handleAppointmentCreate}>
            <select
              value={appointmentForm.doctor_id}
              onChange={(event) =>
                setAppointmentForm({
                  ...appointmentForm,
                  doctor_id: event.target.value,
                  slot_id: "",
                  scheduled_at: ""
                })
              }
              required
            >
              <option value="">Select doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.full_name} - {doctor.specialty || "General"}
                </option>
              ))}
            </select>

            <select
              value={appointmentForm.slot_id}
              onChange={(event) => {
                const slot = slots.find((entry) => entry._id === event.target.value);
                setAppointmentForm({
                  ...appointmentForm,
                  slot_id: event.target.value,
                  scheduled_at: slot?.specific_date
                    ? new Date(slot.specific_date).toISOString().slice(0, 16)
                    : appointmentForm.scheduled_at
                });
              }}
              disabled={!appointmentForm.doctor_id || loadingSlots}
            >
              <option value="">
                {loadingSlots ? "Loading slots..." : "Optional slot selection"}
              </option>
              {slots.map((slot) => (
                <option key={slot._id} value={slot._id}>
                  {formatSlotLabel(slot)}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={appointmentForm.scheduled_at}
              onChange={(event) =>
                setAppointmentForm({
                  ...appointmentForm,
                  scheduled_at: event.target.value
                })
              }
              required
            />

            <textarea
              className="full-span"
              rows="3"
              placeholder="Patient notes"
              value={appointmentForm.patient_notes}
              onChange={(event) =>
                setAppointmentForm({
                  ...appointmentForm,
                  patient_notes: event.target.value
                })
              }
            />

            <button className="primary-button inline-button" disabled={booking} type="submit">
              {booking ? "Booking..." : "Book appointment"}
            </button>
          </form>
        </article>
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Medical Reports</p>
              <h3>Upload patient files</h3>
            </div>
          </div>

          <form className="field-grid" onSubmit={handleReportUpload}>
            <input placeholder="Report title" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} />
            <input placeholder="Category" value={reportForm.category} onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })} />
            <textarea className="full-span" rows="3" placeholder="Description" value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })} />
            <input className="full-span" type="file" onChange={(e) => setReportForm({ ...reportForm, file: e.target.files?.[0] || null })} />
            <button className="primary-button inline-button" disabled={uploading} type="submit">
              {uploading ? "Uploading..." : "Upload report"}
            </button>
          </form>

          <div className="simple-list">
            {history.reports.map((report) => (
              <div className="summary-card simple-item" key={report._id}>
                <strong>{report.title}</strong>
                <span className="form-hint">{report.file_name}</span>
                <button className="secondary-button inline-button" onClick={() => handleDownload(report._id, report.file_name)} type="button">
                  Download
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Medical History</p>
              <h3>Appointments and prescriptions</h3>
            </div>
          </div>

          <div className="simple-list">
            {history.appointments.map((appointment) => (
              <div className="summary-card simple-item" key={appointment._id}>
                <strong>{formatDateTime(appointment.scheduled_at)}</strong>
                <span className="form-hint">
                  Doctor: {appointment.doctor_id} | Status: {appointment.status}
                </span>
                <Link className="ghost-link" to={`/consultation/${appointment._id}?role=patient`}>
                  Join consultation
                </Link>
              </div>
            ))}

            {history.prescriptions.map((prescription) => (
              <div className="summary-card simple-item" key={prescription._id}>
                <strong>{prescription.diagnosis}</strong>
                <span className="form-hint">
                  {Array.isArray(prescription.medications)
                    ? prescription.medications
                        .map((item) => item.medication_name)
                        .filter(Boolean)
                        .join(", ")
                    : "No medications"}
                </span>
              </div>
            ))}

            {!history.appointments.length && !history.prescriptions.length ? (
              <div className="empty-state">
                <p>No appointments or prescriptions yet.</p>
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
