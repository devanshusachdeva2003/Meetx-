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
  const joinedRef = useRef(false);
  const initialPeersCreatedRef = useRef(false);
  const gotInitialParticipantsRef = useRef(false);
  
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
      // keep full participant objects { socketId, user } so we can map streams to ids
      setParticipants(list);
      gotInitialParticipantsRef.current = true;
      initialPeersCreatedRef.current = !list || list.length === 0;
      // defer peer creation until local stream is ready (handled by effect below)
    }

    function onUserJoined(p) {
      setParticipants((prev) => {
        if (prev.some(x => x.socketId === p.socketId)) return prev;
        return [...prev, p];
      });
      // if local stream is ready, create peer to handle this new participant
      if (localStreamRef.current) {
        // small delay to avoid simultaneous offer/answer races causing renegotiation
        setTimeout(() => {
          if (localStreamRef.current) handleNewParticipant(p);
        }, 200);
      }
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

    if (!connected) {
      joinedRef.current = false;
      gotInitialParticipantsRef.current = false;
      initialPeersCreatedRef.current = false;
    }

    if (connected && localStreamRef.current && !joinedRef.current) {
      const me = { name };
      join(id, me);
      joinedRef.current = true;
    }

    return () => {
      socket.off('participants', onParticipants);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('chat', onChat);
    };
  }, [socketRef.current, connected, localStreamRef.current, id, name, join, handleExistingParticipants, handleNewParticipant, removeParticipant]);

  // When local stream becomes available (or participants change), ensure we create peers
  useEffect(() => {
    if (!localStreamRef.current) return;
    if (!participants || participants.length === 0) return;
    if (!gotInitialParticipantsRef.current) return;
    if (initialPeersCreatedRef.current) return;

    // when we get the initial participants list and local media is ready,
    // create offerer peers to each existing participant.
    (async () => {
      try {
        await handleExistingParticipants(participants);
        initialPeersCreatedRef.current = true;
      } catch (err) {
        console.error('Error creating peers:', err);
      }
    })();
  }, [localStreamRef.current, participants]);

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
    <div className="flex flex-col h-screen bg-background text-white font-manrope overflow-hidden">
      <header className="flex items-center justify-between px-4 py-4 bg-background z-10 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Lock className="text-primary" />
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
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: (() => {
                const count = (remoteStreams?.length || 0) + (localStreamRef.current ? 1 : 0);
                if (count <= 1) return 'repeat(1, minmax(0, 1fr))';
                if (count === 2) return 'repeat(2, minmax(0, 1fr))';
                if (count <= 4) return 'repeat(2, minmax(0, 1fr))';
                if (count <= 9) return 'repeat(3, minmax(0, 1fr))';
                return 'repeat(4, minmax(0, 1fr))';
              })(),
            }}
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-card">
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

            {remoteStreams.map((r) => {
              const participant = participants.find(p => p.socketId === r.socketId);
              const label = participant?.user?.name || 'Guest';
              return (
                <div key={r.socketId} className="relative aspect-video rounded-2xl overflow-hidden bg-card">
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => { if (el) el.srcObject = r.stream; }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-[10px]">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
      </main>

      {/* Bottom Controls */}
      <nav className="bg-card p-4 flex justify-between items-center border-t border-white/5 pb-8">
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
            onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
            className={`p-3 rounded-xl transition-all ${showParticipants ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white'}`}
          >
            <Users />
          </button>
          <span className="text-[10px] text-white/60">Participants</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
            className={`p-3 rounded-xl transition-all relative ${showChat ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white'}`}
          >
            <MessageSquare className="w-6 h-6" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
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
        <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center justify-between border-b border-white/5">
            <h2 className="text-lg font-bold">{showChat ? 'Chat' : 'Participants'}</h2>
            <button onClick={() => { setShowChat(false); setShowParticipants(false); }} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X />
            </button>
          </header>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {showParticipants ? (
              <ul className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-card rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs">
                      ME
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">You (Host)</span>
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">Host</span>
                    </div>
                  </div>
                  {isMuted ? <MicOff className="text-red-500" /> : <Mic className="text-green-400" />}
                </div>
                {participants.map((p) => {
                  const isMe = p.socketId === socketRef.current?.id;
                  const displayName = p.user?.name || p.user || 'Guest';
                  const initial = (displayName || 'G').charAt(0).toUpperCase();
                  const hasStream = remoteStreams.some(r => r.socketId === p.socketId);
                  return (
                    <li key={p.socketId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                          {p.user?.avatar ? (
                            <img
                              src={p.user.avatar}
                              alt={displayName}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : null}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-[#4ea1ff] flex items-center justify-center font-bold text-sm text-white uppercase">
                            {initial}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm truncate max-w-[180px]">{displayName}{isMe ? ' (You)' : ''}</span>
                          <div className="text-[11px] text-white/60 flex items-center gap-2">
                            {isMe && <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">Host</span>}
                            <span>{hasStream ? 'Video' : 'No video'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-md bg-white/5">
                          {isMe ? (isMuted ? <MicOff className="text-red-400" /> : <Mic className="text-green-400" />) : <Mic className="text-white/40" />}
                        </div>
                        <div className="p-1 rounded-md bg-white/5">
                          {hasStream ? <Camera className="text-white/40" /> : <CameraOff className="text-white/30" />}
                        </div>
                      </div>
                    </li>
                  );
                })}
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
            <div className="p-4 border-t border-white/5 pb-10 bg-card">
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
                  className="text-primary p-2 hover:bg-primary/10 rounded-lg transition-all"
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
