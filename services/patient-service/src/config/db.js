import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      "Patient service MongoDB URI is missing. Set MONGODB_URI or MONGO_URI."
    );
  }

  await mongoose.connect(mongoUri);
  isConnected = true;

  console.log("Patient DB Connected");

  mongoose.connection.on("error", (error) => {
    console.error("Patient DB connection error:", error);
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.log("Patient DB disconnected");
  });

  return mongoose.connection;
};

export default connectDB;
