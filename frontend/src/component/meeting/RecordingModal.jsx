import React from "react";
import { Download, Video, Clock, HardDrive, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Button from "../ui/Button";
import ModalWrapper from "../ui/ModalWrapper";

export function RecordingModal({
  open,
  onClose,
  status = "ready", // 'recording' | 'processing' | 'ready' | 'failed'
  recording,
  onDownload,
}) {
  if (!open) return null;

  const isProcessing = status === "processing" || status === "recording";
  const isFailed = status === "failed";
  const isReady = status === "ready";

  const durationStr = recording?.duration
    ? `${Math.floor(recording.duration / 60)}m ${recording.duration % 60}s`
    : recording?.formattedDuration || "A few moments";

  const sizeStr = recording?.size
    ? `${(recording.size / (1024 * 1024)).toFixed(1)} MB`
    : "Processing";

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      className="max-w-xl w-full p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl"
    >
      <div className="p-6 md:p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isReady
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : isProcessing
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {isReady ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isReady
                ? "Meeting Recording Ready"
                : isProcessing
                ? "Processing MP4 Recording"
                : "Recording Processing Failed"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isReady
                ? "The meeting recording has been transcoded into MP4 format."
                : isProcessing
                ? "FFmpeg is currently transcoding the meeting video into high-definition MP4."
                : "An error occurred while transcoding the meeting recording."}
            </p>
          </div>
        </div>

        {/* Video Player Preview (if ready and URL available) */}
        {isReady && recording?.fileUrl && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/80 border border-white/10 shadow-inner flex items-center justify-center">
            <video
              src={recording.fileUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Processing State Animation */}
        {isProcessing && (
          <div className="py-8 px-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-sm font-semibold text-foreground">
              Transcoding to MP4 with FFmpeg...
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Capturing all participant camera streams, active screen shares, and audio tracks synchronized into standard H.264 / AAC MP4.
            </p>
          </div>
        )}

        {/* Metadata info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">Duration</span>
              <span className="text-sm font-semibold truncate block">
                {durationStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">File Size</span>
              <span className="text-sm font-semibold truncate block">
                {sizeStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <Video className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">Format</span>
              <span className="text-sm font-semibold truncate block">
                MP4 (H.264 / AAC)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {isReady && (
            <Button
              onClick={onDownload}
              className="w-full sm:flex-1 !bg-emerald-600 hover:!bg-emerald-500 text-white font-bold"
              size="lg"
            >
              <Download className="w-4 h-4" /> Download MP4 Recording
            </Button>
          )}
          <Button
            onClick={onClose}
            className={`w-full ${isReady ? "sm:w-auto" : "sm:flex-1"}`}
            size="lg"
            variant="outline"
          >
            {isReady ? "Close" : "Dismiss"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
