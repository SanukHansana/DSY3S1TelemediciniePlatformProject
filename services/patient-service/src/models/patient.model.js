import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    _id: {
      type: String
    },
    auth_user_id: {
      type: String,
      unique: true
    },
    full_name: {
      type: String,
      default: "",
      trim: true
    },
    email: {
      type: String,
      default: "",
      trim: true
    },
    date_of_birth: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    emergency_contact: {
      type: String,
      default: ""
    },
    blood_group: {
      type: String,
      default: ""
    },
    allergies: {
      type: [String],
      default: []
    },
    chronic_conditions: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

patientSchema.index({ email: 1 });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
