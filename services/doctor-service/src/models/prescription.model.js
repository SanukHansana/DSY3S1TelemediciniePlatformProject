import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    medication_name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      default: ""
    },
    frequency: {
      type: String,
      default: ""
    },
    duration: {
      type: String,
      default: ""
    },
    instructions: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    _id: {
      type: String
    },
    doctor_id: {
      type: String,
      required: true,
      index: true
    },
    patient_id: {
      type: String,
      required: true,
      index: true
    },
    appointment_id: {
      type: String,
      default: null
    },
    diagnosis: {
      type: String,
      required: true
    },
    medications: {
      type: [medicationSchema],
      default: []
    },
    notes: {
      type: String,
      default: ""
    },
    follow_up_date: {
      type: Date,
      default: null
    },
    issued_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

prescriptionSchema.index({ patient_id: 1, issued_at: -1 });
prescriptionSchema.index({ doctor_id: 1, issued_at: -1 });
prescriptionSchema.index({ appointment_id: 1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
