const path = require("path");
const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV.trim()}`
  : ".env.local";
require("dotenv").config({ path: path.resolve(process.cwd(), envFile) });

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { initPrivateConnectSocket } = require("./modules/privateConnect/socket");
const { initWhiteboardSocket } = require("./modules/whiteboard/whiteboard.socket");
const { initMeetingSocket } = require("./modules/meeting/meeting.socket");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});

initPrivateConnectSocket(io);
initWhiteboardSocket(io);
initMeetingSocket(io);

if (!process.env.VERCEL) {
  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log(`Server listening on ${port}`));
}

module.exports = app;

