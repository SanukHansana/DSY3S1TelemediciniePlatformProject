import express from "express";

import patientRoutes from "./routes/patient.routes.js";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Report-Meta"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.get("/", (req, res) => {
  res.json({
    service: "patient-service",
    status: "running",
    endpoints: {
      patients: "/api/patients",
      health: "/health"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "patient-service",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/patients", patientRoutes);

app.use((error, req, res, next) => {
  console.error("Patient service error:", error);

  res.status(error.status || 500).json({
    message: error.message || "Internal server error"
  });
});

export default app;
