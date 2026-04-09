import dotenv from "dotenv";
import express from "express";

import mockDoctors from "./data/mockDoctors.js";

dotenv.config();

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "doctor-service",
    mode: "mock-data",
    status: "running"
  });
});

app.get("/api/doctors", (req, res) => {
  const doctors = mockDoctors.map(({ slots, ...doctor }) => doctor);
  res.json(doctors);
});

app.get("/api/doctors/:doctorId/slots", (req, res) => {
  const doctor = mockDoctors.find(({ _id }) => _id === req.params.doctorId);

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  return res.json(doctor.slots);
});

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});
