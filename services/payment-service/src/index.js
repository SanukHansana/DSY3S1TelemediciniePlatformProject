const express = require("express");

const app = express();
const PORT = 4005;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Payment Service is running");
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});