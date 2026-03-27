const express = require("express");

const app = express();
const PORT = 4002;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Doctor Service is running");
});

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});