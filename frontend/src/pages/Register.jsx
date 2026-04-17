import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { toast } from "react-toastify";
import "./register.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ---------------- VALIDATION ----------------
  const validate = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return false;
    }

    if (!form.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid email format");
      return false;
    }

    if (!form.password) {
      toast.error("Password is required");
      return false;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (!/[A-Z]/.test(form.password)) {
      toast.error("Password must include 1 uppercase letter");
      return false;
    }

    if (!/[0-9]/.test(form.password)) {
      toast.error("Password must include 1 number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await registerUser(form);

      toast.success("Account created successfully 🎉");

      console.log("SUCCESS:", res.data);

      setTimeout(() => {
        navigate("/login");
      }, 1000);

    } catch (err) {
      toast.error(err.response?.data?.msg || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">

        <form onSubmit={handleSubmit} className="register-card">

          <h2 className="register-title">Create Account</h2>

          {/* NAME */}
          <input
            className="register-input"
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          {/* EMAIL */}
          <input
            className="register-input"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          {/* PASSWORD */}
          <div className="password-wrapper">
            <input
              className="register-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* ROLE */}
          <div className="role-group">
            <label>
              <input
                type="radio"
                value="patient"
                checked={form.role === "patient"}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              />
              Patient
            </label>

            <label>
              <input
                type="radio"
                value="doctor"
                checked={form.role === "doctor"}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              />
              Doctor
            </label>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>

        </form>
      </div>
    </div>
  );
}