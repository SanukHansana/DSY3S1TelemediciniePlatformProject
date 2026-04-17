import { useContext } from "react";
import { Link } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

export default function AppShell({ children }) {
  const { user, token, logout } = useContext(AuthContext);
  const currentRole = user?.role || localStorage.getItem("role");

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DSY3S1 Telemedicine Platform</p>
          <h1>E Channelling platform with video consultations</h1>
          <p className="app-subtitle">
            Create a video appointment, then join the consultation as the
            patient or the doctor from the appointment list.
          </p>
        </div>

        <nav className="main-nav">
          {!token ? <Link to="/login">Login</Link> : null}
          {!token ? <Link to="/register">Register</Link> : null}
          <Link to="/">Appointments</Link>
          <Link to="/appointments/new">Create Appointment</Link>
          <Link to="/patient/dashboard">Patient Service</Link>
          <Link to="/doctor/dashboard">Doctor Service</Link>
          <Link to="/payment">Make Payment</Link>
          <Link to="/payment/status">Payment Status</Link>
          {currentRole === "admin" && token ? <Link to="/admin">Admin</Link> : null}
          {token ? (
            <button className="ghost-link nav-button" onClick={logout} type="button">
              Logout
            </button>
          ) : null}
        </nav>
      </header>

      <main className="page-content">{children}</main>

      <footer className="app-footer">
        <p>© 2026 Telemedicine Platform</p>
      </footer>
    </div>
  );
}
