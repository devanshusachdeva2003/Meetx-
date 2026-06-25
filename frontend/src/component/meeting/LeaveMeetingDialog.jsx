import React from "react";
import { LogOut } from "lucide-react";
import Button from "../ui/Button";
import ModalWrapper from "../ui/ModalWrapper";

export function LeaveMeetingDialog({ showLeaveDialog, isHost, setShowLeaveDialog, confirmLeave, confirmEndMeeting }) {
  if (!showLeaveDialog) return null;

  return (
    <ModalWrapper open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)}>
      <div className="p-6 md:p-8 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
          <LogOut className="w-7 h-7 text-red-500" />
        </div>

        <h2 className="text-xl font-bold mb-2 text-foreground">Leave Meeting?</h2>
        <p className="text-muted-foreground mb-7 text-sm leading-relaxed max-w-[260px]">
          Are you sure you want to leave? {isHost ? "You can also end the meeting for everyone." : ""}
        </p>

        <div className="flex flex-col gap-3 w-full">
          {isHost && (
            <Button variant="danger" size="lg" className="w-full !text-white" onClick={confirmEndMeeting}>
              End Meeting for All
            </Button>
          )}
          <Button size="lg" variant="outline" className="w-full" onClick={confirmLeave}>
            Just Leave
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowLeaveDialog(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
