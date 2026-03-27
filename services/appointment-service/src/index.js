const express = require("express");

const app = express();
const PORT = 4003;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Appointment Service is running");
});

app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});