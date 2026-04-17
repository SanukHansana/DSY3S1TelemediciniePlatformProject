import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 4001;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Patient Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start patient service:", error);
    process.exit(1);
  }
};

startServer();
