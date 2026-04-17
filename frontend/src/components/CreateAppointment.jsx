import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { getAvailableDoctors, getDoctorSlots } from "../services/doctorApi";
import { createPatientAppointment } from "../services/patientApi";

export default function CreateAppointment() {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const currentRole = user?.role || localStorage.getItem("role");
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    doctor_id: "",
    slot_id: "",
    scheduled_at: "",
    appointment_type: "video",
    patient_notes: ""
  });

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoadingDoctors(true);
        const data = await getAvailableDoctors();
        setDoctors(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError.message || "Could not load doctors");
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  if (!token) {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Appointment Setup</p>
            <h2>Create a video consultation</h2>
          </div>
        </div>
        <p className="form-hint">
          Login with a patient account to book appointments without typing a patient ID.
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
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Appointment Setup</p>
            <h2>Create a video consultation</h2>
          </div>
        </div>
        <p className="status-message error">
          Only patient accounts can create appointments from this page.
        </p>
      </section>
    );
  }

  const handleDoctorChange = async (doctorId) => {
    setForm((current) => ({
      ...current,
      doctor_id: doctorId,
      slot_id: "",
      scheduled_at: ""
    }));

    if (!doctorId) {
      setSlots([]);
      return;
    }

    try {
      setError("");
      const data = await getDoctorSlots(doctorId);
      setSlots(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load doctor slots");
      setSlots([]);
    }
  };

  const handleSlotChange = (slotId) => {
    const slot = slots.find((entry) => entry._id === slotId);

    setForm((current) => ({
      ...current,
      slot_id: slotId,
      scheduled_at: slot?.specific_date || ""
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const appointment = await createPatientAppointment(token, {
        doctor_id: form.doctor_id,
        slot_id: form.slot_id || null,
        scheduled_at: form.scheduled_at,
        appointment_type: form.appointment_type,
        patient_notes: form.patient_notes
      });
      // Navigate to payment page with appointment ID and consultation fee
      navigate("/payment", { 
        state: { 
          appointmentId: appointment._id || appointment.id,
          amount: 150.00, // Default consultation fee - can be made dynamic
          patientId: appointment.patient_id || null
        } 
      });
    } catch (saveError) {
      setError(saveError.message || "Could not create appointment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Appointment Setup</p>
          <h2>Create a video consultation</h2>
        </div>

        <Link className="ghost-link" to="/">
          Back to appointments
        </Link>
      </div>

      <form className="appointment-form" onSubmit={handleSubmit}>
        <label>
          <span>Select doctor</span>
          <select
            value={form.doctor_id}
            onChange={(event) => handleDoctorChange(event.target.value)}
            disabled={isLoadingDoctors}
            required
          >
            <option value="">
              {isLoadingDoctors ? "Loading doctors..." : "Choose a doctor"}
            </option>

            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.full_name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Select available slot</span>
          <select
            value={form.slot_id}
            onChange={(event) => handleSlotChange(event.target.value)}
            disabled={!form.doctor_id}
            required
          >
            <option value="">
              {form.doctor_id ? "Choose a slot" : "Select a doctor first"}
            </option>

            {slots.map((slot) => (
              <option key={slot._id} value={slot._id}>
                {slot.day_of_week} | {slot.start_time} - {slot.end_time}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Appointment type</span>
          <input value="Video consultation" disabled />
        </label>

        <label>
          <span>Patient notes</span>
          <textarea
            rows="4"
            value={form.patient_notes}
            placeholder="Add a short note for the doctor"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                patient_notes: event.target.value
              }))
            }
          />
        </label>

        {form.scheduled_at ? (
          <p className="form-hint">
            Selected slot: {new Date(form.scheduled_at).toLocaleString()}
          </p>
        ) : null}

        <p className="form-hint">
          Your patient ID is linked automatically from your logged-in account.
        </p>

        {error ? <p className="status-message error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={isSaving}>
          {isSaving ? "Creating..." : "Create appointment"}
        </button>
      </form>
    </section>
  );
}
