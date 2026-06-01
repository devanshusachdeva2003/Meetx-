import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  useTracks,
  useLocalParticipant,
  useParticipants,
  useDataChannel,
  useRoomContext
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { MeetingHeader } from "../component/meeting/MeetingHeader";
import { MeetingDock } from "../component/meeting/MeetingDock";
import { MeetingSidePanel } from "../component/meeting/MeetingSidePanel";
import { VideoTile } from "../component/meeting/VideoTile";
import { Users, MicOff } from 'lucide-react';
import api from '../utils/api';

function randomName() {
  return `Guest-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Meeting() {
  const { id } = useParams();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

  console.log("=== FRONTEND ENV CHECK ===");
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
  console.log("VITE_LIVEKIT_URL:", import.meta.env.VITE_LIVEKIT_URL);
  console.log("==========================");

  useEffect(() => {
    if (!hasJoined || !name.trim()) return;

    (async () => {
      try {
        const resp = await api.get(`/livekit/token?room=${id}&username=${name.trim()}`);
        setToken(resp.data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id, name, hasJoined]);

  if (!serverUrl) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0C10] text-white flex-col gap-4">
        <h2 className="text-xl font-bold text-red-500">Configuration Error</h2>
        <p>VITE_LIVEKIT_URL is missing. Please add it to your Vercel Environment Variables and redeploy.</p>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0C10] text-white p-4">
        <div className="bg-card p-8 rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold mb-2">Join Meeting</h2>
          <p className="text-white/60 mb-6 text-sm">Please enter your name to continue</p>
          <input 
            type="text" 
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:border-primary text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                setHasJoined(true);
              }
            }}
            autoFocus
          />
          <button 
            onClick={() => {
              if (name.trim()) setHasJoined(true);
            }}
            disabled={!name.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0C10] text-white">
        Getting token...
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      connect={true}
    >
      <MeetingUI id={id} name={name} />
    </LiveKitRoom>
  );
}

function MeetingUI({ id, name }) {
  const navigate = useNavigate();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const allParticipants = useParticipants();
  
  // We want to display all video tracks in our custom UI
  const tracks = useTracks([Track.Source.Camera]);

  // Map LiveKit participants to UI participants array
  const uiParticipants = useMemo(() => {
    return allParticipants.map(p => ({
      socketId: p.identity,
      user: { name: p.identity },
      isMuted: !p.isMicrophoneEnabled,
      hasVideo: p.isCameraEnabled,
    }));
  }, [allParticipants]);

  // Map LiveKit remote tracks to UI remoteStreams array
  const remoteStreams = useMemo(() => {
    const streams = [];
    tracks.forEach(trackRef => {
      if (trackRef.participant.identity !== localParticipant.identity) {
        if (trackRef.publication?.track?.mediaStreamTrack) {
          const mediaStream = new MediaStream([trackRef.publication.track.mediaStreamTrack]);
          streams.push({
            socketId: trackRef.participant.identity,
            stream: mediaStream
          });
        }
      }
    });
    return streams;
  }, [tracks, localParticipant]);

  const localStream = useMemo(() => {
    const localTrackRef = tracks.find(t => t.participant.identity === localParticipant.identity);
    if (localTrackRef?.publication?.track?.mediaStreamTrack) {
      return new MediaStream([localTrackRef.publication.track.mediaStreamTrack]);
    }
    return null;
  }, [tracks, localParticipant]);

  // Handle chat with useDataChannel
  const { send } = useDataChannel("chat", (msg) => {
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(msg.payload);
      const parsed = JSON.parse(text);
      setChatMessages(prev => [...prev, parsed]);
    } catch (e) {
      console.error("Error decoding message:", e);
    }
  });

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const msgObj = { text: chatMessage, user: { name } };
      const encoder = new TextEncoder();
      send(encoder.encode(JSON.stringify(msgObj)), { reliable: true });
      setChatMessages(prev => [...prev, msgObj]);
      setChatMessage('');
    }
  };

  const doLeave = () => {
    room.disconnect();
    navigate('/');
  };

  const isMuted = !localParticipant.isMicrophoneEnabled;
  const isVideoOff = !localParticipant.isCameraEnabled;

  const toggleMute = () => {
    if (isMuted) {
      localParticipant.setMicrophoneEnabled(true);
    } else {
      localParticipant.setMicrophoneEnabled(false);
    }
  };

  const toggleVideo = () => {
    if (isVideoOff) {
      localParticipant.setCameraEnabled(true);
    } else {
      localParticipant.setCameraEnabled(false);
    }
  };

  const hasRemotes = remoteStreams && remoteStreams.length > 0;
  const mainIsLocal = !hasRemotes;
  const mainStream = hasRemotes ? remoteStreams[0] : null;

  return (
    <div className="relative flex flex-col h-screen bg-[#0B0C10] text-white font-manrope overflow-hidden">
      <MeetingHeader id={id} onLeave={doLeave} />

      <main className="flex-1 w-full h-full pt-20 pb-28 px-4 md:px-8 overflow-hidden relative z-0 flex items-center justify-center">
          <div className="flex flex-col lg:flex-row gap-4 w-full h-full max-w-7xl mx-auto">
             
             <div className="flex-1 min-h-0 min-w-0 rounded-3xl overflow-hidden flex items-center justify-center relative">
                {mainIsLocal ? (
                  <VideoTile
                    isMain={true}
                    isLocal={true}
                    stream={localStream}
                    label={`${name} (You)`}
                    isMuted={isMuted}
                  />
                ) : (
                  <VideoTile
                    isMain={true}
                    isLocal={false}
                    stream={mainStream.stream}
                    label={mainStream.socketId}
                    isMuted={uiParticipants.find(p => p.socketId === mainStream.socketId)?.isMuted}
                  />
                )}
             </div>

             <div className="w-full lg:w-72 flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto shrink-0 snap-x lg:snap-y pb-2 lg:pb-0 hide-scrollbar">
                {hasRemotes && (
                  <VideoTile
                    isMain={false}
                    isLocal={true}
                    stream={localStream}
                    label={`${name} (You)`}
                    isMuted={isMuted}
                  />
                )}
                
                {hasRemotes && remoteStreams.map((r) => (
                     <VideoTile
                       key={r.socketId}
                       isMain={false}
                       isLocal={false}
                       stream={r.stream}
                       label={r.socketId}
                       isMuted={uiParticipants.find(p => p.socketId === r.socketId)?.isMuted}
                     />
                ))}

                {uiParticipants.filter(p => p.socketId !== localParticipant?.identity && !remoteStreams.some(r => r.socketId === p.socketId)).map((p) => {
                  const displayName = p.user?.name || p.socketId || "G";
                  const initial = displayName.charAt(0).toUpperCase();
                  
                  return (
                    <div key={`no-video-${p.socketId}`} className="relative w-48 lg:w-full aspect-video rounded-2xl overflow-hidden bg-card border border-white/10 shadow-lg group shrink-0 snap-center">
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-[#4ea1ff] flex items-center justify-center font-bold text-2xl text-white uppercase shadow-lg">
                          {initial}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-xl border border-white/10 px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-2 shadow-lg">
                        {displayName}
                        {p.isMuted ? <MicOff className="text-red-400 w-3 h-3" /> : null}
                      </div>
                    </div>
                  );
                })}
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
        participants={uiParticipants}
        remoteStreams={remoteStreams}
        localUser={{ name }}
        isLocalMuted={isMuted}
        chatMessages={chatMessages}
        chatMessage={chatMessage}
        setChatMessage={setChatMessage}
        onSendMessage={handleSendMessage}
        socketId={localParticipant.identity}
      />
    </div>
  );
}
