const path = require("path");
const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV.trim()}`
  : ".env.local";
require("dotenv").config({ path: path.resolve(process.cwd(), envFile) });

console.log("=== BACKEND ENV CHECK ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Env File Loaded:", envFile);
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("LIVEKIT_URL:", process.env.LIVEKIT_URL);
console.log("=========================");

const express = require("express");
const http = require("http");
const cors = require("cors");

const { connectDB } = require("./config/db");
const { authRoutes } = require("./modules/auth/auth.routes");
const meetingRoutes = require("./routes/meetings");
const calendarRoutes = require("./routes/calendar");
const { verify } = require("./utils/jwt");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/calendar", calendarRoutes);

const { AccessToken } = require("livekit-server-sdk");

app.get("/api/livekit/token", async (req, res) => {
  const { room, username } = req.query;
  if (!room || !username) {
    return res.status(400).json({ error: "room and username are required" });
  }

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    return res
      .status(500)
      .json({ error: "LiveKit API key or secret is not configured" });
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: username },
  );

  at.addGrant({ roomJoin: true, room: room });

  res.json({ token: await at.toJwt() });
});

const server = http.createServer(app);

async function start() {
  const port = process.env.PORT || 4000;
  if (process.env.MONGODB_URI) {
    try {
      await connectDB(process.env.MONGODB_URI);
    } catch (err) {
      console.error(err);
    }
  }
  server.listen(port, () => console.log(`Server listening on ${port}`));
}

start();
