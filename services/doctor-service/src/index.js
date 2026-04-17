import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { seedMockDoctors } from "./lib/seed.js";

const PORT = process.env.PORT || 4002;

const startServer = async () => {
  try {
    await connectDB();
    await seedMockDoctors();

    app.listen(PORT, () => {
      console.log(`Doctor Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start doctor service:", error);
    process.exit(1);
  }
};

startServer();
