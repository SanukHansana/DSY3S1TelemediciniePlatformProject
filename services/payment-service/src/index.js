import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4005;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "payment-service",
    status: "running"
  });
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
