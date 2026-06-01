import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  LiveKitRoom,
  useTracks,
  useLocalParticipant,
  useParticipants,
  useDataChannel,
  useRoomContext,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { MeetingHeader } from "../component/meeting/MeetingHeader";
import { MeetingDock } from "../component/meeting/MeetingDock";
import { MeetingSidePanel } from "../component/meeting/MeetingSidePanel";
import { VideoTile } from "../component/meeting/VideoTile";
import { Users, MicOff } from "lucide-react";
import api from "../utils/api";
import { PreJoinScreen } from "../component/meeting/PreJoinScreen";
import { useUser } from "../context/UserContext";

function randomName() {
  return `Guest-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Meeting() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useUser();
  
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [joinOptions, setJoinOptions] = useState({
    videoEnabled: true,
    audioEnabled: true,
    videoDeviceId: "",
    audioDeviceId: ""
  });
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

  useEffect(() => {
    // If we were redirected here with pre-join settings, apply them immediately
    if (location.state?.settings && id) {
      setName(location.state.settings.name);
      setJoinOptions({
        videoEnabled: location.state.settings.videoEnabled,
        audioEnabled: location.state.settings.audioEnabled,
        videoDeviceId: location.state.settings.videoDeviceId,
        audioDeviceId: location.state.settings.audioDeviceId
      });
      setHasJoined(true);
      // Clear the state so a page refresh shows the PreJoin screen again
      window.history.replaceState({}, document.title);
    }
  }, [location.state, id]);

  useEffect(() => {
    if (!id && !loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [id, user, loading, navigate]);



  useEffect(() => {
    if (!hasJoined || !name.trim()) return;

    (async () => {
      try {
        const resp = await api.get(
          `/meetings/livekit/token?room=${id}&username=${name.trim()}`,
        );
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
        <p>
          VITE_LIVEKIT_URL is missing. Please add it to your Vercel Environment
          Variables and redeploy.
        </p>
      </div>
    );
  }

  if (!hasJoined) {
    if (!id && loading) return <div className="flex h-screen items-center justify-center bg-[#0B0C10] text-white">Loading...</div>;

    return (
      <PreJoinScreen 
        name={name} 
        onJoin={async (settings) => {
          if (!id) {
            try {
              // This is a "Create Meeting" flow, request ID from backend
              const response = await api.post('/meetings', { title: `${user?.name || 'User'}'s Meeting` });
              const newId = response.data.meeting.roomId;
              navigate(`/meeting/${newId}`, { state: { settings }, replace: true });
            } catch (err) {
              console.error("Failed to create meeting", err);
              alert("Failed to create meeting. Are you logged in?");
            }
          } else {
            // Regular join flow for existing room
            setName(settings.name);
            setJoinOptions({
              videoEnabled: settings.videoEnabled,
              audioEnabled: settings.audioEnabled,
              videoDeviceId: settings.videoDeviceId,
              audioDeviceId: settings.audioDeviceId
            });
            setHasJoined(true);
          }
        }} 
      />
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
      video={joinOptions.videoEnabled}
      audio={joinOptions.audioEnabled}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      options={{
        videoCaptureDefaults: joinOptions.videoDeviceId ? { deviceId: joinOptions.videoDeviceId } : undefined,
        audioCaptureDefaults: joinOptions.audioDeviceId ? { deviceId: joinOptions.audioDeviceId } : undefined
      }}
    >
      <MeetingUI id={id} name={name} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function MeetingUI({ id, name }) {
  const navigate = useNavigate();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const allParticipants = useParticipants();

  // We want to display all video tracks and screen shares
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  // Map LiveKit participants to UI participants array
  const uiParticipants = useMemo(() => {
    return allParticipants.map((p) => ({
      socketId: p.identity,
      user: { name: p.identity },
      isMuted: !p.isMicrophoneEnabled,
      hasVideo: p.isCameraEnabled,
    }));
  }, [allParticipants]);

  // Map LiveKit remote tracks to UI remoteStreams array
  const remoteStreams = useMemo(() => {
    const streams = [];
    tracks.forEach((trackRef) => {
      if (
        trackRef.participant.identity !== localParticipant.identity ||
        trackRef.source === Track.Source.ScreenShare
      ) {
        if (trackRef.publication?.track?.mediaStreamTrack) {
          const mediaStream = new MediaStream([
            trackRef.publication.track.mediaStreamTrack,
          ]);
          const isLocalScreenShare =
            trackRef.participant.identity === localParticipant.identity;

          let label = trackRef.participant.identity;
          if (trackRef.source === Track.Source.ScreenShare) {
            label = isLocalScreenShare
              ? `${name}'s Screen`
              : `${trackRef.participant.identity}'s Screen`;
          }

          streams.push({
            id: trackRef.publication.trackSid || Math.random().toString(),
            socketId: label,
            stream: mediaStream,
            isScreenShare: trackRef.source === Track.Source.ScreenShare,
          });
        }
      }
    });

    // Sort so screen shares appear first (as the main video)
    streams.sort((a, b) =>
      a.isScreenShare === b.isScreenShare ? 0 : a.isScreenShare ? -1 : 1,
    );

    return streams;
  }, [tracks, localParticipant, name]);

  const localStream = useMemo(() => {
    const localTrackRef = tracks.find(
      (t) =>
        t.participant.identity === localParticipant.identity &&
        t.source === Track.Source.Camera,
    );
    if (localTrackRef?.publication?.track?.mediaStreamTrack) {
      return new MediaStream([
        localTrackRef.publication.track.mediaStreamTrack,
      ]);
    }
    return null;
  }, [tracks, localParticipant]);

  // Handle chat with useDataChannel
  const { send } = useDataChannel("chat", (msg) => {
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(msg.payload);
      const parsed = JSON.parse(text);
      setChatMessages((prev) => [...prev, parsed]);
    } catch (e) {
      console.error("Error decoding message:", e);
    }
  });

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const msgObj = { text: chatMessage, user: { name } };
      const encoder = new TextEncoder();
      send(encoder.encode(JSON.stringify(msgObj)), { reliable: true });
      setChatMessages((prev) => [...prev, msgObj]);
      setChatMessage("");
    }
  };

  const doLeave = () => {
    room.disconnect();
    navigate("/");
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

  const isScreenSharing = localParticipant.isScreenShareEnabled;

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await localParticipant.setScreenShareEnabled(false);
      } else {
        await localParticipant.setScreenShareEnabled(true);
      }
    } catch (e) {
      console.error("Failed to toggle screen share", e);
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
                isMuted={
                  uiParticipants.find((p) => p.socketId === mainStream.socketId)
                    ?.isMuted
                }
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

            {hasRemotes &&
              remoteStreams.map((r) => (
                <VideoTile
                  key={r.id}
                  isMain={false}
                  isLocal={false}
                  stream={r.stream}
                  label={r.socketId}
                  isMuted={
                    uiParticipants.find((p) => p.socketId === r.socketId)
                      ?.isMuted
                  }
                />
              ))}


          </div>
        </div>
      </main>

      <MeetingDock
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        showParticipants={showParticipants}
        showChat={showChat}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleParticipants={() => {
          setShowParticipants(!showParticipants);
          setShowChat(false);
        }}
        onToggleChat={() => {
          setShowChat(!showChat);
          setShowParticipants(false);
        }}
      />

      <MeetingSidePanel
        showChat={showChat}
        showParticipants={showParticipants}
        onClose={() => {
          setShowChat(false);
          setShowParticipants(false);
        }}
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
