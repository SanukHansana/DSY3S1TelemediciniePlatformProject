import { useState } from "react";
import { registerUser } from "../services/authService";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await registerUser(form);
    console.log("SUCCESS:", res.data);
    alert("Registered successfully");
  } catch (err) {
    console.log("ERROR:", err.response?.data);   // 👈 VERY IMPORTANT
    alert(err.response?.data?.msg || "Register failed");
  }
};
  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>

      <input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />

      <select onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
      </select>

      <button type="submit">Register</button>
    </form>
  );
}