import express from "express";

import doctorRoutes from "./routes/doctor.routes.js";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));

app.get("/", (req, res) => {
  res.json({
    service: "doctor-service",
    status: "running",
    endpoints: {
      publicDoctors: "/api/doctors",
      health: "/health"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "doctor-service",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/doctors", doctorRoutes);

app.use((error, req, res, next) => {
  console.error("Doctor service error:", error);

  res.status(error.status || 500).json({
    message: error.message || "Internal server error"
  });
});

export default app;
