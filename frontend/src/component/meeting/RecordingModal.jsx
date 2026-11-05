import React from "react";
import { Download, Video, Clock, HardDrive, CheckCircle2 } from "lucide-react";
import Button from "../ui/Button";
import ModalWrapper from "../ui/ModalWrapper";

export function RecordingModal({
  open,
  onClose,
  recordedData,
  onDownload,
}) {
  if (!open || !recordedData) return null;

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      className="max-w-2xl w-full p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl"
    >
      <div className="p-6 md:p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Meeting Recording Ready
            </h2>
            <p className="text-sm text-muted-foreground">
              Your meeting video was recorded and downloaded automatically.
            </p>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/80 border border-white/10 shadow-inner flex items-center justify-center">
          <video
            src={recordedData.url}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Metadata info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">Duration</span>
              <span className="text-sm font-semibold truncate block">
                {recordedData.formattedDuration || "00:00"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">File Size</span>
              <span className="text-sm font-semibold truncate block">
                {recordedData.size || "0 MB"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <Video className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">Format</span>
              <span className="text-sm font-semibold truncate block">
                {recordedData.fileName?.endsWith(".mp4") ? "MP4 (H.264)" : "WebM (VP9/VP8)"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            onClick={onDownload}
            className="w-full sm:flex-1"
            size="lg"
            variant="default"
          >
            <Download className="w-4 h-4" /> Download Again
          </Button>
          <Button
            onClick={onClose}
            className="w-full sm:w-auto"
            size="lg"
            variant="outline"
          >
            Done
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

