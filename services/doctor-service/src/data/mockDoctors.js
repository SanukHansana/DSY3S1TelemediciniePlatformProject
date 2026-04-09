const mockDoctors = [
  {
    _id: "doc-cardiology-001",
    full_name: "Dr. Amelia Perera",
    specialty: "Cardiology",
    consultation_fee: 3500,
    is_verified: true,
    slots: [
      {
        _id: "slot-cardio-01",
        day_of_week: "Monday",
        start_time: "09:00",
        end_time: "09:30",
        specific_date: "2026-04-13T09:00:00.000Z"
      },
      {
        _id: "slot-cardio-02",
        day_of_week: "Wednesday",
        start_time: "15:00",
        end_time: "15:30",
        specific_date: "2026-04-15T15:00:00.000Z"
      }
    ]
  },
  {
    _id: "doc-dermatology-002",
    full_name: "Dr. Nimal Fernando",
    specialty: "Dermatology",
    consultation_fee: 2800,
    is_verified: true,
    slots: [
      {
        _id: "slot-derma-01",
        day_of_week: "Tuesday",
        start_time: "11:00",
        end_time: "11:20",
        specific_date: "2026-04-14T11:00:00.000Z"
      },
      {
        _id: "slot-derma-02",
        day_of_week: "Thursday",
        start_time: "13:30",
        end_time: "13:50",
        specific_date: "2026-04-16T13:30:00.000Z"
      }
    ]
  },
  {
    _id: "doc-general-003",
    full_name: "Dr. Sarah Jayasinghe",
    specialty: "General Medicine",
    consultation_fee: 2200,
    is_verified: true,
    slots: [
      {
        _id: "slot-general-01",
        day_of_week: "Friday",
        start_time: "10:00",
        end_time: "10:30",
        specific_date: "2026-04-17T10:00:00.000Z"
      },
      {
        _id: "slot-general-02",
        day_of_week: "Saturday",
        start_time: "08:30",
        end_time: "09:00",
        specific_date: "2026-04-18T08:30:00.000Z"
      }
    ]
  }
];

export default mockDoctors;
