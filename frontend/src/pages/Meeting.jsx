import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../component/ui/Button";
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
import { Users, MicOff, Loader2 } from "lucide-react";
import api from "../utils/api";
import { PreJoinScreen } from "../component/meeting/PreJoinScreen";
import { useUser } from "../context/UserContext";
import { LobbyUI } from "../component/meeting/LobbyUI";
import { LeaveMeetingDialog } from "../component/meeting/LeaveMeetingDialog";

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
    audioDeviceId: "",
  });
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

  const [isKicked, setKicked] = useState(false);

  useEffect(() => {
    // If we were redirected here with pre-join settings, apply them immediately
    if (location.state?.settings && id) {
      setName(location.state.settings.name);
      setJoinOptions({
        videoEnabled: location.state.settings.videoEnabled,
        audioEnabled: location.state.settings.audioEnabled,
        videoDeviceId: location.state.settings.videoDeviceId,
        audioDeviceId: location.state.settings.audioDeviceId,
      });
      setHasJoined(true);
      // Clear the state so a page refresh shows the PreJoin screen again
      window.history.replaceState({}, document.title);
    }
  }, [location.state, id]);

  useEffect(() => {
    if (!id && !loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [id, user, loading, navigate]);

  useEffect(() => {
    if (!hasJoined || !name.trim()) return;

    (async () => {
      try {
        const userId = user?.id || user?._id || "";
        const resp = await api.get(
          `/meetings/livekit/token?room=${id}&username=${name.trim()}&userId=${userId}`,
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

  if (isKicked) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0B0C10] text-gray-200">
        <div className="bg-card/50 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/30">
            <Users className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">You left the meeting</h2>
          <p className="text-gray-400 mb-8">
            You were disconnected or removed by the host.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    if (!id && loading)
      return (
        <div className="flex h-screen items-center justify-center bg-[#0B0C10] text-white">
          Loading...
        </div>
      );

    return (
      <PreJoinScreen
        name={name || user?.name || ""}
        isLoggedIn={!!user}
        onJoin={async (settings) => {
          // Regular join flow for existing room
          setName(settings.name);
          setJoinOptions({
            videoEnabled: settings.videoEnabled,
            audioEnabled: settings.audioEnabled,
            videoDeviceId: settings.videoDeviceId,
            audioDeviceId: settings.audioDeviceId,
          });
          setHasJoined(true);
        }}
      />
    );
  }

  if (!token) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0B0C10] text-gray-200">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Preparing Meeting</h2>
        <p className="text-sm text-gray-400">Securing your connection...</p>
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
      onDisconnected={(reason) => {
        if (window.location.pathname.includes('/meeting/')) {
          setKicked(true);
        }
      }}
      options={{
        videoCaptureDefaults: joinOptions.videoDeviceId
          ? { deviceId: joinOptions.videoDeviceId }
          : undefined,
        audioCaptureDefaults: joinOptions.audioDeviceId
          ? { deviceId: joinOptions.audioDeviceId }
          : undefined,
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const allParticipants = useParticipants();
  const { user } = useUser();
  const [meetingData, setMeetingData] = useState(null);

  useEffect(() => {
    if (id) {
      api
        .get(`/meetings/${id}`)
        .then((res) => setMeetingData(res.data.meeting))
        .catch(console.error);
    }
  }, [id]);

  const isHost = Boolean(
    meetingData &&
    user &&
    (meetingData.host === user.id || meetingData.host === user._id),
  );

  const hostInRoom = allParticipants.some((p) => {
    try {
      const meta = JSON.parse(p.metadata || "{}");
      return meta.isHost === true;
    } catch {
      return false;
    }
  });

  let isLocalLobby = false;
  try {
    const meta = JSON.parse(localParticipant.metadata || "{}");
    isLocalLobby = meta.isLobby === true;
  } catch (e) {}

  const waitingForHost = !isHost && (!hostInRoom || isLocalLobby);

  const handleMute = async (identity, trackType, muted) => {
    try {
      await api.post(`/meetings/${id}/mute`, { identity, trackType, muted });
    } catch (e) {
      console.error(`Failed to ${muted ? "mute" : "unmute"}`, e);
    }
  };

  const handleRemove = async (identity) => {
    try {
      await api.post(`/meetings/${id}/remove`, { identity });
    } catch (e) {
      console.error("Failed to remove", e);
    }
  };

  const handleAdmit = async (identity) => {
    try {
      await api.post(`/meetings/${id}/admit`, { identity });
    } catch (e) {
      console.error("Failed to admit", e);
    }
  };

  const handleDeny = async (identity) => {
    try {
      await api.post(`/meetings/${id}/deny`, { identity });
    } catch (e) {
      console.error("Failed to deny", e);
    }
  };

  const handleEndMeeting = async () => {
    try {
      await api.post(`/meetings/${id}/end`);
      doLeave();
    } catch (e) {
      console.error("Failed to end meeting", e);
    }
  };

  // We want to display all video tracks and screen shares
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const uiParticipants = useMemo(() => {
    return allParticipants.map((p) => {
      let isLobby = false;
      try {
        const meta = JSON.parse(p.metadata || "{}");
        isLobby = meta.isLobby === true;
      } catch (e) {}

      return {
        socketId: p.identity,
        user: { name: p.name || p.identity },
        isMuted: !p.isMicrophoneEnabled,
        hasVideo: p.isCameraEnabled,
        isLobby,
      };
    });
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

          let displayLabel =
            trackRef.participant.name || trackRef.participant.identity;
          if (trackRef.source === Track.Source.ScreenShare) {
            displayLabel = isLocalScreenShare
              ? `${name}'s Screen`
              : `${displayLabel}'s Screen`;
          }

          streams.push({
            id: trackRef.publication.trackSid || Math.random().toString(),
            socketId: trackRef.participant.identity,
            label: displayLabel,
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

  const handleSendMessage = (customMsgObj = null) => {
    if (customMsgObj) {
      const encoder = new TextEncoder();
      send(encoder.encode(JSON.stringify(customMsgObj)), { reliable: true });
      setChatMessages((prev) => [...prev, customMsgObj]);
      return;
    }
    
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

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
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
      <MeetingHeader id={id} onLeave={handleLeaveClick} />

      {waitingForHost ? (
        <LobbyUI localStream={localStream} handleLeaveClick={handleLeaveClick} />
      ) : (
        <>
          <main className="flex-1 w-full h-full pt-20 pb-28 px-4 md:px-8 overflow-hidden relative z-0 flex items-center justify-center">
            <motion.div layout className="flex flex-col lg:flex-row gap-4 w-full h-full max-w-7xl mx-auto">
              <motion.div layout className="flex-1 min-h-0 min-w-0 rounded-3xl overflow-hidden flex items-center justify-center relative">
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
                    label={mainStream.label}
                    isMuted={
                      uiParticipants.find((p) => p.socketId === mainStream.socketId)
                        ?.isMuted
                    }
                  />
                )}
              </motion.div>

              <motion.div layout className="w-full lg:w-72 flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto shrink-0 snap-x lg:snap-y pb-2 lg:pb-0 hide-scrollbar">
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
                      label={r.label}
                      isMuted={
                        uiParticipants.find((p) => p.socketId === r.socketId)
                          ?.isMuted
                      }
                    />
                  ))}
              </motion.div>
            </motion.div>
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
            roomId={id}
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
            isHost={isHost}
            onMute={handleMute}
            onRemove={handleRemove}
            onAdmit={handleAdmit}
            onDeny={handleDeny}
          />
        </>
      )}

      <LeaveMeetingDialog 
        showLeaveDialog={showLeaveConfirm}
        isHost={isHost}
        setShowLeaveDialog={setShowLeaveConfirm}
        confirmLeave={() => {
          setShowLeaveConfirm(false);
          doLeave();
        }}
        confirmEndMeeting={() => {
          setShowLeaveConfirm(false);
          handleEndMeeting();
        }}
      />
    </div>
  );
}
