import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Users, Mic, MicOff, Camera, CameraOff, Monitor, MessageSquare, MoreVertical, PhoneOff, Star, Send, X, Copy } from 'lucide-react';
import { useLocalStream } from "../hooks/useLocalStream";
import { useSocket } from "../hooks/useSocket";
import { usePeerConnections } from "../hooks/usePeerConnections";
import { MeetingHeader } from "../component/meeting/MeetingHeader";
import { MeetingDock } from "../component/meeting/MeetingDock";
import { MeetingSidePanel } from "../component/meeting/MeetingSidePanel";
import { VideoTile } from "../component/meeting/VideoTile";

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

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendChat(id, chatMessage, { name });
      setChatMessage('');
    }
  };

  const hasRemotes = remoteStreams && remoteStreams.length > 0;
  const mainIsLocal = !hasRemotes;
  const mainStream = hasRemotes ? remoteStreams[0] : null;

  return (
    <div className="relative flex flex-col h-screen bg-[#0B0C10] text-white font-manrope overflow-hidden">
      
      <MeetingHeader id={id} onLeave={doLeave} />

      {/* Video Grid */}
      <main className="flex-1 w-full h-full pt-20 pb-28 px-4 md:px-8 overflow-hidden relative z-0 flex items-center justify-center">
          <div className="flex flex-col lg:flex-row gap-4 w-full h-full max-w-7xl mx-auto">
             
             {/* Main View */}
             <div className="flex-1 min-h-0 min-w-0 rounded-3xl overflow-hidden flex items-center justify-center relative">
                {mainIsLocal ? (
                  <VideoTile
                    isMain={true}
                    isLocal={true}
                    stream={localStreamRef.current}
                    label={`${name} (You)`}
                    isMuted={isMuted}
                    localVideoRef={localVideoRef}
                  />
                ) : (
                  <VideoTile
                    isMain={true}
                    isLocal={false}
                    stream={mainStream.stream}
                    label={participants.find(p => p.socketId === mainStream.socketId)?.user?.name || 'Guest'}
                  />
                )}
             </div>

             {/* Sidebar (Always show for this preview, mixing real remotes and mock users) */}
             <div className="w-full lg:w-72 flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto shrink-0 snap-x lg:snap-y pb-2 lg:pb-0 hide-scrollbar">
                {/* Local video moves to sidebar when remotes exist */}
                {hasRemotes && (
                  <VideoTile
                    isMain={false}
                    isLocal={true}
                    stream={localStreamRef.current}
                    label={`${name} (You)`}
                    isMuted={isMuted}
                    localVideoRef={localVideoRef}
                  />
                )}
                
                {/* Rest of the remote streams */}
                {hasRemotes && remoteStreams.slice(1).map((r) => {
                   const participant = participants.find(p => p.socketId === r.socketId);
                   return (
                     <VideoTile
                       key={r.socketId}
                       isMain={false}
                       isLocal={false}
                       stream={r.stream}
                       label={participant?.user?.name || 'Guest'}
                     />
                   );
                })}

                {/* MOCK USERS FOR DEMONSTRATION */}
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={`mock-${i}`} className="relative w-48 lg:w-full aspect-video rounded-2xl overflow-hidden bg-card border border-white/10 shadow-lg group shrink-0 snap-center">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Users className="w-8 h-8 text-white/20" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-xl border border-white/10 px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-2 shadow-lg">
                      Mock User {i}
                      <MicOff className="text-red-400 w-3 h-3" />
                    </div>
                  </div>
                ))}
             </div>
          </div>
      </main>

      <MeetingDock
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        showParticipants={showParticipants}
        showChat={showChat}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleParticipants={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
        onToggleChat={() => { setShowChat(!showChat); setShowParticipants(false); }}
      />

      <MeetingSidePanel
        showChat={showChat}
        showParticipants={showParticipants}
        onClose={() => { setShowChat(false); setShowParticipants(false); }}
        participants={participants}
        remoteStreams={remoteStreams}
        localUser={{ name }}
        isLocalMuted={isMuted}
        chatMessages={chatMessages}
        chatMessage={chatMessage}
        setChatMessage={setChatMessage}
        onSendMessage={handleSendMessage}
        socketId={socketRef.current?.id}
      />

    </div>
  );
}
