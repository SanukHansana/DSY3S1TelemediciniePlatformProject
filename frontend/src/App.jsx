import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CreateAppointment from "./components/CreateAppointment";
import AppointmentList from "./components/AppointmentList";

function App() {
  return (
    <Router>
      

        <Routes>
          
          <Route path="/createappointment" element={<CreateAppointment />} />
          <Route path="/appointmentlist" element={<AppointmentList />} />
        </Routes>
      
    </Router>
  );
}

export default App;