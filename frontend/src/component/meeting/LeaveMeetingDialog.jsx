import React from "react";
import Button from "../ui/Button";

export function LeaveMeetingDialog({ showLeaveDialog, isHost, setShowLeaveDialog, confirmLeave, confirmEndMeeting }) {
  if (!showLeaveDialog) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Leave Meeting?</h2>
        <p className="text-gray-400 mb-6 text-sm">Are you sure you want to leave this meeting?</p>
        
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
    </div>
  );
}
