import React from "react";
import { Loader2 } from "lucide-react";
import Button from "../ui/Button";
import { VideoTile } from "./VideoTile";

export function LobbyUI({ localStream, handleLeaveClick }) {
  return (
    <main className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        {localStream && (
          <div className="w-full h-full opacity-30">
            <VideoTile isMain={true} isLocal={true} stream={localStream} label="" isMuted={true} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-card/50 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-md text-center max-w-md mx-4">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-pulse ring-4 ring-primary/30">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Waiting in Lobby</h2>
        <p className="text-gray-400 mb-6">
          Please wait, the meeting host will let you in soon.
        </p>
        <Button variant="none" className="bg-white/5 hover:bg-white/10 w-full" onClick={handleLeaveClick}>
          Leave Meeting
        </Button>
      </div>
    </main>
  );
}
