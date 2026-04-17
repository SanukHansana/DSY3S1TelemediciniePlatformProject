import { useState, useContext } from "react";
import { loginUser } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await loginUser({ email, password });
      localStorage.setItem("last_login_email", email.trim());

      const { role, isVerified } = res.data;

      login(res.data);

      if (role === "admin") navigate("/admin");
      else if (role === "doctor") {
        if (isVerified) navigate("/doctor/dashboard");
        else alert("Doctor not verified yet");
      } else {
        navigate("/patient/dashboard");
      }

    } catch (err) {
      alert(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="login-page">

      <div className="login-glow"></div>

      <div className="login-container">

        <form onSubmit={handleSubmit} className="login-card">

          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue</p>
          </div>

          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-button">
            Sign In
          </button>

          <div className="login-divider">
            <span>OR</span>
          </div>

          <p className="login-footer">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/register")}>
              Create one
            </span>
          </p>

        </form>
      </div>
    </div>
  );
}
