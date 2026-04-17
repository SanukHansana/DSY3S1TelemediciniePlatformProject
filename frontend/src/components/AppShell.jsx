import { Link, Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppShell({ children }) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="app-shell">
      <Navbar />

      <header className={`hero-section${isHome ? "" : " hero-section--compact"}`}>
        <div className="hero-bg-grid" />
        <div className="hero-bg-blob hero-bg-blob--1" />
        <div className="hero-bg-blob hero-bg-blob--2" />

        <div className="hero-content">
          <p className="hero-eyebrow">E-Channelling &amp; Video Consultations</p>
          {isHome ? (
            <>
              <h1 className="hero-title">Your Health,<br />Our Priority</h1>
              <p className="hero-subtitle">
                Connect with certified doctors through seamless video consultations.
                Book appointments, receive care, and manage your health — all in one place.
              </p>
              <div className="hero-actions">
                <Link to="/appointments/new" className="primary-button hero-cta">Book an Appointment</Link>
                <Link to="/" className="secondary-button hero-cta">View Appointments</Link>
              </div>
            </>
          ) : (
            <h2 className="hero-compact-title">Ceylon MediHub</h2>
          )}
        </div>

        <nav className="main-nav">
          <Link to="/">Appointments</Link>
          <Link to="/appointments/new">Create Appointment</Link>
          <Link to="/payment">Make Payment</Link>
          <Link to="/payment/status">Payment Status</Link>
          <Link to="/notifications">Notifications</Link>
          <Link to="/notifications/templates">Template Admin</Link>
        </nav>
        {isHome && (
          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-num">500+</span>
              <span className="stat-label">Certified Doctors</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">24/7</span>
              <span className="stat-label">Available Care</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">10K+</span>
              <span className="stat-label">Happy Patients</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">100%</span>
              <span className="stat-label">Secure &amp; Private</span>
            </div>
          </div>
        )}
      </header>

      <main className="page-content">{children ?? <Outlet />}</main>

      <Footer />
    </div>
  );
}
