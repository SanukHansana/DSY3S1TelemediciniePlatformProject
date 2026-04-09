import { useEffect, useState } from "react";
import { getAvailableDoctors, getDoctorSlots } from "../services/doctorApi";
import { createAppointment } from "../services/appointmentApi";

export default function CreateAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    slot_id: "",
    scheduled_at: ""
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    const data = await getAvailableDoctors();
    setDoctors(data);
  };

  const handleDoctorChange = async (doctorId) => {
    setForm({ ...form, doctor_id: doctorId });

    const data = await getDoctorSlots(doctorId);
    setSlots(data);
  };

  const handleSlotChange = (slotId) => {
    const slot = slots.find((s) => s._id === slotId);

    setForm({
      ...form,
      slot_id: slotId,
      scheduled_at: slot?.specific_date || ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await createAppointment(form);
    alert("Appointment created");
  };

  return (
    <div>
      <h2>Create Appointment</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Patient ID"
          onChange={(e) =>
            setForm({ ...form, patient_id: e.target.value })
          }
        />

        <br /><br />

        <select onChange={(e) => handleDoctorChange(e.target.value)}>
          <option>Select Doctor</option>

          {doctors.map((doc) => (
            <option key={doc._id} value={doc._id}>
              {doc.full_name} - {doc.specialty}
            </option>
          ))}
        </select>

        <br /><br />

        <select onChange={(e) => handleSlotChange(e.target.value)}>
          <option>Select Slot</option>

          {slots.map((slot) => (
            <option key={slot._id} value={slot._id}>
              {slot.day_of_week} | {slot.start_time} - {slot.end_time}
            </option>
          ))}
        </select>

        <br /><br />

        <button>Create Appointment</button>
      </form>
    </div>
  );
}