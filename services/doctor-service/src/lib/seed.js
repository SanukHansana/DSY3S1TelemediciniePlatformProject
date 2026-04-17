import AvailabilitySlot from "../models/availability.model.js";
import Doctor from "../models/doctor.model.js";
import mockDoctors from "../data/mockDoctors.js";

const isMockSeedEnabled = () =>
  ["1", "true", "yes", "on"].includes(
    String(process.env.ENABLE_DOCTOR_MOCK_SEED || "").trim().toLowerCase()
  );

export const seedMockDoctors = async () => {
  if (!isMockSeedEnabled() || mockDoctors.length === 0) {
    return;
  }

  await Promise.all(
    mockDoctors.map((doctor) =>
      Doctor.updateOne(
        { _id: doctor._id },
        {
          $setOnInsert: {
            _id: doctor._id,
            full_name: doctor.full_name,
            specialty: doctor.specialty,
            consultation_fee: doctor.consultation_fee,
            bio: "",
            experience_years: null,
            qualifications: [],
            languages: [],
            hospital_affiliation: "",
            license_number: "",
            is_verified: doctor.is_verified,
            is_active: true
          }
        },
        {
          upsert: true,
          timestamps: false
        }
      )
    )
  );

  const slots = mockDoctors.flatMap((doctor) =>
    doctor.slots.map((slot) => ({
      _id: slot._id,
      doctor_id: doctor._id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      specific_date: slot.specific_date,
      status: "available"
    }))
  );

  if (slots.length === 0) {
    return;
  }

  await Promise.all(
    slots.map((slot) =>
      AvailabilitySlot.updateOne(
        { _id: slot._id },
        {
          $setOnInsert: {
            ...slot
          }
        },
        {
          upsert: true,
          timestamps: false
        }
      )
    )
  );
};
