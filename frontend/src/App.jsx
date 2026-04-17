import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";
import AppShell from "./components/AppShell";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AppointmentPage from "./pages/AppointmentPage";
import CreateAppointmentPage from "./pages/CreateAppointmentPage";
import ConsultationPage from "./pages/ConsultationPage";

import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

import PaymentPage from "./pages/PaymentPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import AddPaymentMethodPage from "./pages/AddPaymentMethodPage";

function App() {
  return (
    <AuthProvider>
      <Router>

        {/* ✅ TOAST GLOBAL CONTAINER (ADDED ONLY THIS) */}
        <ToastContainer position="top-right" autoClose={3000} />

        <Routes>

          {/* 🔓 PUBLIC ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* DOCTOR */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute role="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* 🔒 PRIVATE ROUTES */}
          <Route
            path="/*"
            element={
              <AppShell>
                <Routes>
                  <Route path="/" element={<AppointmentPage />} />
                  <Route path="/appointments/new" element={<CreateAppointmentPage />} />
                  <Route path="/consultation/:appointmentId" element={<ConsultationPage />} />

                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/payment/status" element={<PaymentStatusPage />} />
                  <Route path="/payment/status/:paymentId" element={<PaymentStatusPage />} />
                  <Route path="/payment/add-method" element={<AddPaymentMethodPage />} />

                  <Route
                    path="/patient/dashboard"
                    element={
                      <ProtectedRoute role="patient">
                        <PatientDashboard />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </AppShell>
            }
          />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;