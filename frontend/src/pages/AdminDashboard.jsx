import { useEffect, useState } from "react";
import { getDoctors, verifyDoctor } from "../services/adminService";

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);

 const loadDoctors = async () => {
  const res = await getDoctors();

  setDoctors(res.data); // ✅ no .users, no filter required
};


  useEffect(() => {
    loadDoctors();
  }, []);

  const handleVerify = async (id) => {
    await verifyDoctor(id);
    loadDoctors(); // refresh list
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Dashboard</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Verified</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {doctors.map((doc) => (
            <tr key={doc._id}>
              <td>{doc.name}</td>
              <td>{doc.email}</td>
              <td>{doc.isVerified ? "Yes" : "No"}</td>
              <td>
                {!doc.isVerified && (
                  <button onClick={() => handleVerify(doc._id)}>
                    Verify
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}