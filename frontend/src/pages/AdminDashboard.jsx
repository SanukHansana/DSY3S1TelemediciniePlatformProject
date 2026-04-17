import { useEffect, useState } from "react";
import { getUsers, verifyDoctor, deleteUser, updateUser } from "../services/adminService";
import paymentApi from "../services/paymentApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./admin.css";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
  });

  const navigate = useNavigate();

  // ---------------- USERS ----------------
  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
      console.log(err.message);
    }
  };

  const handleVerify = async (id) => {
    try {
      await verifyDoctor(id);
      toast.success("Doctor verified successfully");
      loadUsers();
    } catch (err) {
      toast.error("Verification failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await deleteUser(id);
      toast.success("User deleted successfully");
      loadUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  };

  const handleUpdate = async () => {
    try {
      await updateUser(editingUser._id, editForm);
      toast.success("User updated successfully");
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      toast.error("Failed to update user");
    }
  };

  // ---------------- PAYMENTS ----------------
  const loadPayments = async () => {
    try {
      const res = await paymentApi.getAllPayments();
      setPayments(res || []);
    } catch (err) {
      toast.error("Failed to load payments");
    }
  };

  useEffect(() => {
    loadUsers();
    loadPayments();
  }, []);

  // ---------------- FILTER ----------------
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" || user.role === filter;

    return matchesSearch && matchesFilter;
  });

  // ---------------- STATS ----------------
  const totalDoctors = users.filter(u => u.role === "doctor").length;
  const totalPatients = users.filter(u => u.role === "patient").length;

  const successfulPayments = payments.filter(p => p.status === "success").length;
  const failedPayments = payments.filter(p => p.status === "failed").length;

  const totalEarnings = payments
    .filter(p => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="admin-page">

      {/* NAVBAR */}
      <div className="admin-navbar">
        <h2>Admin Panel</h2>

        <div className="admin-nav-links">
          <button onClick={() => navigate("/admin/patients")}>Patients</button>
          <button onClick={() => navigate("/admin/appointments")}>Appointments</button>
        </div>
      </div>

      {/* USER STATS */}
      <div className="admin-cards">
        <div className="admin-card">
          <h3>Doctors</h3>
          <p>{totalDoctors}</p>
        </div>

        <div className="admin-card">
          <h3>Patients</h3>
          <p>{totalPatients}</p>
        </div>

        <div className="admin-card">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="admin-controls">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="doctor">Doctors</option>
          <option value="patient">Patients</option>
        </select>
      </div>

      {/* USERS TABLE */}
      <div className="admin-table">
        <h2>All Users</h2>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>

                <td>
                  {user.role === "doctor" ? (
                    user.isVerified ? (
                      <span className="verified-badge">Verified</span>
                    ) : (
                      <button onClick={() => handleVerify(user._id)}>
                        Verify
                      </button>
                    )
                  ) : "-"}
                </td>

                <td>
                  {user.role !== "admin" && (
                    <>
                      <button onClick={() => handleEditClick(user)}>
                        Edit
                      </button>

                      <button onClick={() => handleDelete(user._id)}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">

            <h3>Edit User</h3>

            <input
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />

            <input
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
            />

            <select
              value={editForm.role}
              onChange={(e) =>
                setEditForm({ ...editForm, role: e.target.value })
              }
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>

            <div className="modal-actions">
              <button onClick={handleUpdate}>Save</button>
              <button onClick={() => setEditingUser(null)}>Cancel</button>
            </div>

          </div>
        </div>
      )}

      {/* PAYMENTS */}
      <div className="admin-table">
        <h2>Payments</h2>

        <div className="admin-cards">
          <div className="admin-card">
            <h3>Success</h3>
            <p>{successfulPayments}</p>
          </div>

          <div className="admin-card">
            <h3>Failed</h3>
            <p>{failedPayments}</p>
          </div>

          <div className="admin-card">
            <h3>Earnings</h3>
            <p>Rs. {totalEarnings}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td>{p.patient?.name}</td>
                <td>{p.doctor?.name}</td>
                <td>Rs. {p.amount}</td>

                <td>
                  <span style={{ color: p.status === "success" ? "green" : "red" }}>
                    {p.status}
                  </span>
                </td>

                <td>
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}