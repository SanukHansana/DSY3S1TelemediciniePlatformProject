const express = require("express");

const app = express();
const PORT = 4004;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Telemedicine Service is running");
});

app.listen(PORT, () => {
  console.log(`Telemedicine Service running on port ${PORT}`);
});