const express = require("express");

const app = express();
const PORT = 4001;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Patient Service is running");
});

app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});