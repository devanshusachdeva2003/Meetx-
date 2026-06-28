import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRoomContext, useLocalParticipant, useParticipants, useDataChannel, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Users, Loader2 } from "lucide-react";
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
import { ReactionsOverlay } from "./ReactionsOverlay";
import { LiveCaptions } from "./LiveCaptions";
import { MeetingNotes } from "./MeetingNotes";
import { MeetingWhiteboard } from "./MeetingWhiteboard";

export function MeetingUI({ id, name, onLeaveIntentional }) {
  const navigate = useNavigate();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [loadingActions, setLoadingActions] = useState({});

  // Enhancements State
  const [raisedHands, setRaisedHands] = useState(new Set());
  const [reactions, setReactions] = useState([]);
  const [captions, setCaptions] = useState([]);
  const [captionSettings, setCaptionSettings] = useState({
    enabled: true,
    fontSize: 'text-xl',
    color: '#ffffff',
    background: 'rgba(0,0,0,0.5)',
    filter: 'blur',
    opacity: 50
  });
  
  // Notes and Tasks State
  const [notesContent, setNotesContent] = useState("");
  const [tasks, setTasks] = useState([]);
  
  const [currentBg, setCurrentBg] = useState('none');
  const [bgProcessor, setBgProcessor] = useState(null);

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
      doLeave(); // Disconnect immediately so the user sees the intentional leave screen
      await api.post(`/meetings/${id}/end`);
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
        isSpeaking: p.isSpeaking,
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
        let isLobby = false;
        try {
          const meta = JSON.parse(trackRef.participant.metadata || "{}");
          isLobby = meta.isLobby === true;
        } catch (e) {}

        if (isLobby) return;

        let mediaStream = null;
        if (trackRef.publication?.track?.mediaStreamTrack) {
          mediaStream = new MediaStream([
            trackRef.publication.track.mediaStreamTrack,
          ]);
        }

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

  // Reactions Data Channel
  const handleReactionMessage = React.useCallback((msg) => {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(msg.payload));
      const reaction = { id: Date.now() + Math.random(), emoji: parsed.emoji, identity: parsed.identity, name: parsed.name };
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => setReactions((prev) => prev.filter(r => r.id !== reaction.id)), 4000);
    } catch (e) {}
  }, []);
  const { send: sendReaction } = useDataChannel("reactions", handleReactionMessage);

  const broadcastReaction = (emoji) => {
    const payload = { emoji, identity: localParticipant.identity, name };
    sendReaction(new TextEncoder().encode(JSON.stringify(payload)), { reliable: true });
    handleReactionMessage({ payload: new TextEncoder().encode(JSON.stringify(payload)) });
  };

  // Raise Hand Data Channel
  const handleHandMessage = React.useCallback((msg) => {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(msg.payload));
      setRaisedHands((prev) => {
        const next = new Set(prev);
        if (parsed.action === 'raise') next.add(parsed.identity);
        else next.delete(parsed.identity);
        return next;
      });
    } catch (e) {}
  }, []);
  const { send: sendHand } = useDataChannel("hands", handleHandMessage);

  const toggleRaiseHand = () => {
    const isRaised = raisedHands.has(localParticipant.identity);
    const payload = { action: isRaised ? 'lower' : 'raise', identity: localParticipant.identity };
    sendHand(new TextEncoder().encode(JSON.stringify(payload)), { reliable: true });
    handleHandMessage({ payload: new TextEncoder().encode(JSON.stringify(payload)) });
  };
  
  const lowerHand = (identity) => {
    const payload = { action: 'lower', identity };
    sendHand(new TextEncoder().encode(JSON.stringify(payload)), { reliable: true });
    handleHandMessage({ payload: new TextEncoder().encode(JSON.stringify(payload)) });
  };

  const lowerAllHands = () => {
    raisedHands.forEach((identity) => lowerHand(identity));
  };

  // Captions Data Channel & SpeechRecognition
  const handleCaptionMessage = React.useCallback((msg) => {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(msg.payload));
      setCaptions((prev) => {
        const existing = prev.findIndex(c => c.id === parsed.id);
        const newCaptions = [...prev];
        if (existing >= 0) newCaptions[existing] = parsed;
        else newCaptions.push(parsed);
        return newCaptions.slice(-10); // Keep last 10
      });
      if (parsed.isFinal) {
        setTimeout(() => {
          setCaptions((prev) => prev.filter(c => c.id !== parsed.id));
        }, 6000); // Remove after 6 seconds
      }
    } catch (e) {}
  }, []);
  const { send: sendCaption } = useDataChannel("captions", handleCaptionMessage);

  useEffect(() => {
    if (!captionSettings.enabled || !isMicrophoneEnabled) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    let currentId = null;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (!currentId) currentId = Date.now().toString();

      const text = finalTranscript || interimTranscript;
      if (!text.trim()) return;

      const isFinal = !!finalTranscript;
      const payload = {
        id: currentId,
        text,
        identity: localParticipant.identity,
        name,
        isFinal
      };

      sendCaption(new TextEncoder().encode(JSON.stringify(payload)), { reliable: false });
      handleCaptionMessage({ payload: new TextEncoder().encode(JSON.stringify(payload)) });

      if (isFinal) {
        currentId = null;
      }
    };

    try {
      recognition.start();
    } catch (e) {}

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [captionSettings.enabled, isMicrophoneEnabled, sendCaption, handleCaptionMessage, localParticipant.identity, name]);

  // Notes & Tasks Data Channel
  const handleNotesMessage = React.useCallback((msg) => {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(msg.payload));
      if (parsed.type === 'notes') setNotesContent(parsed.content);
      if (parsed.type === 'tasks') setTasks(parsed.tasks);
    } catch (e) {}
  }, []);
  const { send: sendNotes } = useDataChannel("notes-sync", handleNotesMessage);

  const broadcastNotes = (content) => {
    sendNotes(new TextEncoder().encode(JSON.stringify({ type: 'notes', content })), { reliable: true });
  };
  
  const broadcastTasks = (updatedTasks) => {
    sendNotes(new TextEncoder().encode(JSON.stringify({ type: 'tasks', tasks: updatedTasks })), { reliable: true });
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

  const applyVirtualBackground = async (bgType) => {
    try {
      const pub = localParticipant.getTrackPublication(Track.Source.Camera);
      const track = pub?.videoTrack;
      
      if (!track) {
        toast.error("Camera is off. Turn on your camera first.");
        return;
      }

      // Dynamic import to prevent build crashing if not installed
      const processors = await import('@livekit/track-processors');
      
      if (bgProcessor) {
        await track.stopProcessor();
        setBgProcessor(null);
      }

      if (bgType === 'none') {
        setCurrentBg('none');
        return;
      }

      let processor;
      if (bgType === 'blur') {
        processor = processors.BackgroundBlur(10, { delegate: 'GPU' });
      } else {
        processor = processors.VirtualBackground(bgType);
      }

      await track.setProcessor(processor);
      setBgProcessor(processor);
      setCurrentBg(bgType);
      toast.success("Background applied!");
    } catch (e) {
      console.error("Virtual background error:", e);
      toast.error("Failed to apply background. You may need to run 'npm install @livekit/track-processors'");
    }
  };

  const hasRemotes = remoteStreams && remoteStreams.length > 0;
  const mainIsLocal = !hasRemotes;
  const mainStream = hasRemotes ? remoteStreams[0] : null;

  if (!meetingDataLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-gray-400 font-medium tracking-wide">Joining meeting...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[100dvh] bg-background text-foreground font-manrope overflow-hidden">
      <MeetingHeader id={id} onLeave={handleLeaveClick} />

      {waitingForHost ? (
        <LobbyUI localStream={localStream} handleLeaveClick={handleLeaveClick} />
      ) : (
        <>
          <main className="flex-1 w-full h-full pb-28 px-4 md:px-8 overflow-hidden relative z-0 flex items-center justify-center">
            <motion.div layout className="flex flex-col lg:flex-row gap-4 w-full h-full max-w-7xl mx-auto py-4">
              <motion.div layout className="flex-1 min-h-0 min-w-0 rounded-3xl overflow-hidden flex items-center justify-center relative">
                {mainIsLocal ? (
                  <VideoTile
                    isMain={true}
                    isLocal={true}
                    stream={localStream}
                    label={`${name} (You)`}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    isSpeaking={localParticipant.isSpeaking}
                    isHandRaised={raisedHands.has(localParticipant.identity)}
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
                    isVideoOff={
                      mainStream.isScreenShare ? false : !uiParticipants.find((p) => p.socketId === mainStream.socketId)?.hasVideo
                    }
                    isSpeaking={uiParticipants.find(p => p.socketId === mainStream.socketId)?.isSpeaking}
                    publication={mainStream.publication}
                    isHandRaised={raisedHands.has(mainStream.socketId)}
                    isScreenShare={mainStream.isScreenShare}
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
                    isVideoOff={isVideoOff}
                    isSpeaking={localParticipant.isSpeaking}
                    isHandRaised={raisedHands.has(localParticipant.identity)}
                  />
                )}

                {hasRemotes &&
                  remoteStreams
                    .filter((r) => r.id !== mainStream?.id)
                    .map((r) => (
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
                      isVideoOff={
                        r.isScreenShare ? false : !uiParticipants.find((p) => p.socketId === r.socketId)?.hasVideo
                      }
                      isSpeaking={uiParticipants.find(p => p.socketId === r.socketId)?.isSpeaking}
                      publication={r.publication}
                      isHandRaised={raisedHands.has(r.socketId)}
                      isScreenShare={r.isScreenShare}
                    />
                  ))}
              </motion.div>
            </motion.div>
            
            <ReactionsOverlay reactions={reactions} />
            <LiveCaptions captions={captions} settings={captionSettings} />
            
          </main>

          {showNotes && (
            <MeetingNotes
              onClose={() => setShowNotes(false)}
              roomId={id}
              localUser={{ name }}
              notesContent={notesContent}
              setNotesContent={setNotesContent}
              tasks={tasks}
              setTasks={setTasks}
              onNotesChange={broadcastNotes}
              onTasksChange={broadcastTasks}
            />
          )}
          
          {showWhiteboard && (
            <MeetingWhiteboard
              onClose={() => setShowWhiteboard(false)}
              onSave={() => toast.success("Whiteboard saved to meeting!")}
            />
          )}

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
              setShowNotes(false);
            }}
            onToggleChat={() => {
              setShowChat(!showChat);
              setShowParticipants(false);
              setShowNotes(false);
            }}
            onToggleNotes={() => {
              setShowNotes(!showNotes);
              setShowChat(false);
              setShowParticipants(false);
            }}
            onToggleWhiteboard={() => setShowWhiteboard(!showWhiteboard)}
            showNotes={showNotes}
            showWhiteboard={showWhiteboard}
            isAudioLoading={isAudioLoading}
            isVideoLoading={isVideoLoading}
            // Enhancements
            isHandRaised={raisedHands.has(localParticipant.identity)}
            onToggleHand={toggleRaiseHand}
            onReaction={broadcastReaction}
            captionSettings={captionSettings}
            setCaptionSettings={setCaptionSettings}
            currentBg={currentBg}
            onSelectBg={applyVirtualBackground}
            onUploadCustomBg={applyVirtualBackground}
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
            // Enhancements
            raisedHands={raisedHands}
            onLowerHand={lowerHand}
            onLowerAllHands={lowerAllHands}
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
