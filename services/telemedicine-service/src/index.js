import dotenv from "dotenv";
import express from "express";

import { connectDB } from "./config/db.js";
import sessionRoutes from "./routes/session.routes.js";

dotenv.config();

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "telemedicine-service",
    provider: process.env.VIDEO_PROVIDER || "jitsi",
    status: "running"
  });
});

app.use("/api/sessions", sessionRoutes);

const PORT = process.env.PORT || 4004;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Telemedicine Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
