import React from "react";
import { Loader2, Play, ShieldAlert, Users } from "lucide-react";
import Button from "../ui/Button";
import { VideoTile } from "./VideoTile";

export function LobbyUI({
  localStream,
  handleLeaveClick,
  isHost = false,
  onStartMeeting,
  isStarting = false,
  meetingStatus = "waiting",
}) {
  return (
    <main className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        {localStream && (
          <div className="w-full h-full opacity-30">
            <VideoTile
              isMain={true}
              isLocal={true}
              stream={localStream}
              label=""
              isMuted={true}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-card border border-border rounded-3xl shadow-2xl backdrop-blur-md text-center max-w-md mx-4">
        {isHost ? (
          <>
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-primary/30">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Ready to Start?
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              You are the host. Participants are waiting in the lobby. Click Start Meeting to go live and begin the session.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="default"
                size="lg"
                className="w-full font-bold shadow-lg shadow-primary/30"
                onClick={onStartMeeting}
                disabled={isStarting}
              >
                {isStarting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                {isStarting ? "Starting Meeting..." : "Start Meeting Now"}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleLeaveClick}>
                Leave
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-pulse ring-4 ring-primary/30">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Waiting for Host
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              {meetingStatus === "scheduled"
                ? "This meeting is scheduled. Please wait for the host to start it."
                : "The host has not started this meeting yet. You will automatically join once the host goes live."}
            </p>
            <Button variant="outline" className="w-full" onClick={handleLeaveClick}>
              Leave Meeting
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
