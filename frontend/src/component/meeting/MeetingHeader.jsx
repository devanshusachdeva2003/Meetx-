import React from 'react';
import { Lock, Copy, Square } from 'lucide-react';
import Button from '../ui/Button';
import cn from '../../lib/cn';

export function MeetingHeader({
  id,
  onLeave,
  isRecording = false,
  isPaused = false,
  formattedDuration = "00:00",
  onStopRecording,
  remoteRecordingBy = null,
}) {
  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <header className="relative shrink-0 w-full flex items-center justify-between px-4 md:px-6 py-4 bg-card/60 backdrop-blur-md z-40 border-b border-white/5 shadow-lg">
      <div className="flex items-center gap-2 md:gap-4 bg-white/5 px-3 md:px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md flex-1 min-w-0 mr-4">
        <Lock className="text-primary w-4 h-4 shrink-0" />
        <h1 className="text-sm font-semibold truncate tracking-wide min-w-0">Meeting: {id}</h1>
        <Button size="icon" variant="none" onClick={handleCopy} className="ml-1 shrink-0 bg-transparent hover:bg-white/10">
          <Copy className="w-4 h-4 text-white/60 hover:text-white" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {/* Local Recording Badge */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-400 text-xs font-semibold shrink-0 shadow-lg shadow-red-500/10">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75",
                  isPaused && "hidden"
                )}
              ></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="font-mono">{isPaused ? "PAUSED" : "REC"} {formattedDuration}</span>
            {onStopRecording && (
              <button
                onClick={onStopRecording}
                className="ml-1 px-2 py-0.5 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition shadow flex items-center gap-1 cursor-pointer"
                title="Stop recording"
              >
                <Square className="w-2.5 h-2.5 fill-current" /> Stop
              </button>
            )}
          </div>
        )}

        {/* Remote Recording Badge */}
        {remoteRecordingBy && !isRecording && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Recording by {remoteRecordingBy}</span>
          </div>
        )}

        <Button 
          onClick={onLeave}
          variant="outline-danger"
          size="none"
          className="shrink-0 px-4 md:px-6 py-2.5 rounded-2xl"
        >
          Leave
        </Button>
      </div>
    </header>
  );
}
