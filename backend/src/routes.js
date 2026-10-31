const express = require('express');
const router = express.Router();

const { authRoutes } = require("./modules/auth/auth.routes");
const meetingRoutes = require("./modules/meeting/meeting.routes");
const calendarRoutes = require("./modules/calendar/calendar.routes");
const noteRoutes = require("./modules/note/note.routes");
const privateConnectRoutes = require("./modules/privateConnect/privateConnect.routes");
const memoryRoutes = require("./modules/memoryWall/memory.routes");
const whiteboardRoutes = require("./modules/whiteboard/whiteboard.routes");

router.use("/auth", authRoutes);
router.use("/meetings", meetingRoutes);
router.use("/calendar", calendarRoutes);
router.use("/notes", noteRoutes);
router.use("/private-connect", privateConnectRoutes);
router.use("/memories", memoryRoutes);
router.use("/whiteboard", whiteboardRoutes);

module.exports = router;
