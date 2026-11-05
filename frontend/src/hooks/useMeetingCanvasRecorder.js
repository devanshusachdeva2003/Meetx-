import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import api from "../utils/api";

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export function useMeetingCanvasRecorder({
  roomId,
  room,
  localParticipant,
  localStream,
  isLocalVideoOff,
  isLocalMuted,
  localName,
  remoteStreams,
  uiParticipants,
  isHost,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null); // 'recording' | 'processing' | 'ready' | 'failed'
  const [readyRecording, setReadyRecording] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const animFrameIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioDestinationRef = useRef(null);
  const connectedAudioTracksRef = useRef(new Set());
  const videoElementsCacheRef = useRef(new Map()); // key -> HTMLVideoElement
  const durationTimerRef = useRef(null);
  const durationRef = useRef(0);
  const startTimeRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize hidden canvas
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    canvasRef.current = canvas;
  }, []);

  // Helper: Get or create HTMLVideoElement for a MediaStream
  const getVideoElement = useCallback((key, stream) => {
    if (!stream) return null;
    let video = videoElementsCacheRef.current.get(key);
    if (!video) {
      video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      videoElementsCacheRef.current.set(key, video);
    }
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
    return video;
  }, []);

  // Helper: Connect an audio track to the AudioContext destination
  const connectAudioTrack = useCallback((track) => {
    if (!track || !audioContextRef.current || !audioDestinationRef.current) return;
    if (connectedAudioTracksRef.current.has(track.id)) return;

    try {
      const stream = new MediaStream([track]);
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(audioDestinationRef.current);
      connectedAudioTracksRef.current.add(track.id);
    } catch (err) {
      console.warn("Failed to connect audio track to recording:", err);
    }
  }, []);

  // Continuously connect new audio tracks while recording
  useEffect(() => {
    if (!isRecording || !room || !audioContextRef.current) return;

    // Connect remote audio tracks
    room.remoteParticipants?.forEach((p) => {
      p.audioTrackPublications?.forEach((pub) => {
        if (pub.track?.mediaStreamTrack) {
          connectAudioTrack(pub.track.mediaStreamTrack);
        }
      });
    });

    // Connect local audio track if unmuted
    if (!isLocalMuted) {
      const localMicPub = localParticipant?.getTrackPublication("microphone");
      if (localMicPub?.track?.mediaStreamTrack) {
        connectAudioTrack(localMicPub.track.mediaStreamTrack);
      }
    }
  }, [isRecording, room, remoteStreams, isLocalMuted, localParticipant, connectAudioTrack]);

  // Main Canvas Compositor Loop
  const renderMeetingFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1280;
    const height = 720;

    // 1. Dark luxury background
    ctx.fillStyle = "#0B0C10";
    ctx.fillRect(0, 0, width, height);

    // 2. MeetX Header Watermark
    ctx.fillStyle = "#A855F7";
    ctx.beginPath();
    ctx.roundRect(32, 20, 8, 24, 4);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("MeetX", 48, 38);

    ctx.fillStyle = "#64748B";
    ctx.font = "14px Inter, sans-serif";
    ctx.fillText(`• ${roomId}`, 105, 38);

    // 3. REC status badge on canvas top-right
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(width - 130, 32, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#EF4444";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`REC ${formatDuration(durationRef.current)}`, width - 114, 37);

    // 4. Check for active screen share
    const screenShareStream = remoteStreams.find((s) => s.isScreenShare);

    if (screenShareStream) {
      // SCREEN SHARE LAYOUT:
      // Left 930px: Screen share video
      // Right 310px: Camera tiles column
      const screenVideo = getVideoElement(screenShareStream.id, screenShareStream.stream);
      if (screenVideo && screenVideo.readyState >= 2) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(32, 64, 910, 624, 20);
        ctx.fillStyle = "#161922";
        ctx.fill();
        ctx.clip();

        // Calculate aspect fit for screen share
        const vw = screenVideo.videoWidth || 1920;
        const vh = screenVideo.videoHeight || 1080;
        const scale = Math.min(910 / vw, 624 / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = 32 + (910 - dw) / 2;
        const dy = 64 + (624 - dh) / 2;

        ctx.drawImage(screenVideo, dx, dy, dw, dh);
        ctx.restore();
      }

      // Camera tiles column along right
      const allCameraUsers = [
        {
          id: "local",
          name: `${localName} (You)`,
          stream: localStream,
          isVideoOff: isLocalVideoOff,
          isMuted: isLocalMuted,
          isSpeaking: localParticipant?.isSpeaking,
        },
        ...remoteStreams
          .filter((s) => !s.isScreenShare)
          .map((s) => ({
            id: s.id,
            name: s.label,
            stream: s.stream,
            isVideoOff: !uiParticipants.find((p) => p.socketId === s.socketId)?.hasVideo,
            isMuted: uiParticipants.find((p) => p.socketId === s.socketId)?.isMuted,
            isSpeaking: uiParticipants.find((p) => p.socketId === s.socketId)?.isSpeaking,
          })),
      ].slice(0, 4); // Max 4 tiles on side

      const colX = 960;
      const colW = 288;
      const tileH = Math.min(150, (624 - (allCameraUsers.length - 1) * 12) / allCameraUsers.length);

      allCameraUsers.forEach((u, idx) => {
        const tileY = 64 + idx * (tileH + 12);
        drawParticipantTile(ctx, u, colX, tileY, colW, tileH);
      });
    } else {
      // GRID LAYOUT:
      // Gather all active participants (local + remotes)
      const participantsList = [
        {
          id: "local",
          name: `${localName} (You)`,
          stream: localStream,
          isVideoOff: isLocalVideoOff,
          isMuted: isLocalMuted,
          isSpeaking: localParticipant?.isSpeaking,
        },
        ...remoteStreams.map((s) => ({
          id: s.id,
          name: s.label,
          stream: s.stream,
          isVideoOff: !uiParticipants.find((p) => p.socketId === s.socketId)?.hasVideo,
          isMuted: uiParticipants.find((p) => p.socketId === s.socketId)?.isMuted,
          isSpeaking: uiParticipants.find((p) => p.socketId === s.socketId)?.isSpeaking,
        })),
      ];

      const count = participantsList.length;

      if (count === 1) {
        // 1 participant centered
        drawParticipantTile(ctx, participantsList[0], 200, 72, 880, 616);
      } else if (count === 2) {
        // 2 participants side-by-side
        drawParticipantTile(ctx, participantsList[0], 32, 140, 592, 440);
        drawParticipantTile(ctx, participantsList[1], 656, 140, 592, 440);
      } else if (count <= 4) {
        // 2x2 grid
        const w = 592;
        const h = 300;
        drawParticipantTile(ctx, participantsList[0], 32, 72, w, h);
        drawParticipantTile(ctx, participantsList[1], 656, 72, w, h);
        if (participantsList[2]) drawParticipantTile(ctx, participantsList[2], 32, 388, w, h);
        if (participantsList[3]) drawParticipantTile(ctx, participantsList[3], 656, 388, w, h);
      } else {
        // 3x2 grid
        const w = 394;
        const h = 300;
        participantsList.slice(0, 6).forEach((p, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          const x = 32 + col * (w + 16);
          const y = 72 + row * (h + 16);
          drawParticipantTile(ctx, p, x, y, w, h);
        });
      }
    }

    animFrameIdRef.current = requestAnimationFrame(renderMeetingFrame);
  }, [
    roomId,
    localName,
    localStream,
    isLocalVideoOff,
    isLocalMuted,
    localParticipant?.isSpeaking,
    remoteStreams,
    uiParticipants,
    getVideoElement,
  ]);

  // Helper to draw a single participant tile
  const drawParticipantTile = (ctx, user, x, y, w, h) => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 20);
    ctx.fillStyle = "#161922";
    ctx.fill();
    ctx.clip();

    const video = getVideoElement(user.id, user.stream);
    const hasActiveVideo = !user.isVideoOff && video && video.readyState >= 2;

    if (hasActiveVideo) {
      // Draw video using object-fit cover math
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const scale = Math.max(w / vw, h / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = x + (w - dw) / 2;
      const dy = y + (h - dh) / 2;
      ctx.drawImage(video, dx, dy, dw, dh);
    } else {
      // Draw stylish avatar circle with initial
      const initial = (user.name || "U").trim().charAt(0).toUpperCase();
      const radius = Math.min(36, h / 4);
      const cx = x + w / 2;
      const cy = y + h / 2 - 10;

      ctx.fillStyle = "#A855F7";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(radius * 0.9)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initial, cx, cy);

      ctx.fillStyle = "#E2E8F0";
      ctx.font = "600 14px Inter, sans-serif";
      ctx.fillText(user.name, cx, cy + radius + 24);
    }

    // Border: Emerald/purple glow if speaking, else subtle border
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 20);
    if (user.isSpeaking) {
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1.5;
    }
    ctx.stroke();

    // Name tag badge at bottom-left of tile
    const namePillW = Math.min(w - 24, 180);
    ctx.beginPath();
    ctx.roundRect(x + 12, y + h - 34, namePillW, 24, 8);
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fill();

    ctx.fillStyle = user.isMuted ? "#EF4444" : "#10B981";
    ctx.beginPath();
    ctx.arc(x + 24, y + h - 22, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F8FAFC";
    ctx.font = "500 11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(user.name, x + 34, y + h - 22);

    ctx.restore();
  };

  // Start Meeting Recording
  const startRecording = useCallback(async () => {
    if (!isHost) {
      toast.error("Only the meeting host can record the meeting.");
      return false;
    }

    if (isRecording) {
      toast.info("Meeting is already being recorded.");
      return false;
    }

    try {
      // 1. Backend validation & notification
      await api.post(`/meetings/${roomId}/recording/start`);

      // 2. Initialize AudioContext
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const destination = audioCtx.createMediaStreamDestination();
      audioDestinationRef.current = destination;
      connectedAudioTracksRef.current.clear();

      // Connect existing audio
      room?.remoteParticipants?.forEach((p) => {
        p.audioTrackPublications?.forEach((pub) => {
          if (pub.track?.mediaStreamTrack) {
            connectAudioTrack(pub.track.mediaStreamTrack);
          }
        });
      });

      if (!isLocalMuted) {
        const localMicPub = localParticipant?.getTrackPublication("microphone");
        if (localMicPub?.track?.mediaStreamTrack) {
          connectAudioTrack(localMicPub.track.mediaStreamTrack);
        }
      }

      // 3. Start Canvas capture at 30fps
      const canvas = canvasRef.current;
      const canvasStream = canvas.captureStream(30);

      // Combine canvas video + mixed audio tracks
      const composedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);

      // 4. Setup MediaRecorder
      const supportedMimes = [
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9,opus",
        "video/webm",
      ];
      const selectedMime = supportedMimes.find((m) => MediaRecorder.isTypeSupported(m)) || "";

      recordedChunksRef.current = [];
      const recorder = selectedMime
        ? new MediaRecorder(composedStream, { mimeType: selectedMime })
        : new MediaRecorder(composedStream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Upload to backend for FFmpeg MP4 conversion
        finalizeAndUploadRecording();
      };

      recorder.start(1000); // 1-second chunks
      setIsRecording(true);
      setRecordingDuration(0);
      durationRef.current = 0;
      startTimeRef.current = new Date();
      setProcessingStatus("recording");

      durationTimerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordingDuration(durationRef.current);
      }, 1000);

      // Start animation frame loop
      animFrameIdRef.current = requestAnimationFrame(renderMeetingFrame);

      toast.success("Meeting recording started (composed meeting video & audio).");
      return true;
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to start recording.");
      return false;
    }
  }, [
    isHost,
    isRecording,
    roomId,
    room,
    isLocalMuted,
    localParticipant,
    connectAudioTrack,
    renderMeetingFrame,
  ]);

  // Stop Recording
  const stopRecording = useCallback(async () => {
    if (!isHost) {
      toast.error("Only the host can stop meeting recording.");
      return;
    }

    try {
      await api.post(`/meetings/${roomId}/recording/stop`);
    } catch (e) {
      console.warn("Backend stop recording notify:", e);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, [isHost, roomId]);

  // Upload WebM to backend & let FFmpeg convert to MP4
  const finalizeAndUploadRecording = async () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsRecording(false);

    if (recordedChunksRef.current.length === 0) {
      toast.error("No recording data captured.");
      return;
    }

    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    const finalDuration = durationRef.current;

    setIsUploading(true);
    setProcessingStatus("processing");
    toast.info("Uploading recording to server for high-definition MP4 encoding...");

    try {
      const formData = new FormData();
      formData.append("recording", blob, `meeting-${roomId}-${Date.now()}.webm`);
      formData.append("duration", finalDuration);
      if (startTimeRef.current) {
        formData.append("startTime", startTimeRef.current.toISOString());
      }
      formData.append("endTime", new Date().toISOString());

      const res = await api.post(`/meetings/${roomId}/recordings`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Recording uploaded! Server is encoding into MP4.");
      if (res.data?.recording) {
        setReadyRecording(res.data.recording);
      }
    } catch (uploadErr) {
      console.error("Failed to upload recording:", uploadErr);
      setProcessingStatus("failed");
      toast.error(
        uploadErr.response?.data?.message || "Failed to upload recording to server."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Download MP4 Recording
  const downloadMp4 = useCallback(
    (recordingId) => {
      const targetId = recordingId || readyRecording?._id;
      if (!targetId) {
        toast.error("No recording available to download.");
        return;
      }
      const token = localStorage.getItem("token") || "";
      const baseApi = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const downloadUrl = `${baseApi}/meetings/${roomId}/recordings/${targetId}/download?token=${token}`;

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.target = "_blank";
      a.download = `MeetX-Meeting-${roomId}.mp4`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 200);
      toast.success("MP4 download started!");
    },
    [roomId, readyRecording]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isRecording,
    recordingDuration,
    formattedDuration: formatDuration(recordingDuration),
    isUploading,
    processingStatus,
    setProcessingStatus,
    readyRecording,
    setReadyRecording,
    startRecording,
    stopRecording,
    downloadMp4,
  };
}

