import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import "./App.css";
import AppShell from "./components/AppShell";
import AppointmentPage from "./pages/AppointmentPage";
import CreateAppointmentPage from "./pages/CreateAppointmentPage";
import ConsultationPage from "./pages/ConsultationPage";

// Payment pages
import PaymentPage from "./pages/PaymentPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import AddPaymentMethodPage from "./pages/AddPaymentMethodPage";

// 👇 OPTIONAL (only if you created them)
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<AppointmentPage />} />
          <Route path="/appointments/new" element={<CreateAppointmentPage />} />
          <Route path="/consultation/:appointmentId" element={<ConsultationPage />} />
          
          {/* Payment routes */}
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment/status" element={<PaymentStatusPage />} />
          <Route path="/payment/status/:paymentId" element={<PaymentStatusPage />} />
          <Route path="/payment/add-method" element={<AddPaymentMethodPage />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;