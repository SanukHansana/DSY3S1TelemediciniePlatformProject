import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import {
  downloadSignedPrescriptionPdf,
  getAvailableDoctors,
  getDoctorSlots,
  refreshPrescriptionSignatureStatus
} from "../services/doctorApi";
import {
  createPatientAppointment,
  deletePatientAppointment,
  deletePatientReport,
  downloadPatientReport,
  getMyPatientMedicalHistory,
  getMyPatientProfile,
  updatePatientAppointment,
  updateMyPatientProfile,
  updatePatientReport,
  uploadPatientReport
} from "../services/patientApi";
import { downloadPrescriptionPdf } from "../utils/prescriptionPdf";

const patientTabs = [
  {
    key: "profile",
    label: "Profile",
    description: "Manage your patient details"
  },
  {
    key: "appointments",
    label: "Appointments",
    description: "Book and track consultations"
  },
  {
    key: "reports",
    label: "Reports",
    description: "Upload and download medical files"
  },
  {
    key: "prescriptions",
    label: "Prescriptions",
    description: "View your issued prescriptions"
  }
];

const PATIENT_PROFILE_PREFILL_KEY = "patient_profile_prefill";
const LAST_LOGIN_EMAIL_KEY = "last_login_email";

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

const formatDateTimeInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Not set";

const formatSignatureStatus = (signature = {}) => {
  const status = signature.status || "not_sent";

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatSlotLabel = (slot) => {
  if (slot.specific_date) {
    return new Date(slot.specific_date).toLocaleString();
  }

  return [slot.day_of_week, `${slot.start_time} - ${slot.end_time}`]
    .filter(Boolean)
    .join(" | ");
};

const saveDownload = ({ blob, fileName }) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const getPatientProfilePrefill = () => {
  const lastLoginEmail = String(
    localStorage.getItem(LAST_LOGIN_EMAIL_KEY) || ""
  ).trim();

  try {
    const raw = localStorage.getItem(PATIENT_PROFILE_PREFILL_KEY);

    if (!raw) {
      return {
        full_name: "",
        email: lastLoginEmail
      };
    }

    const parsed = JSON.parse(raw);

    if (parsed?.role !== "patient") {
      return {
        full_name: "",
        email: lastLoginEmail
      };
    }

    if (lastLoginEmail && parsed.email && parsed.email !== lastLoginEmail) {
      return {
        full_name: "",
        email: lastLoginEmail
      };
    }

    return {
      full_name: parsed.name || "",
      email: parsed.email || lastLoginEmail
    };
  } catch (error) {
    return {
      full_name: "",
      email: lastLoginEmail
    };
  }
};

const persistPatientProfilePrefill = (profileData = {}) => {
  const nextEmail = String(profileData.email || "").trim();
  const nextName = String(profileData.full_name || "").trim();

  if (!nextEmail && !nextName) {
    return;
  }

  localStorage.setItem(
    PATIENT_PROFILE_PREFILL_KEY,
    JSON.stringify({
      role: "patient",
      name: nextName,
      email: nextEmail
    })
  );
};

const mapProfileToForm = (profileData = {}) => {
  const fallback = getPatientProfilePrefill();

  return {
    full_name: profileData.full_name || fallback.full_name || "",
    email: profileData.email || fallback.email || "",
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
  };
};

const resolveTab = (value) =>
  patientTabs.some((tab) => tab.key === value) ? value : "profile";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const currentRole = user?.role || localStorage.getItem("role");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTab(searchParams.get("tab"));

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
  const [editingAppointmentId, setEditingAppointmentId] = useState("");
  const [editingReportId, setEditingReportId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [booking, setBooking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshingSignatureId, setRefreshingSignatureId] = useState("");
  const [downloadingSignedId, setDownloadingSignedId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedDoctor = doctors.find(
    (doctor) => doctor._id === appointmentForm.doctor_id
  );
  const selectedDoctorFee = Number(selectedDoctor?.consultation_fee) || 0;

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((entry) => entry._id === doctorId);
    return doctor?.full_name || doctorId || "Unknown doctor";
  };

  const setActiveTab = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileResult, historyResult, doctorResult] =
        await Promise.allSettled([
          getMyPatientProfile(token),
          getMyPatientMedicalHistory(token),
          getAvailableDoctors()
        ]);

      const nextErrors = [];

      if (profileResult.status === "fulfilled") {
        const nextProfile = mapProfileToForm(profileResult.value);
        setProfile(nextProfile);
        persistPatientProfilePrefill(nextProfile);
      } else {
        nextErrors.push(
          profileResult.reason?.message || "Could not load patient profile"
        );
      }

      if (historyResult.status === "fulfilled") {
        const historyData = historyResult.value;
        setHistory({
          reports: Array.isArray(historyData?.reports) ? historyData.reports : [],
          appointments: Array.isArray(historyData?.appointments)
            ? historyData.appointments
            : [],
          prescriptions: Array.isArray(historyData?.prescriptions)
            ? historyData.prescriptions
            : []
        });
      } else {
        nextErrors.push(
          historyResult.reason?.message || "Could not load medical history"
        );
      }

      if (doctorResult.status === "fulfilled") {
        setDoctors(Array.isArray(doctorResult.value) ? doctorResult.value : []);
      } else {
        nextErrors.push(
          doctorResult.reason?.message || "Could not load doctor list"
        );
      }

      if (nextErrors.length > 0) {
        setError(nextErrors.join(" "));
      }
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
        <p className="form-hint">
          Login with a patient account to use patient services.
        </p>
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

      const savedProfile = await updateMyPatientProfile(token, {
        ...profile,
        allergies: fromCsv(profile.allergies),
        chronic_conditions: fromCsv(profile.chronic_conditions)
      });

      const nextProfile = mapProfileToForm(savedProfile);
      setProfile(nextProfile);
      persistPatientProfilePrefill(nextProfile);
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

      const payload = {
        doctor_id: appointmentForm.doctor_id,
        slot_id: appointmentForm.slot_id || null,
        scheduled_at: appointmentForm.scheduled_at,
        appointment_type: "video",
        patient_notes: appointmentForm.patient_notes,
        fee_amount: selectedDoctorFee || null
      };

      if (editingAppointmentId) {
        await updatePatientAppointment(token, editingAppointmentId, payload);
        setAppointmentForm(emptyAppointment);
        setEditingAppointmentId("");
        setSlots([]);
        await loadDashboard();
        setMessage("Appointment updated.");
        setActiveTab("appointments");
        return;
      }

      const appointment = await createPatientAppointment(token, payload);

      setAppointmentForm(emptyAppointment);
      setSlots([]);
      navigate("/payment", {
        state: {
          appointmentId: appointment._id || appointment.id,
          amount: selectedDoctorFee,
          patientId: appointment.patient_id || null
        }
      });
    } catch (bookingError) {
      setError(bookingError.message || "Could not save appointment");
    } finally {
      setBooking(false);
    }
  };

  const handleEditAppointment = (appointment) => {
    setAppointmentForm({
      doctor_id: appointment.doctor_id || "",
      slot_id: appointment.slot_id || "",
      scheduled_at: formatDateTimeInput(appointment.scheduled_at),
      patient_notes: appointment.patient_notes || ""
    });
    setEditingAppointmentId(appointment._id);
    setMessage("");
    setError("");
    setActiveTab("appointments");
  };

  const handleCancelAppointmentEdit = () => {
    setAppointmentForm(emptyAppointment);
    setEditingAppointmentId("");
    setSlots([]);
    setMessage("");
    setError("");
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Delete this appointment?")) {
      return;
    }

    try {
      setMessage("");
      setError("");
      await deletePatientAppointment(token, appointmentId);

      if (editingAppointmentId === appointmentId) {
        setAppointmentForm(emptyAppointment);
        setEditingAppointmentId("");
        setSlots([]);
      }

      await loadDashboard();
      setMessage("Appointment deleted.");
      setActiveTab("appointments");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete appointment");
    }
  };

  const handleReportUpload = async (event) => {
    event.preventDefault();

    if (!reportForm.title.trim()) {
      setError("Type a report title first");
      return;
    }

    try {
      setUploading(true);
      setMessage("");
      setError("");

      if (editingReportId) {
        await updatePatientReport(token, editingReportId, {
          title: reportForm.title.trim(),
          category: reportForm.category,
          description: reportForm.description
        });

        setReportForm(emptyReport);
        setEditingReportId("");
        await loadDashboard();
        setMessage("Report updated successfully.");
        setActiveTab("reports");
        return;
      }

      if (!reportForm.file) {
        setError("Choose a report file first");
        return;
      }

      await uploadPatientReport(token, {
        title: reportForm.title.trim(),
        category: reportForm.category,
        description: reportForm.description,
        file_name: reportForm.file.name,
        mime_type: reportForm.file.type || "application/octet-stream",
        file: reportForm.file
      });

      setReportForm(emptyReport);
      await loadDashboard();
      setMessage("Report uploaded successfully.");
      setActiveTab("reports");
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload report");
    } finally {
      setUploading(false);
    }
  };

  const handleEditReport = (report) => {
    setReportForm({
      title: report.title || "",
      category: report.category || "general",
      description: report.description || "",
      file: null
    });
    setEditingReportId(report._id);
    setMessage("");
    setError("");
    setActiveTab("reports");
  };

  const handleCancelReportEdit = () => {
    setReportForm(emptyReport);
    setEditingReportId("");
    setMessage("");
    setError("");
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Delete this report?")) {
      return;
    }

    try {
      setMessage("");
      setError("");
      await deletePatientReport(token, reportId);

      if (editingReportId === reportId) {
        setReportForm(emptyReport);
        setEditingReportId("");
      }

      await loadDashboard();
      setMessage("Report deleted.");
      setActiveTab("reports");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete report");
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

  const handleAppointmentPayment = (appointment) => {
    navigate("/payment", {
      state: {
        appointmentId: appointment._id || appointment.id,
        amount: appointment.fee_amount || 0,
        patientId: appointment.patient_id || null
      }
    });
  };

  const handlePrescriptionDownload = async (prescription) => {
    try {
      setError("");
      await downloadPrescriptionPdf({
        prescription,
        patient: profile
      });
    } catch (downloadError) {
      setError(downloadError.message || "Could not download prescription PDF");
    }
  };

  const handleRefreshPrescriptionSignature = async (prescriptionId) => {
    try {
      setRefreshingSignatureId(prescriptionId);
      setMessage("");
      setError("");
      await refreshPrescriptionSignatureStatus(token, prescriptionId);
      await loadDashboard();
      setMessage("Prescription signature status refreshed.");
      setActiveTab("prescriptions");
    } catch (signatureError) {
      setError(signatureError.message || "Could not refresh signature status");
    } finally {
      setRefreshingSignatureId("");
    }
  };

  const handleSignedPrescriptionDownload = async (prescription) => {
    try {
      setDownloadingSignedId(prescription._id);
      setMessage("");
      setError("");
      const result = await downloadSignedPrescriptionPdf(token, prescription._id);

      saveDownload({
        blob: result.blob,
        fileName:
          result.fileName ||
          prescription.signature?.file_name ||
          `signed-prescription-${prescription._id}.pdf`
      });
    } catch (downloadError) {
      setError(downloadError.message || "Could not download signed prescription");
    } finally {
      setDownloadingSignedId("");
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
            <h2>Manage your profile, appointments, reports, and prescriptions</h2>
          </div>
        </div>
        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}
      </section>

      <section className="patient-dashboard-shell">
        <aside className="panel patient-dashboard-nav">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Patient</p>
              <h3>Quick Sections</h3>
            </div>
          </div>

          <div className="patient-tab-list">
            {patientTabs.map((tab) => (
              <button
                key={tab.key}
                className={`patient-tab-button${
                  activeTab === tab.key ? " patient-tab-button--active" : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <span className="patient-tab-label">{tab.label}</span>
                <span className="patient-tab-description">{tab.description}</span>
                {tab.key === "appointments" ? (
                  <span className="patient-tab-meta">
                    {history.appointments.length} booked
                  </span>
                ) : null}
                {tab.key === "reports" ? (
                  <span className="patient-tab-meta">
                    {history.reports.length} uploaded
                  </span>
                ) : null}
                {tab.key === "prescriptions" ? (
                  <span className="patient-tab-meta">
                    {history.prescriptions.length} available
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </aside>

        <div className="patient-dashboard-main">
          {activeTab === "profile" ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">My Profile</p>
                  <h3>Update patient details</h3>
                </div>
              </div>

              <form className="field-grid" onSubmit={handleProfileSave}>
                <input
                  placeholder="Full name"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                />
                <input
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) =>
                    setProfile({ ...profile, date_of_birth: e.target.value })
                  }
                />
                <input
                  placeholder="Gender"
                  value={profile.gender}
                  onChange={(e) =>
                    setProfile({ ...profile, gender: e.target.value })
                  }
                />
                <input
                  placeholder="Phone"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
                <input
                  placeholder="Blood group"
                  value={profile.blood_group}
                  onChange={(e) =>
                    setProfile({ ...profile, blood_group: e.target.value })
                  }
                />
                <input
                  className="full-span"
                  placeholder="Emergency contact"
                  value={profile.emergency_contact}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      emergency_contact: e.target.value
                    })
                  }
                />
                <textarea
                  className="full-span"
                  rows="3"
                  placeholder="Address"
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                />
                <input
                  className="full-span"
                  placeholder="Allergies (comma separated)"
                  value={profile.allergies}
                  onChange={(e) =>
                    setProfile({ ...profile, allergies: e.target.value })
                  }
                />
                <input
                  className="full-span"
                  placeholder="Chronic conditions (comma separated)"
                  value={profile.chronic_conditions}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      chronic_conditions: e.target.value
                    })
                  }
                />
                <button
                  className="primary-button inline-button"
                  disabled={savingProfile}
                  type="submit"
                >
                  {savingProfile ? "Saving..." : "Save profile"}
                </button>
              </form>
            </article>
          ) : null}

          {activeTab === "appointments" ? (
            <div className="dashboard-stack">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Book Appointment</p>
                    <h3>
                      {editingAppointmentId
                        ? "Update patient appointment"
                        : "Create a patient appointment"}
                    </h3>
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
                    disabled={Boolean(editingAppointmentId)}
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                        {(doctor.full_name || "Doctor profile incomplete") +
                          " - " +
                          (doctor.specialty || "General") +
                          ` | Fee: LKR ${Number(
                            doctor.consultation_fee || 0
                          ).toLocaleString()}`}
                      </option>
                    ))}
                  </select>

                  {selectedDoctor ? (
                    <div className="summary-card full-span">
                      <strong>
                        {selectedDoctor.full_name || "Selected doctor"}
                      </strong>
                      <span className="form-hint">
                        Specialty: {selectedDoctor.specialty || "General"}
                      </span>
                      <span className="form-hint">
                        Consultation fee: LKR{" "}
                        {selectedDoctorFee.toLocaleString()}
                      </span>
                    </div>
                  ) : null}

                  <select
                    value={appointmentForm.slot_id}
                    onChange={(event) => {
                      const slot = slots.find(
                        (entry) => entry._id === event.target.value
                      );
                      setAppointmentForm({
                        ...appointmentForm,
                        slot_id: event.target.value,
                        scheduled_at: slot?.specific_date
                          ? new Date(slot.specific_date)
                              .toISOString()
                              .slice(0, 16)
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

                  <button
                    className="primary-button inline-button"
                    disabled={booking}
                    type="submit"
                  >
                    {booking
                      ? "Saving..."
                      : editingAppointmentId
                        ? "Update appointment"
                        : "Book appointment"}
                  </button>
                  {editingAppointmentId ? (
                    <button
                      className="secondary-button inline-button"
                      type="button"
                      onClick={handleCancelAppointmentEdit}
                    >
                      Cancel edit
                    </button>
                  ) : null}

                  {!doctors.length ? (
                    <p className="form-hint full-span">
                      No verified doctor profiles are available yet. Doctors must
                      save their profile and be verified before patients can book
                      them.
                    </p>
                  ) : null}
                </form>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">My Appointments</p>
                    <h3>Upcoming and past consultations</h3>
                  </div>
                </div>

                <div className="simple-list">
                  {history.appointments.map((appointment) => (
                    <div className="summary-card simple-item" key={appointment._id}>
                      <strong>{formatDateTime(appointment.scheduled_at)}</strong>
                      <span className="form-hint">
                        Doctor: {getDoctorName(appointment.doctor_id)} | Status:{" "}
                        {appointment.status || "scheduled"}
                      </span>
                      <span className="form-hint">
                        Type: {appointment.appointment_type || "video"}
                      </span>
                      {appointment.status === "pending_payment" ||
                      appointment.status === "payment_failed" ? (
                        <button
                          className="primary-button inline-button"
                          onClick={() => handleAppointmentPayment(appointment)}
                          type="button"
                        >
                          Pay now
                        </button>
                      ) : (
                        <Link
                          className="ghost-link"
                          to={`/consultation/${appointment._id}?role=patient`}
                        >
                          Join consultation
                        </Link>
                      )}
                      <div className="card-actions">
                        <button
                          className="secondary-button inline-button"
                          type="button"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          Edit
                        </button>
                        <button
                          className="secondary-button inline-button danger-button"
                          type="button"
                          onClick={() => handleDeleteAppointment(appointment._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {!history.appointments.length ? (
                    <div className="empty-state">
                      <p>No appointments booked yet.</p>
                    </div>
                  ) : null}
                </div>
              </article>
            </div>
          ) : null}

          {activeTab === "reports" ? (
            <div className="dashboard-stack">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Medical Reports</p>
                    <h3>
                      {editingReportId
                        ? "Update report details"
                        : "Upload patient files"}
                    </h3>
                  </div>
                </div>

                <form className="field-grid" onSubmit={handleReportUpload}>
                  <input
                    className="full-span"
                    type="file"
                    disabled={Boolean(editingReportId)}
                    onChange={(e) => {
                      const nextFile = e.target.files?.[0] || null;
                      setReportForm((current) => ({
                        ...current,
                        file: nextFile
                      }));
                    }}
                  />
                  {reportForm.file ? (
                    <div className="summary-card full-span">
                      <strong>{reportForm.file.name}</strong>
                      <span className="form-hint">
                        Ready to upload:{" "}
                        {Math.max(
                          1,
                          Math.round(reportForm.file.size / 1024)
                        ).toLocaleString()}{" "}
                        KB
                      </span>
                    </div>
                  ) : null}
                  <input
                    placeholder="Report title"
                    value={reportForm.title}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, title: e.target.value })
                    }
                  />
                  <input
                    placeholder="Category"
                    value={reportForm.category}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, category: e.target.value })
                    }
                  />
                  <textarea
                    className="full-span"
                    rows="3"
                    placeholder="Description"
                    value={reportForm.description}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        description: e.target.value
                      })
                    }
                  />
                  <button
                    className="primary-button inline-button"
                    disabled={uploading}
                    type="submit"
                  >
                    {uploading
                      ? "Saving..."
                      : editingReportId
                        ? "Update report"
                        : "Upload report"}
                  </button>
                  {editingReportId ? (
                    <button
                      className="secondary-button inline-button"
                      type="button"
                      onClick={handleCancelReportEdit}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </form>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Uploaded Reports</p>
                    <h3>Download previously uploaded files</h3>
                  </div>
                </div>

                <div className="simple-list">
                  {history.reports.map((report) => (
                    <div className="summary-card simple-item" key={report._id}>
                      <strong>{report.title}</strong>
                      <span className="form-hint">{report.file_name}</span>
                      <span className="form-hint">
                        Uploaded: {formatDate(report.uploaded_at)}
                      </span>
                      <button
                        className="secondary-button inline-button"
                        onClick={() => handleDownload(report._id, report.file_name)}
                        type="button"
                      >
                        Download
                      </button>
                      <div className="card-actions">
                        <button
                          className="secondary-button inline-button"
                          onClick={() => handleEditReport(report)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="secondary-button inline-button danger-button"
                          onClick={() => handleDeleteReport(report._id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {!history.reports.length ? (
                    <div className="empty-state">
                      <p>No reports uploaded yet.</p>
                    </div>
                  ) : null}
                </div>
              </article>
            </div>
          ) : null}

          {activeTab === "prescriptions" ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Prescriptions</p>
                  <h3>Issued treatments and medication notes</h3>
                </div>
              </div>

              <div className="simple-list">
                {history.prescriptions.map((prescription) => (
                  <div className="summary-card simple-item" key={prescription._id}>
                    <strong>{prescription.diagnosis || "Prescription"}</strong>
                    <span className="form-hint">
                      Medications:{" "}
                      {Array.isArray(prescription.medications)
                        ? prescription.medications
                            .map((item) => item.medication_name)
                            .filter(Boolean)
                            .join(", ") || "No medications listed"
                        : "No medications listed"}
                    </span>
                    <span className="form-hint">
                      Notes: {prescription.notes || "No additional notes"}
                    </span>
                    <span className="form-hint">
                      Date:{" "}
                      {formatDate(
                        prescription.issued_at ||
                          prescription.prescribed_at ||
                          prescription.created_at ||
                          prescription.createdAt
                      )}
                    </span>
                    <span className="form-hint">
                      Signature: {formatSignatureStatus(prescription.signature)}
                    </span>
                    <button
                      className="secondary-button inline-button"
                      onClick={() => handlePrescriptionDownload(prescription)}
                      type="button"
                    >
                      Download PDF
                    </button>
                    <div className="card-actions">
                      {prescription.signature?.document_id ? (
                        <button
                          className="secondary-button inline-button"
                          disabled={refreshingSignatureId === prescription._id}
                          onClick={() =>
                            handleRefreshPrescriptionSignature(prescription._id)
                          }
                          type="button"
                        >
                          {refreshingSignatureId === prescription._id
                            ? "Refreshing..."
                            : "Refresh signature"}
                        </button>
                      ) : null}
                      {prescription.signature?.status === "completed" ? (
                        <button
                          className="primary-button inline-button"
                          disabled={downloadingSignedId === prescription._id}
                          onClick={() =>
                            handleSignedPrescriptionDownload(prescription)
                          }
                          type="button"
                        >
                          {downloadingSignedId === prescription._id
                            ? "Downloading..."
                            : "Download signed PDF"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                {!history.prescriptions.length ? (
                  <div className="empty-state">
                    <p>No prescriptions available yet.</p>
                  </div>
                ) : null}
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <style jsx>{`
        .patient-dashboard-shell {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .patient-dashboard-nav {
          position: sticky;
          top: 24px;
        }

        .patient-dashboard-main {
          min-width: 0;
        }

        .patient-tab-list {
          display: grid;
          gap: 12px;
        }

        .patient-tab-button {
          width: 100%;
          text-align: left;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease,
            box-shadow 0.2s ease, background-color 0.2s ease;
          display: grid;
          gap: 4px;
        }

        .patient-tab-button:hover {
          transform: translateY(-1px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        .patient-tab-button--active {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 16px 32px rgba(37, 99, 235, 0.12);
        }

        .patient-tab-label {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }

        .patient-tab-description,
        .patient-tab-meta {
          font-size: 0.88rem;
          color: #475569;
        }

        @media (max-width: 960px) {
          .patient-dashboard-shell {
            grid-template-columns: 1fr;
          }

          .patient-dashboard-nav {
            position: static;
          }

          .patient-tab-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .patient-tab-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
