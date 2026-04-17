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

    </div>
  );
}