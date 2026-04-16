import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // ✅ IMPORTANT
import "./App.css";
import AppShell from "./components/AppShell";

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
    <AuthProvider> {/* ✅ Wrap EVERYTHING */}
      <Router>
        <Routes>

          {/* 🔓 PUBLIC ROUTES (NO LAYOUT) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🔒 PRIVATE ROUTES (WITH LAYOUT) */}
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

                  {/* DASHBOARDS */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute role="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/doctor/dashboard"
                    element={
                      <ProtectedRoute role="doctor">
                        <DoctorDashboard />
                      </ProtectedRoute>
                    }
                  />

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