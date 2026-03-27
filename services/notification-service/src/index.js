const express = require("express");

const app = express();
const PORT = 4006;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Notification Service is running");
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});