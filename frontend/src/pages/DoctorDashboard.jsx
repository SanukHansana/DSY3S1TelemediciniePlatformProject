import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import {
  createDoctorAvailability,
  createDoctorPrescription,
  deleteDoctorAppointment,
  deleteDoctorAvailability,
  deleteDoctorPrescription,
  downloadSignedPrescriptionPdf,
  getMyDoctorAppointments,
  getMyDoctorAvailability,
  getMyDoctorPrescriptions,
  getMyDoctorProfile,
  getPatientReportsForDoctor,
  refreshPrescriptionSignatureStatus,
  requestDoctorPrescriptionSignature,
  updateDoctorAppointmentStatus,
  updateDoctorAvailability,
  updateDoctorPrescription,
  updateMyDoctorProfile
} from "../services/doctorApi";
import { downloadPatientReport } from "../services/patientApi";
import { createPrescriptionPdfPayload } from "../utils/prescriptionPdf";

const doctorTabs = [
  {
    key: "profile",
    label: "Profile",
    description: "Manage your doctor details"
  },
  {
    key: "availability",
    label: "Availability",
    description: "Create and manage consultation slots"
  },
  {
    key: "appointments",
    label: "Appointments",
    description: "Accept, reject, and update requests"
  },
  {
    key: "reports",
    label: "Reports",
    description: "View and download patient files"
  },
  {
    key: "prescriptions",
    label: "Prescriptions",
    description: "Create and review digital prescriptions"
  }
];

const emptyProfile = {
  full_name: "",
  specialty: "",
  consultation_fee: "",
  bio: "",
  experience_years: "",
  qualifications: "",
  languages: "",
  hospital_affiliation: "",
  license_number: "",
  is_active: true
};

const emptySlot = {
  day_of_week: "Monday",
  specific_date: "",
  start_time: "09:00",
  end_time: "09:30",
  status: "available"
};

const emptyPrescription = {
  appointment_id: "",
  diagnosis: "",
  notes: "",
  follow_up_date: "",
  medications: [
    {
      medication_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: ""
    }
  ]
};

const toCsv = (value) => (Array.isArray(value) ? value.join(", ") : "");

const fromCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "Not set";

const formatDateInput = (value) =>
  value ? String(value).slice(0, 10) : "";

const formatSignatureStatus = (signature = {}) => {
  const status = signature.status || "not_sent";

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getPatientLabel = (patient = {}) => {
  const email = String(patient.email || "").trim();
  const name = String(patient.name || "").trim();

  if (email && name) {
    return `${email} - ${name}`;
  }

  return email || name || patient._id || "Unknown patient";
};

const getAppointmentPatientLabel = (appointment) =>
  getPatientLabel({
    _id: appointment.patient_id,
    ...(appointment.patient || {})
  });

const resolveTab = (value) =>
  doctorTabs.some((tab) => tab.key === value) ? value : "profile";

const mapPrescriptionToForm = (prescription = {}) => ({
  appointment_id: prescription.appointment_id || "",
  diagnosis: prescription.diagnosis || "",
  notes: prescription.notes || "",
  follow_up_date: formatDateInput(prescription.follow_up_date),
  medications:
    Array.isArray(prescription.medications) && prescription.medications.length
      ? prescription.medications.map((item) => ({
          medication_name: item.medication_name || "",
          dosage: item.dosage || "",
          frequency: item.frequency || "",
          duration: item.duration || "",
          instructions: item.instructions || ""
        }))
      : emptyPrescription.medications
});

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

export default function DoctorDashboard() {
  const { token, user } = useContext(AuthContext);
  const currentRole = user?.role || localStorage.getItem("role");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTab(searchParams.get("tab"));
  const [profile, setProfile] = useState(emptyProfile);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [slotForm, setSlotForm] = useState(emptySlot);
  const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescription);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSlot, setSavingSlot] = useState(false);
  const [issuingPrescription, setIssuingPrescription] = useState(false);
  const [signingPrescriptionId, setSigningPrescriptionId] = useState("");
  const [refreshingSignatureId, setRefreshingSignatureId] = useState("");
  const [downloadingSignedId, setDownloadingSignedId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedPrescriptionAppointment = appointments.find(
    (appointment) => appointment._id === prescriptionForm.appointment_id
  );
  const appointmentPatients = Array.from(
    appointments
      .reduce((map, appointment) => {
        if (!appointment.patient_id) {
          return map;
        }

        const patient = {
          _id: appointment.patient_id,
          ...(appointment.patient || {})
        };
        const current = map.get(patient._id);

        if (!current || (!current.email && patient.email)) {
          map.set(patient._id, patient);
        }

        return map;
      }, new Map())
      .values()
  ).sort((first, second) =>
    getPatientLabel(first).localeCompare(getPatientLabel(second))
  );
  const selectedPatientDetails = appointmentPatients.find(
    (patient) => patient._id === selectedPatient
  );

  const setActiveTab = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileData, slotData, appointmentData, prescriptionData] =
        await Promise.all([
          getMyDoctorProfile(token),
          getMyDoctorAvailability(token),
          getMyDoctorAppointments(token),
          getMyDoctorPrescriptions(token)
        ]);

      setProfile({
        full_name: profileData.full_name || "",
        specialty: profileData.specialty || "",
        consultation_fee: profileData.consultation_fee ?? "",
        bio: profileData.bio || "",
        experience_years: profileData.experience_years ?? "",
        qualifications: toCsv(profileData.qualifications),
        languages: toCsv(profileData.languages),
        hospital_affiliation: profileData.hospital_affiliation || "",
        license_number: profileData.license_number || "",
        is_active: profileData.is_active !== false
      });
      setSlots(Array.isArray(slotData) ? slotData : []);
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
      setPrescriptions(Array.isArray(prescriptionData) ? prescriptionData : []);
      setDrafts(
        Object.fromEntries(
          (Array.isArray(appointmentData) ? appointmentData : []).map((item) => [
            item._id,
            {
              status: item.status || "scheduled",
              doctor_notes: item.doctor_notes || ""
            }
          ])
        )
      );
    } catch (loadError) {
      setError(loadError.message || "Could not load the doctor dashboard");
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

  const handleProfileSave = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setMessage("");
      setError("");
      await updateMyDoctorProfile(token, {
        ...profile,
        consultation_fee: Number(profile.consultation_fee) || 0,
        experience_years:
          profile.experience_years === ""
            ? null
            : Number(profile.experience_years) || 0,
        qualifications: fromCsv(profile.qualifications),
        languages: fromCsv(profile.languages)
      });
      setMessage("Doctor profile saved.");
      setActiveTab("profile");
    } catch (saveError) {
      setError(saveError.message || "Could not save doctor profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSlotCreate = async (event) => {
    event.preventDefault();

    try {
      setSavingSlot(true);
      setMessage("");
      setError("");
      await createDoctorAvailability(token, {
        day_of_week: slotForm.specific_date ? null : slotForm.day_of_week,
        specific_date: slotForm.specific_date || null,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        status: slotForm.status
      });
      setSlotForm(emptySlot);
      await loadDashboard();
      setMessage("Availability slot created.");
      setActiveTab("availability");
    } catch (slotError) {
      setError(slotError.message || "Could not create slot");
    } finally {
      setSavingSlot(false);
    }
  };

  const handleToggleSlotStatus = async (slot) => {
    try {
      setMessage("");
      setError("");
      await updateDoctorAvailability(token, slot._id, {
        status: slot.status === "available" ? "unavailable" : "available"
      });
      await loadDashboard();
      setMessage("Availability updated.");
      setActiveTab("availability");
    } catch (slotError) {
      setError(slotError.message || "Could not update slot");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      setMessage("");
      setError("");
      await deleteDoctorAvailability(token, slotId);
      await loadDashboard();
      setMessage("Availability slot deleted.");
      setActiveTab("availability");
    } catch (slotError) {
      setError(slotError.message || "Could not delete slot");
    }
  };

  const handleAppointmentUpdate = async (appointmentId) => {
    try {
      setMessage("");
      setError("");
      await updateDoctorAppointmentStatus(token, appointmentId, drafts[appointmentId]);
      await loadDashboard();
      setMessage("Appointment updated.");
      setActiveTab("appointments");
    } catch (updateError) {
      setError(updateError.message || "Could not update appointment");
    }
  };

  const handleAppointmentDelete = async (appointmentId) => {
    if (!window.confirm("Delete this appointment?")) {
      return;
    }

    try {
      setMessage("");
      setError("");
      await deleteDoctorAppointment(token, appointmentId);
      await loadDashboard();
      setMessage("Appointment deleted.");
      setActiveTab("appointments");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete appointment");
    }
  };

  const handleLoadReports = async (patientId) => {
    try {
      setSelectedPatient(patientId);
      setError("");
      const data = await getPatientReportsForDoctor(token, patientId);
      setReports(Array.isArray(data) ? data : []);
      setActiveTab("reports");
    } catch (reportError) {
      setError(reportError.message || "Could not load patient reports");
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

  const handlePrescriptionSubmit = async (event) => {
    event.preventDefault();

    if (!prescriptionForm.appointment_id) {
      setError("Select an appointment to auto-fill the patient details.");
      return;
    }

    try {
      setIssuingPrescription(true);
      setMessage("");
      setError("");
      const payload = {
        appointment_id: prescriptionForm.appointment_id || null,
        diagnosis: prescriptionForm.diagnosis,
        notes: prescriptionForm.notes,
        follow_up_date: prescriptionForm.follow_up_date || null,
        medications: prescriptionForm.medications.filter((item) =>
          item.medication_name.trim()
        )
      };

      if (editingPrescriptionId) {
        await updateDoctorPrescription(token, editingPrescriptionId, payload);
      } else {
        await createDoctorPrescription(token, payload);
      }

      setPrescriptionForm(emptyPrescription);
      setEditingPrescriptionId("");
      await loadDashboard();
      setMessage(
        editingPrescriptionId
          ? "Prescription updated."
          : "Prescription issued."
      );
      setActiveTab("prescriptions");
    } catch (prescriptionError) {
      setError(
        prescriptionError.message || "Could not save prescription"
      );
    } finally {
      setIssuingPrescription(false);
    }
  };

  const handleEditPrescription = (prescription) => {
    setPrescriptionForm(mapPrescriptionToForm(prescription));
    setEditingPrescriptionId(prescription._id);
    setMessage("");
    setError("");
    setActiveTab("prescriptions");
  };

  const handleCancelPrescriptionEdit = () => {
    setPrescriptionForm(emptyPrescription);
    setEditingPrescriptionId("");
    setMessage("");
    setError("");
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm("Delete this prescription?")) {
      return;
    }

    try {
      setMessage("");
      setError("");
      await deleteDoctorPrescription(token, prescriptionId);

      if (editingPrescriptionId === prescriptionId) {
        setPrescriptionForm(emptyPrescription);
        setEditingPrescriptionId("");
      }

      await loadDashboard();
      setMessage("Prescription deleted.");
      setActiveTab("prescriptions");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete prescription");
    }
  };

  const handleStartPrescriptionSignature = async (prescription) => {
    try {
      setSigningPrescriptionId(prescription._id);
      setMessage("");
      setError("");

      const payload = prescription.signature?.document_id
        ? {}
        : await createPrescriptionPdfPayload({
            prescription,
            patient: prescription.patient || {}
          });
      const result = await requestDoctorPrescriptionSignature(
        token,
        prescription._id,
        {
          pdfBase64: payload.base64,
          fileName: payload.fileName
        }
      );

      await loadDashboard();

      if (result?.signLink) {
        window.open(result.signLink, "_blank", "noopener,noreferrer");
        setMessage("BoldSign signing page opened.");
      } else {
        setMessage("Signature request created. Refresh status after signing.");
      }

      setActiveTab("prescriptions");
    } catch (signatureError) {
      setError(signatureError.message || "Could not start BoldSign signing");
    } finally {
      setSigningPrescriptionId("");
    }
  };

  const handleRefreshSignatureStatus = async (prescriptionId) => {
    try {
      setRefreshingSignatureId(prescriptionId);
      setMessage("");
      setError("");
      await refreshPrescriptionSignatureStatus(token, prescriptionId);
      await loadDashboard();
      setMessage("Signature status refreshed.");
      setActiveTab("prescriptions");
    } catch (signatureError) {
      setError(signatureError.message || "Could not refresh signature status");
    } finally {
      setRefreshingSignatureId("");
    }
  };

  const handleDownloadSignedPrescription = async (prescription) => {
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

  if (!token) {
    return (
      <section className="panel">
        <h2>Doctor Dashboard</h2>
        <p className="form-hint">Login with a doctor account to use doctor services.</p>
        <Link className="primary-button inline-button" to="/login">
          Go to login
        </Link>
      </section>
    );
  }

  if (currentRole !== "doctor") {
    return (
      <section className="panel">
        <h2>Doctor Dashboard</h2>
        <p className="status-message error">
          This page is available only for doctor accounts.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="panel">
        <h2>Doctor Dashboard</h2>
        <p>Loading doctor services...</p>
      </section>
    );
  }

  return (
    <div className="dashboard-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Doctor Service</p>
            <h2>Manage your profile, availability, appointments, reports, and prescriptions</h2>
          </div>
        </div>
        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}
      </section>

      <section className="doctor-dashboard-shell">
        <aside className="panel doctor-dashboard-nav">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Doctor</p>
              <h3>Quick Sections</h3>
            </div>
          </div>

          <div className="doctor-tab-list">
            {doctorTabs.map((tab) => (
              <button
                key={tab.key}
                className={`doctor-tab-button${
                  activeTab === tab.key ? " doctor-tab-button--active" : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <span className="doctor-tab-label">{tab.label}</span>
                <span className="doctor-tab-description">{tab.description}</span>
                {tab.key === "availability" ? (
                  <span className="doctor-tab-meta">{slots.length} slots</span>
                ) : null}
                {tab.key === "appointments" ? (
                  <span className="doctor-tab-meta">
                    {appointments.length} booked
                  </span>
                ) : null}
                {tab.key === "reports" ? (
                  <span className="doctor-tab-meta">
                    {reports.length} loaded
                  </span>
                ) : null}
                {tab.key === "prescriptions" ? (
                  <span className="doctor-tab-meta">
                    {prescriptions.length} issued
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </aside>

        <div className="doctor-dashboard-main">
          {activeTab === "profile" ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Doctor Profile</p>
                  <h3>Update professional details</h3>
                </div>
              </div>

              <form className="field-grid" onSubmit={handleProfileSave}>
                <input
                  placeholder="Full name"
                  value={profile.full_name}
                  onChange={(event) =>
                    setProfile({ ...profile, full_name: event.target.value })
                  }
                />
                <input
                  placeholder="Specialty"
                  value={profile.specialty}
                  onChange={(event) =>
                    setProfile({ ...profile, specialty: event.target.value })
                  }
                />
                <input
                  placeholder="Consultation fee"
                  type="number"
                  value={profile.consultation_fee}
                  onChange={(event) =>
                    setProfile({ ...profile, consultation_fee: event.target.value })
                  }
                />
                <input
                  placeholder="Experience years"
                  type="number"
                  value={profile.experience_years}
                  onChange={(event) =>
                    setProfile({ ...profile, experience_years: event.target.value })
                  }
                />
                <input
                  placeholder="Hospital affiliation"
                  value={profile.hospital_affiliation}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      hospital_affiliation: event.target.value
                    })
                  }
                />
                <input
                  placeholder="License number"
                  value={profile.license_number}
                  onChange={(event) =>
                    setProfile({ ...profile, license_number: event.target.value })
                  }
                />
                <input
                  className="full-span"
                  placeholder="Qualifications (comma separated)"
                  value={profile.qualifications}
                  onChange={(event) =>
                    setProfile({ ...profile, qualifications: event.target.value })
                  }
                />
                <input
                  className="full-span"
                  placeholder="Languages (comma separated)"
                  value={profile.languages}
                  onChange={(event) =>
                    setProfile({ ...profile, languages: event.target.value })
                  }
                />
                <textarea
                  className="full-span"
                  rows="4"
                  placeholder="Bio"
                  value={profile.bio}
                  onChange={(event) =>
                    setProfile({ ...profile, bio: event.target.value })
                  }
                />
                <label className="checkbox-row full-span">
                  <input
                    type="checkbox"
                    checked={profile.is_active}
                    onChange={(event) =>
                      setProfile({ ...profile, is_active: event.target.checked })
                    }
                  />
                  <span>Profile is active</span>
                </label>
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

          {activeTab === "availability" ? (
            <div className="dashboard-stack">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Availability</p>
                    <h3>Create and manage slots</h3>
                  </div>
                </div>

                <form className="field-grid" onSubmit={handleSlotCreate}>
                  <select
                    value={slotForm.day_of_week}
                    onChange={(event) =>
                      setSlotForm({ ...slotForm, day_of_week: event.target.value })
                    }
                    disabled={Boolean(slotForm.specific_date)}
                  >
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                    <option>Sunday</option>
                  </select>
                  <input
                    type="date"
                    value={slotForm.specific_date}
                    onChange={(event) =>
                      setSlotForm({ ...slotForm, specific_date: event.target.value })
                    }
                  />
                  <input
                    type="time"
                    value={slotForm.start_time}
                    onChange={(event) =>
                      setSlotForm({ ...slotForm, start_time: event.target.value })
                    }
                  />
                  <input
                    type="time"
                    value={slotForm.end_time}
                    onChange={(event) =>
                      setSlotForm({ ...slotForm, end_time: event.target.value })
                    }
                  />
                  <select
                    value={slotForm.status}
                    onChange={(event) =>
                      setSlotForm({ ...slotForm, status: event.target.value })
                    }
                  >
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  <button
                    className="primary-button inline-button"
                    disabled={savingSlot}
                    type="submit"
                  >
                    {savingSlot ? "Saving..." : "Add slot"}
                  </button>
                </form>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">My Slots</p>
                    <h3>Current weekly and dated availability</h3>
                  </div>
                </div>

                <div className="simple-list">
                  {slots.map((slot) => (
                    <div className="summary-card simple-item" key={slot._id}>
                      <strong>
                        {slot.specific_date
                          ? formatDateTime(slot.specific_date)
                          : slot.day_of_week}
                      </strong>
                      <span className="form-hint">
                        {slot.start_time} - {slot.end_time}
                      </span>
                      <span className="form-hint">
                        Status: {slot.status || "available"}
                      </span>
                      <div className="card-actions">
                        <button
                          className="secondary-button inline-button"
                          type="button"
                          onClick={() => handleToggleSlotStatus(slot)}
                        >
                          Toggle status
                        </button>
                        <button
                          className="ghost-link"
                          type="button"
                          onClick={() => handleDeleteSlot(slot._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {!slots.length ? (
                    <div className="empty-state">
                      <p>No availability slots added yet.</p>
                    </div>
                  ) : null}
                </div>
              </article>
            </div>
          ) : null}

          {activeTab === "appointments" ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Appointments</p>
                  <h3>Accept, reject, or complete requests</h3>
                </div>
              </div>

              <div className="simple-list">
                {appointments.map((appointment) => (
                  <div className="summary-card simple-item" key={appointment._id}>
                    <strong>{formatDateTime(appointment.scheduled_at)}</strong>
                    <span className="form-hint">
                      Patient: {getAppointmentPatientLabel(appointment)}
                    </span>
                    <select
                      value={drafts[appointment._id]?.status || "scheduled"}
                      onChange={(event) =>
                        setDrafts({
                          ...drafts,
                          [appointment._id]: {
                            ...drafts[appointment._id],
                            status: event.target.value
                          }
                        })
                      }
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="accepted">Accepted</option>
                      <option value="in-consultation">In Consultation</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <textarea
                      rows="2"
                      placeholder="Doctor notes"
                      value={drafts[appointment._id]?.doctor_notes || ""}
                      onChange={(event) =>
                        setDrafts({
                          ...drafts,
                          [appointment._id]: {
                            ...drafts[appointment._id],
                            doctor_notes: event.target.value
                          }
                        })
                      }
                    />
                    <div className="card-actions">
                      <button
                        className="primary-button inline-button"
                        type="button"
                        onClick={() => handleAppointmentUpdate(appointment._id)}
                      >
                        Save
                      </button>
                      <button
                        className="secondary-button inline-button"
                        type="button"
                        onClick={() => handleLoadReports(appointment.patient_id)}
                      >
                        View reports
                      </button>
                      <button
                        className="secondary-button inline-button"
                        type="button"
                        onClick={() => {
                          setPrescriptionForm({
                            ...prescriptionForm,
                            appointment_id: appointment._id
                          });
                          setActiveTab("prescriptions");
                        }}
                      >
                        Prefill Rx
                      </button>
                      <Link
                        className="ghost-link"
                        to={`/consultation/${appointment._id}?role=doctor`}
                      >
                        Start consultation
                      </Link>
                      <button
                        className="secondary-button inline-button danger-button"
                        type="button"
                        onClick={() => handleAppointmentDelete(appointment._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {!appointments.length ? (
                  <div className="empty-state">
                    <p>No appointments assigned yet.</p>
                  </div>
                ) : null}
              </div>
            </article>
          ) : null}

          {activeTab === "reports" ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Patient Reports</p>
                  <h3>
                    {selectedPatient
                      ? `Files for ${getPatientLabel(
                          selectedPatientDetails || { _id: selectedPatient }
                        )}`
                      : "Select an appointment patient"}
                  </h3>
                </div>
              </div>

              <div className="field-grid">
                <select
                  value={selectedPatient}
                  onChange={(event) => {
                    const patientId = event.target.value;
                    if (patientId) {
                      handleLoadReports(patientId);
                    } else {
                      setSelectedPatient("");
                      setReports([]);
                    }
                  }}
                >
                  <option value="">Select patient from appointments</option>
                  {appointmentPatients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {getPatientLabel(patient)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="simple-list">
                {reports.map((report) => (
                  <div className="summary-card simple-item" key={report._id}>
                    <strong>{report.title}</strong>
                    <span className="form-hint">
                      {report.description || report.file_name}
                    </span>
                    <button
                      className="secondary-button inline-button"
                      type="button"
                      onClick={() => handleDownload(report._id, report.file_name)}
                    >
                      Download
                    </button>
                  </div>
                ))}

                {selectedPatient && !reports.length ? (
                  <div className="empty-state">
                    <p>No patient reports loaded yet.</p>
                  </div>
                ) : null}

                {!selectedPatient ? (
                  <div className="empty-state">
                    <p>Select a patient from the appointments tab to load reports.</p>
                  </div>
                ) : null}
              </div>
            </article>
          ) : null}

          {activeTab === "prescriptions" ? (
            <div className="dashboard-stack">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Issue Prescription</p>
                    <h3>
                      {editingPrescriptionId
                        ? "Update digital prescription"
                        : "Create digital prescription"}
                    </h3>
                  </div>
                </div>

                <form className="field-grid" onSubmit={handlePrescriptionSubmit}>
                  <select
                    value={prescriptionForm.appointment_id}
                    onChange={(event) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        appointment_id: event.target.value
                      })
                    }
                    required
                  >
                    <option value="">Select appointment</option>
                    {appointments.map((appointment) => (
                      <option key={appointment._id} value={appointment._id}>
                        {formatDateTime(appointment.scheduled_at)} | Patient{" "}
                        {getAppointmentPatientLabel(appointment)}
                      </option>
                    ))}
                  </select>
                  <div className="summary-card full-span">
                    <strong>Patient and appointment IDs are linked automatically.</strong>
                    <span className="form-hint">
                      {selectedPrescriptionAppointment
                        ? `Selected patient: ${getAppointmentPatientLabel(
                            selectedPrescriptionAppointment
                          )}`
                        : "Choose one of your appointments to auto-fill the patient details."}
                    </span>
                  </div>
                  <textarea
                    className="full-span"
                    rows="3"
                    placeholder="Diagnosis"
                    value={prescriptionForm.diagnosis}
                    onChange={(event) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        diagnosis: event.target.value
                      })
                    }
                    required
                  />
                  <textarea
                    className="full-span"
                    rows="3"
                    placeholder="Notes"
                    value={prescriptionForm.notes}
                    onChange={(event) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        notes: event.target.value
                      })
                    }
                  />
                  <input
                    type="date"
                    value={prescriptionForm.follow_up_date}
                    onChange={(event) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        follow_up_date: event.target.value
                      })
                    }
                  />
                  {prescriptionForm.medications.map((item, index) => (
                    <div className="med-row full-span" key={index}>
                      <input
                        placeholder="Medication"
                        value={item.medication_name}
                        onChange={(event) => {
                          const next = [...prescriptionForm.medications];
                          next[index] = {
                            ...next[index],
                            medication_name: event.target.value
                          };
                          setPrescriptionForm({
                            ...prescriptionForm,
                            medications: next
                          });
                        }}
                      />
                      <input
                        placeholder="Dosage"
                        value={item.dosage}
                        onChange={(event) => {
                          const next = [...prescriptionForm.medications];
                          next[index] = { ...next[index], dosage: event.target.value };
                          setPrescriptionForm({
                            ...prescriptionForm,
                            medications: next
                          });
                        }}
                      />
                      <input
                        placeholder="Frequency"
                        value={item.frequency}
                        onChange={(event) => {
                          const next = [...prescriptionForm.medications];
                          next[index] = {
                            ...next[index],
                            frequency: event.target.value
                          };
                          setPrescriptionForm({
                            ...prescriptionForm,
                            medications: next
                          });
                        }}
                      />
                      <input
                        placeholder="Duration"
                        value={item.duration}
                        onChange={(event) => {
                          const next = [...prescriptionForm.medications];
                          next[index] = {
                            ...next[index],
                            duration: event.target.value
                          };
                          setPrescriptionForm({
                            ...prescriptionForm,
                            medications: next
                          });
                        }}
                      />
                      <input
                        placeholder="Instructions"
                        value={item.instructions}
                        onChange={(event) => {
                          const next = [...prescriptionForm.medications];
                          next[index] = {
                            ...next[index],
                            instructions: event.target.value
                          };
                          setPrescriptionForm({
                            ...prescriptionForm,
                            medications: next
                          });
                        }}
                      />
                    </div>
                  ))}
                  <button
                    className="secondary-button inline-button"
                    type="button"
                    onClick={() =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        medications: [
                          ...prescriptionForm.medications,
                          {
                            medication_name: "",
                            dosage: "",
                            frequency: "",
                            duration: "",
                            instructions: ""
                          }
                        ]
                      })
                    }
                  >
                    Add medication row
                  </button>
                  {editingPrescriptionId ? (
                    <button
                      className="secondary-button inline-button"
                      type="button"
                      onClick={handleCancelPrescriptionEdit}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                  <button
                    className="primary-button inline-button"
                    disabled={issuingPrescription}
                    type="submit"
                  >
                    {issuingPrescription
                      ? "Saving..."
                      : editingPrescriptionId
                        ? "Update prescription"
                        : "Issue prescription"}
                  </button>
                </form>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Issued Prescriptions</p>
                    <h3>Recent records</h3>
                  </div>
                </div>

                <div className="simple-list">
                  {prescriptions.map((item) => (
                    <div className="summary-card simple-item" key={item._id}>
                      <strong>{item.diagnosis}</strong>
                      <span className="form-hint">
                        Patient: {item.patient?.email || item.patient_id} | {formatDateTime(item.issued_at)}
                      </span>
                      <span className="form-hint">
                        Medications:{" "}
                        {Array.isArray(item.medications)
                          ? item.medications
                              .map((medication) => medication.medication_name)
                              .filter(Boolean)
                              .join(", ") || "No medications listed"
                          : "No medications listed"}
                      </span>
                      <span className="form-hint">
                        Signature: {formatSignatureStatus(item.signature)}
                      </span>
                      <div className="card-actions">
                        <button
                          className="secondary-button inline-button"
                          type="button"
                          onClick={() => handleEditPrescription(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="secondary-button inline-button danger-button"
                          type="button"
                          onClick={() => handleDeletePrescription(item._id)}
                        >
                          Delete
                        </button>
                        <button
                          className="primary-button inline-button"
                          type="button"
                          disabled={signingPrescriptionId === item._id}
                          onClick={() => handleStartPrescriptionSignature(item)}
                        >
                          {signingPrescriptionId === item._id
                            ? "Opening..."
                            : item.signature?.document_id
                              ? "Open signing"
                              : "Send to BoldSign"}
                        </button>
                        {item.signature?.document_id ? (
                          <button
                            className="secondary-button inline-button"
                            type="button"
                            disabled={refreshingSignatureId === item._id}
                            onClick={() => handleRefreshSignatureStatus(item._id)}
                          >
                            {refreshingSignatureId === item._id
                              ? "Refreshing..."
                              : "Refresh status"}
                          </button>
                        ) : null}
                        {item.signature?.status === "completed" ? (
                          <button
                            className="secondary-button inline-button"
                            type="button"
                            disabled={downloadingSignedId === item._id}
                            onClick={() => handleDownloadSignedPrescription(item)}
                          >
                            {downloadingSignedId === item._id
                              ? "Downloading..."
                              : "Download signed PDF"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {!prescriptions.length ? (
                    <div className="empty-state">
                      <p>No prescriptions issued yet.</p>
                    </div>
                  ) : null}
                </div>
              </article>
            </div>
          ) : null}
        </div>
      </section>

      <style jsx>{`
        .doctor-dashboard-shell {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .doctor-dashboard-nav {
          position: sticky;
          top: 24px;
        }

        .doctor-dashboard-main {
          min-width: 0;
        }

        .doctor-tab-list {
          display: grid;
          gap: 12px;
        }

        .doctor-tab-button {
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

        .doctor-tab-button:hover {
          transform: translateY(-1px);
          border-color: rgba(14, 165, 233, 0.32);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        .doctor-tab-button--active {
          background: linear-gradient(135deg, #ecfeff, #cffafe);
          border-color: rgba(8, 145, 178, 0.35);
          box-shadow: 0 16px 32px rgba(8, 145, 178, 0.12);
        }

        .doctor-tab-label {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }

        .doctor-tab-description,
        .doctor-tab-meta {
          font-size: 0.88rem;
          color: #475569;
        }

        @media (max-width: 960px) {
          .doctor-dashboard-shell {
            grid-template-columns: 1fr;
          }

          .doctor-dashboard-nav {
            position: static;
          }

          .doctor-tab-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .doctor-tab-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
