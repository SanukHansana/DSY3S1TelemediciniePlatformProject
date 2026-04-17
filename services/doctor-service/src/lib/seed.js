import AvailabilitySlot from "../models/availability.model.js";
import Doctor from "../models/doctor.model.js";
import mockDoctors from "../data/mockDoctors.js";

export const seedMockDoctors = async () => {
  if (mockDoctors.length === 0) {
    return;
  }

  await Doctor.bulkWrite(
    mockDoctors.map((doctor) => ({
      updateOne: {
        filter: { _id: doctor._id },
        update: {
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
        upsert: true
      }
    }))
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

  await AvailabilitySlot.bulkWrite(
    slots.map((slot) => ({
      updateOne: {
        filter: { _id: slot._id },
        update: {
          $setOnInsert: {
            ...slot
          }
        },
        upsert: true
      }
    }))
  );
};
