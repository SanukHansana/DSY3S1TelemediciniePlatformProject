import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    _id: {
      type: String
    },
    doctor_id: {
      type: String,
      required: true,
      index: true
    },
    day_of_week: {
      type: String,
      default: null
    },
    start_time: {
      type: String,
      required: true
    },
    end_time: {
      type: String,
      required: true
    },
    specific_date: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["available", "booked", "unavailable"],
      default: "available"
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

availabilitySchema.index({ doctor_id: 1, specific_date: 1, status: 1 });

const AvailabilitySlot = mongoose.model("AvailabilitySlot", availabilitySchema);

export default AvailabilitySlot;
