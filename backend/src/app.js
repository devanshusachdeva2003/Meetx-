const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const { errorHandler } = require("./middleware/errorMiddleware");

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

// Global Error Handler MUST be the very last middleware
app.use(errorHandler);

module.exports = app;
