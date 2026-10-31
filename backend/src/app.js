const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const apiRoutes = require("./routes");
const { ensureDBConnection } = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// HTTP Request Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(ensureDBConnection);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "MeetX backend is running",
  });
});

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date(),
  });
});

// Modular Routes Mount Point
app.use("/api", apiRoutes);

// Global Error Handler MUST be the very last middleware
app.use(errorHandler);

module.exports = app;
