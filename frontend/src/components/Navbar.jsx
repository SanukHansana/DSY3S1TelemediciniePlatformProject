import { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, token, logout } = useContext(AuthContext);
  const currentRole = user?.role || localStorage.getItem("role");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src="/mainlogo.png" alt="Ceylon MediHub" className="navbar-logo" />
          <span className="navbar-brand-name">Ceylon MediHub</span>
        </Link>

        <button
          className={`navbar-hamburger${menuOpen ? " navbar-hamburger--open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar-links${menuOpen ? " navbar-links--open" : ""}`}>
          {!token && (
            <Link to="/login" className={`nav-link${isActive("/login") ? " nav-link--active" : ""}`}>Login</Link>
          )}
          {!token && (
            <Link to="/register" className={`nav-link${isActive("/register") ? " nav-link--active" : ""}`}>Register</Link>
          )}
          <Link to="/" className={`nav-link${isActive("/") ? " nav-link--active" : ""}`}>Appointments</Link>
          <Link to="/appointments/new" className={`nav-link${isActive("/appointments/new") ? " nav-link--active" : ""}`}>Book</Link>
          <Link to="/patient/dashboard" className={`nav-link${isActive("/patient/dashboard") ? " nav-link--active" : ""}`}>Patient</Link>
          <Link to="/doctor/dashboard" className={`nav-link${isActive("/doctor/dashboard") ? " nav-link--active" : ""}`}>Doctor</Link>
          <Link to="/payment" className={`nav-link${isActive("/payment") ? " nav-link--active" : ""}`}>Payment</Link>
          <Link to="/payment/status" className={`nav-link${isActive("/payment/status") ? " nav-link--active" : ""}`}>Pay Status</Link>
          {currentRole === "admin" && token && (
            <Link to="/admin" className={`nav-link${isActive("/admin") ? " nav-link--active" : ""}`}>Admin</Link>
          )}
          {token && (
            <button className="nav-link nav-logout" onClick={logout} type="button">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
