import mongoose from "mongoose";

const medicalReportSchema = new mongoose.Schema(
  {
    _id: {
      type: String
    },
    patient_id: {
      type: String,
      required: true,
      index: true
    },
    auth_user_id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: "general"
    },
    description: {
      type: String,
      default: ""
    },
    file_name: {
      type: String,
      required: true
    },
    mime_type: {
      type: String,
      default: "application/octet-stream"
    },
    size_bytes: {
      type: Number,
      required: true
    },
    file_data: {
      type: Buffer,
      required: true
    },
    uploaded_at: {
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

medicalReportSchema.index({ patient_id: 1, uploaded_at: -1 });

const MedicalReport = mongoose.model("MedicalReport", medicalReportSchema);

export default MedicalReport;
