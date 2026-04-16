import { useState, useContext } from "react";
import { loginUser } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    console.log("LOGIN CLICKED:", { email, password });

    const res = await loginUser({ email, password });

    console.log("LOGIN RESPONSE:", res.data);

    // ❌ OLD: const user = res.data.user;
    const { role, isVerified } = res.data;

    login(res.data);

    // ✅ FIXED ROUTING
    if (role === "admin") {
      navigate("/admin");
    }

    else if (role === "doctor") {
      if (isVerified) {
        navigate("/doctor/dashboard");
      } else {
        alert("Doctor not verified yet");
      }
    }

    else {
      navigate("/patient/dashboard");
    }

  } catch (err) {
    console.log("LOGIN ERROR:", err.response?.data || err.message);
    alert(err.response?.data?.msg || "Login failed");
  }
};

 return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 px-4">
    
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="backdrop-blur-lg bg-white/90 p-8 rounded-2xl shadow-2xl border border-white/30"
      >
        {/* Logo / Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">
            Login to your account
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-sm text-gray-600">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Sign In
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-3 text-gray-400 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Register Link */}
        <p className="text-sm text-center text-gray-600">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            Create one
          </span>
        </p>
      </form>
    </div>
  </div>
);
}