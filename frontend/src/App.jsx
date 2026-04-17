import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { AuthProvider } from "./context/AuthContext";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import AdminDashboard from "./pages/AdminDashboard";
import AppointmentPage from "./pages/AppointmentPage";
import ConsultationPage from "./pages/ConsultationPage";
import CreateAppointmentPage from "./pages/CreateAppointmentPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import Login from "./pages/Login";
import NotificationsPage from "./pages/NotificationsPage";
import NotificationTemplatesPage from "./pages/NotificationTemplatesPage";
import PatientDashboard from "./pages/PatientDashboard";
import PaymentPage from "./pages/PaymentPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import AddPaymentMethodPage from "./pages/AddPaymentMethodPage";
import Register from "./pages/Register";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<AppShell />}>
            <Route index element={<AppointmentPage />} />
            <Route path="/appointments/new" element={<CreateAppointmentPage />} />
            <Route
              path="/consultation/:appointmentId"
              element={<ConsultationPage />}
            />

            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment/status" element={<PaymentStatusPage />} />
            <Route
              path="/payment/status/:paymentId"
              element={<PaymentStatusPage />}
            />
            <Route path="/payment/add-method" element={<AddPaymentMethodPage />} />

            <Route path="/notifications" element={<NotificationsPage />} />
            <Route
              path="/notifications/templates"
              element={<NotificationTemplatesPage />}
            />

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
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
