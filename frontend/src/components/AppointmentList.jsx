import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAppointments } from "../services/appointmentApi";

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setIsLoading(true);
        const data = await getAppointments();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError.message || "Could not load appointments");
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, []);

  if (isLoading) {
    return (
      <section className="panel">
        <h2>Appointments</h2>
        <p>Loading appointments...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h2>Appointments</h2>
        <p className="status-message error">{error}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Consultation Queue</p>
          <h2>Appointments</h2>
        </div>

        <Link className="primary-button inline-button" to="/appointments/new">
          New appointment
        </Link>
      </div>

      {!appointments.length ? (
        <div className="empty-state">
          <p>No appointments yet.</p>
          <p>Create one first, then open the video consultation from here.</p>
        </div>
      ) : null}

      <div className="card-grid">
        {appointments.map((appointment) => (
          <article className="appointment-card" key={appointment._id}>
            <div className="card-topline">
              <span className={`status-pill ${appointment.status || "scheduled"}`}>
                {appointment.status || "scheduled"}
              </span>
              <span className="type-badge">
                {appointment.appointment_type || "video"}
              </span>
            </div>

            <h3>{new Date(appointment.scheduled_at).toLocaleString()}</h3>

            <dl className="card-details">
              <div>
                <dt>Appointment ID</dt>
                <dd>{appointment._id}</dd>
              </div>
              <div>
                <dt>Patient ID</dt>
                <dd>{appointment.patient_id}</dd>
              </div>
              <div>
                <dt>Doctor ID</dt>
                <dd>{appointment.doctor_id}</dd>
              </div>
              <div>
                <dt>Slot ID</dt>
                <dd>{appointment.slot_id || "N/A"}</dd>
              </div>
            </dl>

            {appointment.patient_notes ? (
              <p className="notes-box">{appointment.patient_notes}</p>
            ) : null}

            {appointment.appointment_type === "video" ? (
              <div className="card-actions">
                <Link
                  className="primary-button inline-button"
                  to={`/consultation/${appointment._id}?role=patient`}
                >
                  Join as patient
                </Link>
                <Link
                  className="secondary-button inline-button"
                  to={`/consultation/${appointment._id}?role=doctor`}
                >
                  Join as doctor
                </Link>
              </div>
            ) : (
              <p className="form-hint">
                This appointment is not marked as a video consultation.
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
