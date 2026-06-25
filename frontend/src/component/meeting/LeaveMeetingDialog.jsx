import React from "react";
import Button from "../ui/Button";
import ModalWrapper from "../ui/ModalWrapper";

export function LeaveMeetingDialog({ showLeaveDialog, isHost, setShowLeaveDialog, confirmLeave, confirmEndMeeting }) {
  if (!showLeaveDialog) return null;

  return (
    <ModalWrapper open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)}>
      <div className="w-full max-w-sm">
        <h2 className="text-xl font-bold mb-2 text-center text-foreground">Leave Meeting?</h2>
        <p className="text-muted-foreground mb-6 text-sm text-center">Are you sure you want to leave this meeting?</p>
        
        <div className="flex flex-col gap-3">
          {isHost && (
            <Button variant="danger" className="w-full !text-white" onClick={confirmEndMeeting}>
              End Meeting for All
            </Button>
          )}
          <Button variant="none" className="w-full bg-foreground/10 hover:bg-foreground/20 text-foreground" onClick={confirmLeave}>
            Just Leave Meeting
          </Button>
          <Button variant="outline" className="w-full text-foreground border-border" onClick={() => setShowLeaveDialog(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
