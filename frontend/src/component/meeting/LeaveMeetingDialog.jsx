import React from "react";
import Button from "../ui/Button";
import ModalWrapper from "../ui/ModalWrapper";

export function LeaveMeetingDialog({ showLeaveDialog, isHost, setShowLeaveDialog, confirmLeave, confirmEndMeeting }) {
  if (!showLeaveDialog) return null;

  return (
    <ModalWrapper open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)}>
      <div className="w-full max-w-sm">
        <h2 className="text-xl font-bold text-white mb-2 text-center">Leave Meeting?</h2>
        <p className="text-gray-400 mb-6 text-sm text-center">Are you sure you want to leave this meeting?</p>
        
        <div className="flex flex-col gap-3">
          {isHost && (
            <Button variant="danger" className="w-full text-white" onClick={confirmEndMeeting}>
              End Meeting for All
            </Button>
          )}
          <Button variant="none" className="w-full bg-white/10 hover:bg-white/20" onClick={confirmLeave}>
            Just Leave Meeting
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setShowLeaveDialog(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
