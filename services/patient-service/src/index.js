import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "patient-service",
    status: "running"
  });
});

app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});
