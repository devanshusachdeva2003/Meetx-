const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");

const app = express();
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is healthy", 
    env: process.env.NODE_ENV || "development",
    timestamp: new Date() 
  });
});

// Modular Routes Mount Point
app.use("/api", apiRoutes);

module.exports = app;
