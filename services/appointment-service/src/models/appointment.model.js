import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient_id: {
      type: String,
      required: true
    },
    doctor_id: {
      type: String,
      required: true
    },
    slot_id: {
      type: String
    },
    status: {
      type: String,
      default: "scheduled"
    },
    appointment_type: {
      type: String,
      enum: ["video", "physical"],
      default: "video"
    },
    patient_notes: String,
    doctor_notes: String,
    fee_amount: Number,
    scheduled_at: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);