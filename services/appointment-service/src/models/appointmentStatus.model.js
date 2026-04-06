import mongoose from "mongoose";

const appointmentStatusSchema = new mongoose.Schema({
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  old_status: String,
  new_status: String,
  changed_by_role: String,
  changed_by_id: String,
  changed_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(
  "AppointmentStatusLog",
  appointmentStatusSchema
);