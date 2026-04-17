import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./doctor.css";

export default function DoctorDashboard() {
  const navigate = useNavigate();

  // TEMP data (replace with API later)
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    // 🔥 Replace with API later
    setPatients([
      { id: 1, name: "John Doe", email: "john@mail.com" },
      { id: 2, name: "Jane Smith", email: "jane@mail.com" },
    ]);

    setAppointments([
      { id: 1, patient: "John Doe", date: "2026-04-20", status: "Pending" },
      { id: 2, patient: "Jane Smith", date: "2026-04-21", status: "Completed" },
    ]);
  }, []);

  return (
    <div className="doctor-page">

      {/* NAVBAR */}
      <div className="doctor-navbar">
        <h2>Doctor Dashboard</h2>

        <div>
          <button onClick={() => navigate("/doctor/dashboard")}>
            Dashboard
          </button>
          <button onClick={() => navigate("/doctor/patients")}>
            Patients
          </button>
          <button onClick={() => navigate("/doctor/appointments")}>
            Appointments
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="doctor-cards">
        <div className="doctor-card">
          <h3>Total Patients</h3>
          <p>{patients.length}</p>
        </div>

        <div className="doctor-card">
          <h3>Total Appointments</h3>
          <p>{appointments.length}</p>
        </div>
      </div>

      {/* PATIENT LIST */}
      <div className="doctor-table">
        <h3>Patients</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* APPOINTMENTS */}
      <div className="doctor-table">
        <h3>Appointments</h3>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.patient}</td>
                <td>{a.date}</td>
                <td>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import {
  createDoctorAvailability,
  createDoctorPrescription,
  deleteDoctorAvailability,
  getMyDoctorAppointments,
  getMyDoctorAvailability,
  getMyDoctorPrescriptions,
  getMyDoctorProfile,
  getPatientReportsForDoctor,
  updateDoctorAppointmentStatus,
  updateDoctorAvailability,
  updateMyDoctorProfile
} from "../services/doctorApi";
import { downloadPatientReport } from "../services/patientApi";

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
  patient_id: "",
  diagnosis: "",
  notes: "",
  follow_up_date: "",
  medications: [{ medication_name: "", dosage: "", frequency: "", duration: "" }]
};

const toCsv = (value) => (Array.isArray(value) ? value.join(", ") : "");

const fromCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "Not set";

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

export default function DoctorDashboard() {
  const { token, user } = useContext(AuthContext);
  const currentRole = user?.role || localStorage.getItem("role");
  const [profile, setProfile] = useState(emptyProfile);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [slotForm, setSlotForm] = useState(emptySlot);
  const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescription);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSlot, setSavingSlot] = useState(false);
  const [issuingPrescription, setIssuingPrescription] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    } catch (slotError) {
      setError(slotError.message || "Could not create slot");
    } finally {
      setSavingSlot(false);
    }
  };

  const handleAppointmentUpdate = async (appointmentId) => {
    try {
      setMessage("");
      setError("");
      await updateDoctorAppointmentStatus(token, appointmentId, drafts[appointmentId]);
      await loadDashboard();
      setMessage("Appointment updated.");
    } catch (updateError) {
      setError(updateError.message || "Could not update appointment");
    }
  };

  const handleLoadReports = async (patientId) => {
    try {
      setSelectedPatient(patientId);
      setError("");
      const data = await getPatientReportsForDoctor(token, patientId);
      setReports(Array.isArray(data) ? data : []);
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

    try {
      setIssuingPrescription(true);
      setMessage("");
      setError("");
      await createDoctorPrescription(token, {
        appointment_id: prescriptionForm.appointment_id || null,
        patient_id: prescriptionForm.patient_id || null,
        diagnosis: prescriptionForm.diagnosis,
        notes: prescriptionForm.notes,
        follow_up_date: prescriptionForm.follow_up_date || null,
        medications: prescriptionForm.medications.filter((item) =>
          item.medication_name.trim()
        )
      });
      setPrescriptionForm(emptyPrescription);
      await loadDashboard();
      setMessage("Prescription issued.");
    } catch (prescriptionError) {
      setError(prescriptionError.message || "Could not issue prescription");
    } finally {
      setIssuingPrescription(false);
    }
  };

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
            <h2>Profile, availability, appointments, reports, and prescriptions</h2>
          </div>
        </div>
        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Doctor Profile</p>
              <h3>Update professional details</h3>
            </div>
          </div>

          <form className="field-grid" onSubmit={handleProfileSave}>
            <input placeholder="Full name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            <input placeholder="Specialty" value={profile.specialty} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} />
            <input placeholder="Consultation fee" type="number" value={profile.consultation_fee} onChange={(e) => setProfile({ ...profile, consultation_fee: e.target.value })} />
            <input placeholder="Experience years" type="number" value={profile.experience_years} onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })} />
            <input placeholder="Hospital affiliation" value={profile.hospital_affiliation} onChange={(e) => setProfile({ ...profile, hospital_affiliation: e.target.value })} />
            <input placeholder="License number" value={profile.license_number} onChange={(e) => setProfile({ ...profile, license_number: e.target.value })} />
            <input className="full-span" placeholder="Qualifications (comma separated)" value={profile.qualifications} onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })} />
            <input className="full-span" placeholder="Languages (comma separated)" value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} />
            <textarea className="full-span" rows="4" placeholder="Bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            <label className="checkbox-row full-span">
              <input type="checkbox" checked={profile.is_active} onChange={(e) => setProfile({ ...profile, is_active: e.target.checked })} />
              <span>Profile is active</span>
            </label>
            <button className="primary-button inline-button" disabled={savingProfile} type="submit">
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Availability</p>
              <h3>Create and manage slots</h3>
            </div>
          </div>

          <form className="field-grid" onSubmit={handleSlotCreate}>
            <select value={slotForm.day_of_week} onChange={(e) => setSlotForm({ ...slotForm, day_of_week: e.target.value })} disabled={Boolean(slotForm.specific_date)}>
              <option>Monday</option>
              <option>Tuesday</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
              <option>Saturday</option>
              <option>Sunday</option>
            </select>
            <input type="date" value={slotForm.specific_date} onChange={(e) => setSlotForm({ ...slotForm, specific_date: e.target.value })} />
            <input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} />
            <input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} />
            <select value={slotForm.status} onChange={(e) => setSlotForm({ ...slotForm, status: e.target.value })}>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <button className="primary-button inline-button" disabled={savingSlot} type="submit">
              {savingSlot ? "Saving..." : "Add slot"}
            </button>
          </form>

          <div className="simple-list">
            {slots.map((slot) => (
              <div className="summary-card simple-item" key={slot._id}>
                <strong>{slot.specific_date ? formatDateTime(slot.specific_date) : slot.day_of_week}</strong>
                <span className="form-hint">{slot.start_time} - {slot.end_time}</span>
                <div className="card-actions">
                  <button className="secondary-button inline-button" type="button" onClick={() => updateDoctorAvailability(token, slot._id, { status: slot.status === "available" ? "unavailable" : "available" }).then(loadDashboard).catch((err) => setError(err.message))}>
                    Toggle status
                  </button>
                  <button className="ghost-link" type="button" onClick={() => deleteDoctorAvailability(token, slot._id).then(loadDashboard).catch((err) => setError(err.message))}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid-two">
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
                <span className="form-hint">Patient: {appointment.patient_id}</span>
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
                  <button className="primary-button inline-button" type="button" onClick={() => handleAppointmentUpdate(appointment._id)}>
                    Save
                  </button>
                  <button className="secondary-button inline-button" type="button" onClick={() => handleLoadReports(appointment.patient_id)}>
                    View reports
                  </button>
                  <button
                    className="secondary-button inline-button"
                    type="button"
                    onClick={() =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        appointment_id: appointment._id,
                        patient_id: appointment.patient_id
                      })
                    }
                  >
                    Prefill Rx
                  </button>
                  <Link className="ghost-link" to={`/consultation/${appointment._id}?role=doctor`}>
                    Start consultation
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Patient Reports</p>
              <h3>{selectedPatient ? `Files for ${selectedPatient}` : "Select an appointment patient"}</h3>
            </div>
          </div>

          <div className="simple-list">
            {reports.map((report) => (
              <div className="summary-card simple-item" key={report._id}>
                <strong>{report.title}</strong>
                <span className="form-hint">{report.description || report.file_name}</span>
                <button className="secondary-button inline-button" type="button" onClick={() => handleDownload(report._id, report.file_name)}>
                  Download
                </button>
              </div>
            ))}
            {!reports.length ? (
              <div className="empty-state">
                <p>No patient reports loaded yet.</p>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Issue Prescription</p>
              <h3>Create digital prescription</h3>
            </div>
          </div>

          <form className="field-grid" onSubmit={handlePrescriptionSubmit}>
            <input placeholder="Appointment ID" value={prescriptionForm.appointment_id} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, appointment_id: e.target.value })} />
            <input placeholder="Patient ID" value={prescriptionForm.patient_id} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patient_id: e.target.value })} />
            <textarea className="full-span" rows="3" placeholder="Diagnosis" value={prescriptionForm.diagnosis} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })} required />
            <textarea className="full-span" rows="3" placeholder="Notes" value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })} />
            <input type="date" value={prescriptionForm.follow_up_date} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, follow_up_date: e.target.value })} />
            {prescriptionForm.medications.map((item, index) => (
              <div className="med-row full-span" key={index}>
                <input placeholder="Medication" value={item.medication_name} onChange={(e) => {
                  const next = [...prescriptionForm.medications];
                  next[index] = { ...next[index], medication_name: e.target.value };
                  setPrescriptionForm({ ...prescriptionForm, medications: next });
                }} />
                <input placeholder="Dosage" value={item.dosage} onChange={(e) => {
                  const next = [...prescriptionForm.medications];
                  next[index] = { ...next[index], dosage: e.target.value };
                  setPrescriptionForm({ ...prescriptionForm, medications: next });
                }} />
                <input placeholder="Frequency" value={item.frequency} onChange={(e) => {
                  const next = [...prescriptionForm.medications];
                  next[index] = { ...next[index], frequency: e.target.value };
                  setPrescriptionForm({ ...prescriptionForm, medications: next });
                }} />
                <input placeholder="Duration" value={item.duration} onChange={(e) => {
                  const next = [...prescriptionForm.medications];
                  next[index] = { ...next[index], duration: e.target.value };
                  setPrescriptionForm({ ...prescriptionForm, medications: next });
                }} />
              </div>
            ))}
            <button className="secondary-button inline-button" type="button" onClick={() => setPrescriptionForm({ ...prescriptionForm, medications: [...prescriptionForm.medications, { medication_name: "", dosage: "", frequency: "", duration: "" }] })}>
              Add medication row
            </button>
            <button className="primary-button inline-button" disabled={issuingPrescription} type="submit">
              {issuingPrescription ? "Issuing..." : "Issue prescription"}
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
                  Patient: {item.patient_id} | {formatDateTime(item.issued_at)}
                </span>
              </div>
            ))}
            {!prescriptions.length ? (
              <div className="empty-state">
                <p>No prescriptions issued yet.</p>
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
