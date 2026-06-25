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
import api from "../utils/api";
import { PreJoinScreen } from "../component/meeting/PreJoinScreen";
import { useUser } from "../context/UserContext";
import { MeetingUI } from "../component/meeting/MeetingUI";

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
  const isIntentionalLeaveRef = React.useRef(false);

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
    if (isIntentionalLeaveRef.current) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
          <div className="bg-card/50 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-md">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/30">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">You left the meeting</h2>
            <p className="text-muted-foreground mb-8">
              Thank you for joining. Have a great day!
            </p>
            <div className="flex gap-4 w-full">
              <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                Rejoin
              </Button>
              <Button onClick={() => navigate("/")} className="flex-1">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <div className="bg-card/50 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/30">
            <Users className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">You left the meeting</h2>
          <p className="text-muted-foreground mb-8">
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
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold mb-2">Preparing Meeting</h2>
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
      <MeetingUI id={id} name={name} onLeaveIntentional={() => { isIntentionalLeaveRef.current = true; }} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}


