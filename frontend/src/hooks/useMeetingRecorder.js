import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

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

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function useMeetingRecorder(meetingId = "room") {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedData, setRecordedData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);
  const displayStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const durationRef = useRef(0);
  const meetingIdRef = useRef(meetingId);

  useEffect(() => {
    meetingIdRef.current = meetingId;
  }, [meetingId]);

  const finalizeRecording = useCallback((finalMimeType) => {
    // Stop all audio & display tracks
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);

    if (recordedChunksRef.current.length === 0) {
      toast.error("No recording data was captured.");
      return;
    }

    const blob = new Blob(recordedChunksRef.current, { type: finalMimeType });
    const url = URL.createObjectURL(blob);
    const isMp4 = finalMimeType.includes("mp4");
    const ext = isMp4 ? "mp4" : "webm";
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");
    const fileName = `MeetX-${meetingIdRef.current || "Recording"}-${timestamp}.${ext}`;
    const sizeStr = formatFileSize(blob.size);
    const duration = durationRef.current;

    const dataObj = {
      url,
      blob,
      fileName,
      size: sizeStr,
      duration,
      formattedDuration: formatDuration(duration),
    };

    setRecordedData(dataObj);
    setShowPreviewModal(true);

    // Auto-download file
    try {
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 200);
      toast.success(`Meeting recording saved (${sizeStr})! Download started.`);
    } catch (err) {
      console.error("Auto download failed:", err);
      toast.success("Meeting recording saved! You can download it from the preview.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
      toast.error(
        "Screen recording is not supported in this browser. Please use Chrome, Edge, Firefox, or Safari on desktop."
      );
      return false;
    }

    try {
      toast.info(
        "Select the MeetX tab or window to record. Check 'Share tab audio' to capture meeting voices.",
        { duration: 5000 }
      );

      // 1. Capture screen/tab
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
        },
        audio: true,
      });

      displayStreamRef.current = displayStream;

      // 2. Capture local mic to mix with tab audio
      let micStream = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStreamRef.current = micStream;
      } catch (micErr) {
        console.warn("Could not capture local microphone:", micErr);
      }

      // 3. Audio mixing via AudioContext
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      let finalAudioTracks = [];

      if (AudioCtx) {
        try {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          if (audioCtx.state === "suspended") {
            await audioCtx.resume();
          }

          const destination = audioCtx.createMediaStreamDestination();
          let hasAudioSources = false;

          const displayAudioTracks = displayStream.getAudioTracks();
          if (displayAudioTracks.length > 0) {
            const displayAudioSource = audioCtx.createMediaStreamSource(
              new MediaStream(displayAudioTracks)
            );
            displayAudioSource.connect(destination);
            hasAudioSources = true;
          }

          if (micStream && micStream.getAudioTracks().length > 0) {
            const micAudioSource = audioCtx.createMediaStreamSource(micStream);
            micAudioSource.connect(destination);
            hasAudioSources = true;
          }

          if (hasAudioSources) {
            finalAudioTracks = destination.stream.getAudioTracks();
          }
        } catch (ctxErr) {
          console.warn("AudioContext mixing failed, using raw tracks:", ctxErr);
        }
      }

      // Fallback audio tracks if mixing did not produce tracks
      if (finalAudioTracks.length === 0) {
        if (displayStream.getAudioTracks().length > 0) {
          finalAudioTracks = displayStream.getAudioTracks();
        } else if (micStream && micStream.getAudioTracks().length > 0) {
          finalAudioTracks = micStream.getAudioTracks();
        }
      }

      // 4. Combine into final stream
      const combinedTracks = [
        ...displayStream.getVideoTracks(),
        ...finalAudioTracks,
      ];
      const combinedStream = new MediaStream(combinedTracks);

      // Handle user stopping screen share from native browser banner
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopRecording();
        };
      }

      // 5. Select best supported codec
      const supportedTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=h264,opus",
        "video/webm",
        "video/mp4;codecs=avc1,mp4a.40.2",
        "video/mp4",
      ];
      const selectedMimeType =
        supportedTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

      recordedChunksRef.current = [];
      const recorder = selectedMimeType
        ? new MediaRecorder(combinedStream, { mimeType: selectedMimeType })
        : new MediaRecorder(combinedStream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        finalizeRecording(recorder.mimeType || selectedMimeType || "video/webm");
      };

      // Start recording with 1-second timeslices
      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      durationRef.current = 0;

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordingDuration(durationRef.current);
      }, 1000);

      toast.success("Meeting recording started");
      return true;
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "AbortError") {
        toast.info("Recording cancelled.");
      } else {
        console.error("Failed to start recording:", err);
        toast.error(`Could not start recording: ${err.message || "Unknown error"}`);
      }
      return false;
    }
  }, [finalizeRecording, stopRecording]);

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPaused(true);
      toast.info("Recording paused");
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordingDuration(durationRef.current);
      }, 1000);
      setIsPaused(false);
      toast.info("Recording resumed");
    }
  }, []);

  const downloadRecording = useCallback(() => {
    if (!recordedData?.url || !recordedData?.fileName) return;
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = recordedData.url;
    a.download = recordedData.fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 200);
    toast.success("Download started!");
  }, [recordedData]);

  // Clean up on unmount: stop recording safely if user navigates away
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    formattedDuration: formatDuration(recordingDuration),
    recordedData,
    showPreviewModal,
    setShowPreviewModal,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
  };
}

