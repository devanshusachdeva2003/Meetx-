import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRoomContext, useLocalParticipant, useParticipants, useDataChannel, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Users } from "lucide-react";
import { toast } from "sonner";
import api from "../../utils/api";
import { useUser } from "../../context/UserContext";

import Button from "../ui/Button";
import { MeetingHeader } from "./MeetingHeader";
import { MeetingDock } from "./MeetingDock";
import { MeetingSidePanel } from "./MeetingSidePanel";
import { VideoTile } from "./VideoTile";
import { LobbyUI } from "./LobbyUI";
import { LeaveMeetingDialog } from "./LeaveMeetingDialog";

export function MeetingUI({ id, name, onLeaveIntentional }) {
  const navigate = useNavigate();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [loadingActions, setLoadingActions] = useState({});

  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const allParticipants = useParticipants();
  const { user } = useUser();
  const [meetingData, setMeetingData] = useState(null);
  const [meetingDataLoaded, setMeetingDataLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      api
        .get(`/meetings/${id}`)
        .then((res) => setMeetingData(res.data.meeting))
        .catch(console.error)
        .finally(() => setMeetingDataLoaded(true));
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

  // Only evaluate lobby state AFTER meeting data has loaded.
  // Without this guard, isHost is always false during the API fetch,
  // which causes a race condition that briefly shows the LobbyUI.
  const waitingForHost = meetingDataLoaded && !isHost && (!hostInRoom || isLocalLobby);

  const handleMute = async (identity, trackType, muted) => {
    const actionKey = trackType === 'audio' ? 'audio-muting' : 'video-muting';
    setLoadingActions((prev) => ({ ...prev, [`${identity}-${actionKey}`]: true }));
    try {
      await api.post(`/meetings/${id}/mute`, { identity, trackType, muted });
      toast.success(`Participant ${trackType === 'audio' ? (muted ? 'muted' : 'unmuted') : (muted ? 'video off' : 'video on')}`);
    } catch (e) {
      console.error(`Failed to ${muted ? "mute" : "unmute"}`, e);
      toast.error(`Failed to update participant`);
    } finally {
      setLoadingActions((prev) => {
        const next = { ...prev };
        delete next[`${identity}-${actionKey}`];
        return next;
      });
    }
  };

  const handleRemove = async (identity) => {
    setLoadingActions((prev) => ({ ...prev, [`${identity}-removing`]: true }));
    try {
      await api.post(`/meetings/${id}/remove`, { identity });
      toast.success("Participant removed from meeting");
    } catch (e) {
      console.error("Failed to remove", e);
      toast.error("Failed to remove participant");
    } finally {
      setLoadingActions((prev) => {
        const next = { ...prev };
        delete next[`${identity}-removing`];
        return next;
      });
    }
  };

  const handleAdmit = async (identity) => {
    setLoadingActions((prev) => ({ ...prev, [`${identity}-admitting`]: true }));
    try {
      await api.post(`/meetings/${id}/admit`, { identity });
      toast.success("Participant admitted to meeting");
    } catch (e) {
      console.error("Failed to admit", e);
      toast.error("Failed to admit participant");
    } finally {
      setLoadingActions((prev) => {
        const next = { ...prev };
        delete next[`${identity}-admitting`];
        return next;
      });
    }
  };

  const handleDeny = async (identity) => {
    setLoadingActions((prev) => ({ ...prev, [`${identity}-denying`]: true }));
    try {
      await api.post(`/meetings/${id}/deny`, { identity });
      toast.success("Participant denied entry");
    } catch (e) {
      console.error("Failed to deny", e);
      toast.error("Failed to deny participant");
    } finally {
      setLoadingActions((prev) => {
        const next = { ...prev };
        delete next[`${identity}-denying`];
        return next;
      });
    }
  };

  const handleEndMeeting = async () => {
    try {
      await api.post(`/meetings/${id}/end`);
      doLeave();
      toast.success("Meeting ended");
    } catch (e) {
      console.error("Failed to end meeting", e);
      toast.error("Failed to end meeting");
    }
  };

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
            id: trackRef.publication?.trackSid || `${trackRef.participant.identity}-${trackRef.source}`,
            socketId: trackRef.participant.identity,
            label: displayLabel,
            stream: mediaStream,
            isScreenShare: trackRef.source === Track.Source.ScreenShare,
            publication: trackRef.publication,
          });
        }
      }
    });

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

  const handleDataMessage = React.useCallback((msg) => {
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(msg.payload);
      const parsed = JSON.parse(text);
      setChatMessages((prev) => [...prev, parsed]);
    } catch (e) {
      console.error("Error decoding message:", e);
    }
  }, []);

  const { send } = useDataChannel("chat", handleDataMessage);

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
    if (onLeaveIntentional) onLeaveIntentional();
    room.disconnect();
  };

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  // Use reactive properties from useLocalParticipant() — reading directly from
  // localParticipant.isMicrophoneEnabled is NOT reactive and won't trigger re-renders.
  const isMuted = !isMicrophoneEnabled;
  const isVideoOff = !isCameraEnabled;

  const toggleMute = async () => {
    setIsAudioLoading(true);
    try {
      if (isMuted) {
        await localParticipant.setMicrophoneEnabled(true);
      } else {
        await localParticipant.setMicrophoneEnabled(false);
      }
    } finally {
      setIsAudioLoading(false);
    }
  };

  const toggleVideo = async () => {
    setIsVideoLoading(true);
    try {
      if (isVideoOff) {
        await localParticipant.setCameraEnabled(true);
      } else {
        await localParticipant.setCameraEnabled(false);
      }
    } finally {
      setIsVideoLoading(false);
    }
  };

  const isScreenSharing = isScreenShareEnabled ?? localParticipant.isScreenShareEnabled;

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
    <div className="relative flex flex-col h-screen bg-background text-foreground font-manrope overflow-hidden">
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
                    publication={mainStream.publication}
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
                      publication={r.publication}
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
            isAudioLoading={isAudioLoading}
            isVideoLoading={isVideoLoading}
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
            loadingActions={loadingActions}
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
