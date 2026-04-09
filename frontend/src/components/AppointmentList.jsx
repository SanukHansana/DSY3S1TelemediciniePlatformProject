import { useEffect, useState } from "react";
import { getAppointments } from "../services/appointmentApi";

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const data = await getAppointments();
    setAppointments(data);
  };

  return (
    <div>
      <h2>Appointments</h2>

      {appointments.map((a) => (
        <div key={a._id} style={{border:"1px solid gray",margin:"10px",padding:"10px"}}>
          <p>Doctor ID: {a.doctor_id}</p>
          <p>Slot ID: {a.slot_id}</p>
          <p>Status: {a.status}</p>
          <p>Date: {new Date(a.scheduled_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}