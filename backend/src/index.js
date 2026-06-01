const path = require("path");
const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV.trim()}`
  : ".env.local";
require("dotenv").config({ path: path.resolve(process.cwd(), envFile) });

const http = require("http");
const { connectDB } = require("./config/db");
const app = require("./app");

const server = http.createServer(app);

async function start() {
  const port = process.env.PORT || 4000;
  if (process.env.MONGODB_URI) {
    try {
      await connectDB(process.env.MONGODB_URI);
    } catch (err) {
      console.error("Database connection error:", err);
    }
  }
  server.listen(port, () => console.log(`Server listening on ${port}`));
}

start();
