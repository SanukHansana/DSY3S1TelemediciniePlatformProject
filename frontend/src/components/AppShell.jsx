import { Link } from "react-router-dom";

export default function AppShell({ children }) {
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
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/">Appointments</Link>
          <Link to="/appointments/new">Create Appointment</Link>
          <Link to="/payment">Make Payment</Link>
          <Link to="/payment/status">Payment Status</Link>
        </nav>
      </header>

      <main className="page-content">{children}</main>

      <footer className="app-footer">
        <p>© 2026 Telemedicine Platform</p>
      </footer>
    </div>
  );
}
