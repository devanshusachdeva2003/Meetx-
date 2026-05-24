import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Users, Mic, MicOff, Camera, CameraOff, Monitor, MessageCircle, MoreVertical, PhoneOff, Star, Send, X, Copy } from 'lucide-react';
import { useLocalStream } from "../hooks/useLocalStream";
import { useSocket } from "../hooks/useSocket";
import { usePeerConnections } from "../hooks/usePeerConnections";

/**
 * Obsidian Flux Video Conferencing - Integrated Version
 *
 * Merges high-fidelity UI with user-provided Socket.io/WebRTC logic.
 */

function randomName() {
  return `Guest-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Meeting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  
  // State for UI toggles
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // User logic hooks
  const { streamRef: localStreamRef, active } = useLocalStream({ video: true, audio: true });
  const [name] = useState(randomName());
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const socketUrl = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:4000';

  const { socketRef, connected, join, sendSignal, sendChat, leave } = useSocket({ 
    url: socketUrl, 
    token: null, 
    roomId: id, 
    onSignal: null, 
    onParticipants: null, 
    onChat: null 
  });

  const { remoteStreams, handleExistingParticipants, handleNewParticipant, removeParticipant } = usePeerConnections({ 
    socketRef, 
    localStreamRef, 
    roomId: id, 
    localUser: { name } 
  });

  // Wiring local stream to video element
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [localStreamRef.current]);

  // Socket event wiring
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    function onParticipants(list) {
      setParticipants(list.map((p) => p.user || p));
      handleExistingParticipants(list);
    }

    function onUserJoined(p) {
      setParticipants((prev) => [...prev, p.user]);
      handleNewParticipant(p);
    }

    function onUserLeft(p) {
      setParticipants((prev) => prev.filter((x) => x.socketId !== p.socketId));
      removeParticipant(p.socketId);
    }

    function onChat(m) {
      setChatMessages((prev) => [...prev, m]);
    }

    socket.on('participants', onParticipants);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('chat', onChat);

    if (connected && localStreamRef.current) {
      const me = { name };
      join(id, me);
    }

    return () => {
      socket.off('participants', onParticipants);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('chat', onChat);
    };
  }, [socketRef.current, connected, localStreamRef.current, id, name, join, handleExistingParticipants, handleNewParticipant, removeParticipant]);

  function handleCopy() {
    navigator.clipboard?.writeText(window.location.href);
  }

  function doLeave() {
    leave(id);
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    navigate('/');
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#11131c] text-white font-manrope overflow-hidden">
      {/* Top App Bar */}
      <header className="flex items-center justify-between px-4 py-4 bg-[#11131c] z-10 border-b border-white/5">
        <div className="flex items-center gap-2 overflow-hidden">
          <Lock className="text-[#7c5dff]" />
          <h1 className="text-sm font-semibold truncate">Meeting: {id}</h1>
          <button onClick={handleCopy} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <Copy className="text-white/60" />
          </button>
        </div>
        <button 
          onClick={doLeave}
          className="bg-[#cc2b2b] hover:bg-[#a32222] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-red-900/20"
        >
          Leave meeting
        </button>
      </header>

      {/* Video Grid */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Local Video Feed */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#191b24] ring-2 ring-transparent">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover" 
          />
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-[10px] flex items-center gap-2">
            {name} (You)
            {isMuted ? <MicOff className="text-red-500" /> : <Mic className="text-green-400" />}
          </div>
        </div>

        {/* Remote Video Feeds */}
        {remoteStreams.map((r) => (
          <div key={r.socketId} className="relative aspect-video rounded-2xl overflow-hidden bg-[#191b24]">
            <video 
              autoPlay 
              playsInline 
              ref={(el) => { if (el) el.srcObject = r.stream; }} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-[10px]">
              {participants.find(p => p.socketId === r.socketId)?.name || 'Guest'}
            </div>
          </div>
        ))}
      </main>

      {/* Bottom Controls */}
      <nav className="bg-[#191b24] p-4 flex justify-between items-center border-t border-white/5 pb-8">
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={toggleMute}
            className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </button>
          <span className="text-[10px] text-white/60">Mute</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={toggleVideo}
            className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
          >
            {isVideoOff ? <CameraOff /> : <Camera />}
          </button>
          <span className="text-[10px] text-white/60">Video</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => { setShowParticipants(true); setShowChat(false); }}
            className={`p-3 rounded-xl transition-all ${showParticipants ? 'bg-[#7c5dff]/20 text-[#7c5dff]' : 'bg-white/5 text-white'}`}
          >
            <Users />
          </button>
          <span className="text-[10px] text-white/60">Participants</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => { setShowChat(true); setShowParticipants(false); }}
            className={`p-3 rounded-xl transition-all relative ${showChat ? 'bg-[#7c5dff]/20 text-[#7c5dff]' : 'bg-white/5 text-white'}`}
          >
            <MessageCircle />
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#7c5dff] rounded-full border-2 border-[#191b24]" />
          </button>
          <span className="text-[10px] text-white/60">Chat</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="p-3 bg-white/5 text-white rounded-xl">
            <MoreVertical />
          </button>
          <span className="text-[10px] text-white/60">More</span>
        </div>
      </nav>

      {/* Side Overlays (Chat/Participants) */}
      {(showChat || showParticipants) && (
        <div className="absolute inset-0 z-50 bg-[#11131c] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center justify-between border-b border-white/5">
            <h2 className="text-lg font-bold">{showChat ? 'Chat' : 'Participants'}</h2>
            <button onClick={() => { setShowChat(false); setShowParticipants(false); }} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X />
            </button>
          </header>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {showParticipants ? (
              <ul className="space-y-3">
                <li className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7c5dff] flex items-center justify-center font-bold text-xs">
                      {name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{name} (You)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#7c5dff] bg-[#7c5dff]/10 px-2 py-0.5 rounded-full font-bold">Host</span>
                    {isMuted ? <MicOff className="text-red-500" /> : <Mic className="text-green-400" />}
                  </div>
                </li>
                {participants.map((p, i) => (
                  <li key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs uppercase">
                        {(p.name || p).charAt(0)}
                      </div>
                      <span className="text-sm truncate max-w-[150px]">{p.name || p}</span>
                    </div>
                    <Mic className="text-white/40" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-10 text-white/40 italic text-sm">
                  No messages yet. Start the conversation!
                </div>
              </div>
            )}
          </div>

          {showChat && (
            <div className="p-4 border-t border-white/5 pb-10 bg-[#191b24]">
              <div className="flex gap-2 items-center bg-white/5 rounded-xl p-2 px-4 border border-white/10">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="bg-transparent flex-1 text-sm outline-none py-2"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <button 
                  onClick={() => {
                    if (chatMessage.trim()) {
                      // sendChat signature: (roomId, message, user)
                      sendChat(id, chatMessage, { name });
                      setChatMessage('');
                    }
                  }}
                  className="text-[#7c5dff] p-2 hover:bg-[#7c5dff]/10 rounded-lg transition-all"
                >
                  <Send />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
