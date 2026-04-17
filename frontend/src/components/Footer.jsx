import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/mainlogo.png" alt="Ceylon MediHub" className="footer-logo" />
            <div>
              <p className="footer-brand-name">Ceylon MediHub</p>
              <p className="footer-brand-tagline">Healthcare, Reimagined</p>
            </div>
          </div>

          <div className="footer-nav">
            <p className="footer-nav-heading">Services</p>
            <Link to="/" className="footer-link">Appointments</Link>
            <Link to="/appointments/new" className="footer-link">Book Appointment</Link>
            <Link to="/patient/dashboard" className="footer-link">Patient Portal</Link>
            <Link to="/doctor/dashboard" className="footer-link">Doctor Portal</Link>
          </div>

          <div className="footer-nav">
            <p className="footer-nav-heading">Billing</p>
            <Link to="/payment" className="footer-link">Make Payment</Link>
            <Link to="/payment/status" className="footer-link">Payment Status</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Ceylon MediHub. All rights reserved.</p>
          <p className="footer-tagline">Connecting patients &amp; doctors across Ceylon.</p>
        </div>
      </div>
    </footer>
  );
}
