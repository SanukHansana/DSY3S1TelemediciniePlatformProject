import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import "./App.css";
import AppShell from "./components/AppShell";
import AppointmentPage from "./pages/AppointmentPage";
import CreateAppointmentPage from "./pages/CreateAppointmentPage";
import ConsultationPage from "./pages/ConsultationPage";

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<AppointmentPage />} />
          <Route path="/appointments/new" element={<CreateAppointmentPage />} />
          <Route path="/consultation/:appointmentId" element={<ConsultationPage />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
