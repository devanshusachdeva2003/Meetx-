import React, { useState } from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import Button from "../ui/Button";
import ModalWrapper from "../ui/ModalWrapper";

export function LeaveMeetingDialog({
  showLeaveDialog,
  isHost,
  setShowLeaveDialog,
  confirmLeave,
  confirmEndMeeting,
  isEnding = false,
}) {
  const [confirmEndStep, setConfirmEndStep] = useState(false);

  if (!showLeaveDialog) return null;

  const handleClose = () => {
    setConfirmEndStep(false);
    setShowLeaveDialog(false);
  };

  return (
    <ModalWrapper open={showLeaveDialog} onClose={handleClose}>
      <div className="p-6 md:p-8 flex flex-col items-center text-center">
        {confirmEndStep ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-5 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">
              End Meeting for Everyone?
            </h2>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed max-w-xs">
              This will disconnect all participants, close the meeting room permanently, and finalize any active recording.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="danger"
                size="lg"
                className="w-full !text-white font-bold"
                onClick={confirmEndMeeting}
                disabled={isEnding}
              >
                {isEnding ? "Ending Meeting..." : "Yes, End Meeting for All"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setConfirmEndStep(false)}
              >
                Back
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
              <LogOut className="w-7 h-7 text-red-500" />
            </div>

            <h2 className="text-xl font-bold mb-2 text-foreground">
              Leave Meeting?
            </h2>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed max-w-xs">
              {isHost
                ? "You are the meeting host. You can leave the meeting or end it for everyone."
                : "Are you sure you want to leave this meeting?"}
            </p>

            <div className="flex flex-col gap-3 w-full">
              {isHost && (
                <Button
                  variant="danger"
                  size="lg"
                  className="w-full !text-white font-bold"
                  onClick={() => setConfirmEndStep(true)}
                >
                  End Meeting for Everyone
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={confirmLeave}
              >
                Just Leave
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </ModalWrapper>
  );
}
