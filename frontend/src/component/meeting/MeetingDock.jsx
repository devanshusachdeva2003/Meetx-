import React from 'react';
import { Mic, MicOff, Camera, CameraOff, Users, MessageSquare, MoreVertical } from 'lucide-react';
import Button from '../ui/Button';

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
        <Button 
          onClick={onToggleMute}
          size="icon-lg"
          variant={isMuted ? 'danger' : 'glass'}
          className="group"
        >
          {isMuted ? <MicOff className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />}
        </Button>

        <Button 
          onClick={onToggleVideo}
          size="icon-lg"
          variant={isVideoOff ? 'danger' : 'glass'}
          className="group"
        >
          {isVideoOff ? <CameraOff className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />}
        </Button>
      </div>

      <div className="w-px h-8 bg-white/10 mx-2" />

      <div className="flex items-center gap-2">
        <Button 
          onClick={onToggleParticipants}
          size="icon-lg"
          variant={showParticipants ? 'soft' : 'glass'}
          className="group"
        >
          <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Button>

        <Button 
          onClick={onToggleChat}
          size="icon-lg"
          variant={showChat ? 'soft' : 'glass'}
          className="group relative"
        >
          <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-card" />
        </Button>
      </div>

      <div className="w-px h-8 bg-white/10 mx-2" />

      <Button size="icon-lg" variant="glass" className="group">
        <MoreVertical className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </Button>
    </nav>
  );
}
