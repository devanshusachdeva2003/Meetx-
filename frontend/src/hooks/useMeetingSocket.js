import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

export function useMeetingSocket({ roomId, user, onMeetingStarted, onMeetingEnded }) {
  const socketRef = useRef(null);
  const [meetingStatus, setMeetingStatus] = useState("waiting"); // 'scheduled' | 'waiting' | 'live' | 'ended'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState(null);
  const [recorderName, setRecorderName] = useState(null);
  const [recordingProcessingStatus, setRecordingProcessingStatus] = useState(null); // 'recording' | 'processing' | 'ready' | 'failed'
  const [latestRecording, setLatestRecording] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
    const token = localStorage.getItem("token") || "";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      query: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("meeting:join", {
        roomId,
        user: {
          id: user?.id || user?._id || socket.id,
          name: user?.name || "Guest",
        },
      });
    });

    // Meeting started by host
    socket.on("meeting:started", (data) => {
      setMeetingStatus("live");
      toast.success("The meeting has started!");
      if (onMeetingStarted) onMeetingStarted(data);
    });

    // Meeting ended by host
    socket.on("meeting:ended", (data) => {
      setMeetingStatus("ended");
      setIsRecording(false);
      toast.info("The host has ended the meeting for everyone.");
      if (onMeetingEnded) onMeetingEnded(data);
    });

    // Recording events
    socket.on("recording:started", (data) => {
      setIsRecording(true);
      setRecordingStartedAt(data.recordingStartedAt ? new Date(data.recordingStartedAt) : new Date());
      setRecorderName(data.recorderName || "Host");
      setRecordingProcessingStatus("recording");
      toast.info(`${data.recorderName || "Host"} started recording the meeting.`);
    });

    socket.on("recording:stop", () => {
      setIsRecording(false);
      setRecordingProcessingStatus("processing");
      toast.info("Meeting recording ended. Processing MP4 video...");
    });

    socket.on("recording:processing", () => {
      setRecordingProcessingStatus("processing");
    });

    socket.on("recording:completed", (data) => {
      setIsRecording(false);
      setRecordingProcessingStatus("ready");
      setLatestRecording(data.recording);
      toast.success("Meeting recording is ready in MP4 format!");
    });

    socket.on("recording:failed", (data) => {
      setIsRecording(false);
      setRecordingProcessingStatus("failed");
      toast.error(data.error || "Recording processing failed.");
    });

    return () => {
      socket.emit("meeting:leave", { roomId });
      socket.disconnect();
    };
  }, [roomId, user?.id, user?._id, user?.name, onMeetingStarted, onMeetingEnded]);

  return {
    socket: socketRef.current,
    meetingStatus,
    setMeetingStatus,
    isRecording,
    setIsRecording,
    recordingStartedAt,
    recorderName,
    recordingProcessingStatus,
    setRecordingProcessingStatus,
    latestRecording,
    setLatestRecording,
  };
}

