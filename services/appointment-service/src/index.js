import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./config/db.js";
import appointmentRoutes from "./routes/appointment.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

connectDB();

app.use("/api/appointments", appointmentRoutes);

app.get("/", (req, res) => {
  res.send("Appointment Service Running");
});

const PORT = process.env.PORT || 4003;

app.listen(PORT, () =>
  console.log(`Appointment Service running on port ${PORT}`)
);