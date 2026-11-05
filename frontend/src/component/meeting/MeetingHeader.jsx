import React from 'react';
import { Lock, Copy, Square, Play, Download, Loader2, Radio } from 'lucide-react';
import Button from '../ui/Button';
import cn from '../../lib/cn';

export function MeetingHeader({
  id,
  isHost = false,
  meetingStatus = 'live', // 'scheduled' | 'waiting' | 'live' | 'ended'
  onStartMeeting,
  isStartingMeeting = false,
  onLeave,
  isRecording = false,
  formattedDuration = "00:00",
  onStopRecording,
  remoteRecordingBy = null,
  recordingProcessingStatus = null,
  onOpenRecordingModal,
}) {
  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
  };

  const isLive = meetingStatus === 'live';

  return (
    <header className="relative shrink-0 w-full flex items-center justify-between px-4 md:px-6 py-3.5 bg-card/70 backdrop-blur-md z-40 border-b border-white/5 shadow-lg">
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 mr-3">
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10 backdrop-blur-md min-w-0">
          <Lock className="text-primary w-3.5 h-3.5 shrink-0" />
          <span className="text-xs md:text-sm font-semibold truncate tracking-wide">Meeting: {id}</span>
          <Button size="icon" variant="none" onClick={handleCopy} className="ml-0.5 shrink-0 bg-transparent hover:bg-white/10" title="Copy Meeting Link">
            <Copy className="w-3.5 h-3.5 text-white/60 hover:text-white" />
          </Button>
        </div>

        {/* Meeting Status Badge */}
        {isLive ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold shrink-0">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{isHost ? "WAITING (HOST)" : "WAITING FOR HOST"}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Host "Start Meeting" button if not yet live */}
        {isHost && !isLive && onStartMeeting && (
          <Button
            onClick={onStartMeeting}
            disabled={isStartingMeeting}
            variant="default"
            size="sm"
            className="font-bold shadow-md shadow-primary/20 shrink-0"
          >
            {isStartingMeeting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Start Meeting</span>
          </Button>
        )}

        {/* Local Recording Badge */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-semibold shrink-0 shadow-lg shadow-red-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="font-mono">REC {formattedDuration}</span>
            {isHost && onStopRecording && (
              <button
                onClick={onStopRecording}
                className="ml-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition flex items-center gap-1 cursor-pointer"
                title="Stop recording"
              >
                <Square className="w-2 h-2 fill-current" /> Stop
              </button>
            )}
          </div>
        )}

        {/* Remote Recording Badge */}
        {remoteRecordingBy && !isRecording && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Rec by {remoteRecordingBy}</span>
          </div>
        )}

        {/* Recording Processing Badge */}
        {recordingProcessingStatus === "processing" && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary text-xs font-medium shrink-0 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="hidden sm:inline">Processing MP4...</span>
          </div>
        )}

        {/* Recording Ready / Download MP4 Button */}
        {recordingProcessingStatus === "ready" && onOpenRecordingModal && (
          <Button
            onClick={onOpenRecordingModal}
            size="sm"
            variant="default"
            className="!bg-emerald-600 hover:!bg-emerald-500 text-white font-semibold shrink-0 shadow-md shadow-emerald-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download MP4</span>
          </Button>
        )}

        <Button 
          onClick={onLeave}
          variant="outline-danger"
          size="none"
          className="shrink-0 px-3.5 md:px-5 py-2 rounded-2xl text-xs md:text-sm font-semibold"
        >
          {isHost ? "End / Leave" : "Leave"}
        </Button>
      </div>
    </header>
  );
}
