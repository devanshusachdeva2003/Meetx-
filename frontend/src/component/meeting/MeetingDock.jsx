import React from 'react';
import { Mic, MicOff, Camera, CameraOff, Users, MessageSquare, MoreVertical } from 'lucide-react';

export function MeetingDock({
  isMuted,
  isVideoOff,
  showParticipants,
  showChat,
  onToggleMute,
  onToggleVideo,
  onToggleParticipants,
  onToggleChat
}) {
  return (
    <nav className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-card/70 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] flex items-center gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleMute}
          className={`p-4 rounded-full transition-all group ${isMuted ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          {isMuted ? <MicOff className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />}
        </button>

        <button 
          onClick={onToggleVideo}
          className={`p-4 rounded-full transition-all group ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          {isVideoOff ? <CameraOff className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />}
        </button>
      </div>

      <div className="w-px h-8 bg-white/10 mx-2" />

      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleParticipants}
          className={`p-4 rounded-full transition-all group ${showParticipants ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        <button 
          onClick={onToggleChat}
          className={`p-4 rounded-full transition-all group relative ${showChat ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-card" />
        </button>
      </div>

      <div className="w-px h-8 bg-white/10 mx-2" />

      <button className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all group">
        <MoreVertical className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </nav>
  );
}
