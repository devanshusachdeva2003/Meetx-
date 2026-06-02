const path = require("path");
const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV.trim()}`
  : ".env.local";
require("dotenv").config({ path: path.resolve(process.cwd(), envFile) });

const { connectDB } = require("./config/db");
const app = require("./app");

// Connect to Database globally so Serverless Functions can cache the connection
if (process.env.MONGODB_URI) {
  connectDB(process.env.MONGODB_URI).catch(err => {
    console.error("Database connection error:", err);
  });
}

// If running locally (not in Vercel production), start the listener
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

// Export the Express app so Vercel can run it as a Serverless Function
module.exports = app;
