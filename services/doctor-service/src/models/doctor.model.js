import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    _id: {
      type: String
    },
    auth_user_id: {
      type: String
    },
    full_name: {
      type: String,
      default: "",
      trim: true
    },
    specialty: {
      type: String,
      default: "",
      trim: true
    },
    consultation_fee: {
      type: Number,
      default: 0,
      min: 0
    },
    bio: {
      type: String,
      default: ""
    },
    experience_years: {
      type: Number,
      default: null,
      min: 0
    },
    qualifications: {
      type: [String],
      default: []
    },
    languages: {
      type: [String],
      default: []
    },
    hospital_affiliation: {
      type: String,
      default: ""
    },
    license_number: {
      type: String,
      default: ""
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

doctorSchema.index(
  { auth_user_id: 1 },
  {
    unique: true,
    sparse: true
  }
);
doctorSchema.index({ specialty: 1, is_verified: 1, is_active: 1 });

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
