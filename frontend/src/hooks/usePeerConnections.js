import { useEffect, useMemo, useRef, useState } from 'react';

export function usePeerConnections({ socketRef, localStreamRef, roomId, localUser }) {
  const peersRef = useRef(new Map()); // socketId -> { pc, stream }
  const [remoteStreams, setRemoteStreams] = useState([]);
  const iceServersRef = useRef(null);

  // parse ICE servers from env if provided (VITE_ICE_SERVERS should be a JSON array)
  const envIceServers = useMemo(() => {
    try {
      const raw = import.meta.env.VITE_ICE_SERVERS;
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[PC] failed to parse VITE_ICE_SERVERS', err);
      return [];
    }
  }, []);

  const defaultIceServers = useMemo(
    () => [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
    []
  );

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    function handleSignal(msg) {
      const { from, data } = msg;
      handleIncomingSignal(from, data).catch(console.error);
    }

    function handleIceServers(list) {
      if (Array.isArray(list) && list.length) {
        iceServersRef.current = list;
        console.debug('[PC] ice-servers received', list);
      }
    }

    socket.on('signal', handleSignal);
    socket.on('ice-servers', handleIceServers);

    return () => {
      socket.off('signal', handleSignal);
      socket.off('ice-servers', handleIceServers);
      // close pcs
      peersRef.current.forEach(({ pc }) => pc.close());
      peersRef.current.clear();
      setRemoteStreams([]);
    };
  }, [socketRef, localStreamRef]);

  async function createPeer(socketId, isOfferer = false) {
    if (!socketRef?.current) throw new Error('Socket not ready');
    if (!localStreamRef?.current) throw new Error('Local stream not ready');

    if (peersRef.current.has(socketId)) return peersRef.current.get(socketId);

    console.debug('[PC] createPeer', { socketId, isOfferer });

    const iceServers =
      (Array.isArray(iceServersRef.current) && iceServersRef.current.length ? iceServersRef.current : null) ||
      (envIceServers.length ? envIceServers : null) ||
      defaultIceServers;

    const pc = new RTCPeerConnection({
      iceServers,
    });

    // remoteStream will reference the incoming MediaStream from the peer
    let remoteStream = new MediaStream();
    let statsInterval = null;

    pc.ontrack = (ev) => {
      const incoming = (ev.streams && ev.streams[0]) || new MediaStream([ev.track]);
      remoteStream = incoming;
      console.debug('[PC] ontrack', { socketId, tracks: incoming.getTracks().length });
      updateRemoteStream(socketId, remoteStream);
    };

    pc.onconnectionstatechange = () => {
      console.debug('[PC] connectionState', { socketId, state: pc.connectionState });
      if (pc.connectionState === 'connected') {
        // start periodic stats logging for this peer
        statsInterval = setInterval(async () => {
          try {
            const stats = await pc.getStats();
            // reduce heavy output: log summary of bytesReceived for inbound tracks
            stats.forEach(report => {
              if (report.type === 'inbound-rtp') {
                console.debug('[PC] stats inbound-rtp', { socketId, id: report.id, bytesReceived: report.bytesReceived, packetsLost: report.packetsLost, jitter: report.jitter });
              }
            });
          } catch (err) {
            console.warn('[PC] stats error', { socketId, err });
          }
        }, 5000);
      } else if (['disconnected','failed','closed'].includes(pc.connectionState)) {
        if (statsInterval) { clearInterval(statsInterval); statsInterval = null; }
      }
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        console.debug('[PC] onicecandidate ->', { to: socketId, candidate: ev.candidate });
        socketRef.current.emit('signal', { to: socketId, data: { type: 'ice', candidate: ev.candidate } });
      }
    };

    // add local tracks
    localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));

    peersRef.current.set(socketId, { pc, stream: remoteStream, statsInterval });

    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('signal', { to: socketId, data: { type: 'offer', sdp: pc.localDescription } });
    }

    return { pc, stream: remoteStream };
  }

  async function handleIncomingSignal(fromSocketId, data) {
    if (!data) return;
    console.debug('[PC] handleIncomingSignal', { fromSocketId, type: data.type });
    if (data.type === 'offer') {
      const { pc } = await createPeer(fromSocketId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('signal', { to: fromSocketId, data: { type: 'answer', sdp: pc.localDescription } });
    }

    if (data.type === 'answer') {
      const entry = peersRef.current.get(fromSocketId);
      if (entry) await entry.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    }

    if (data.type === 'ice') {
      const entry = peersRef.current.get(fromSocketId);
      if (entry) await entry.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  function updateRemoteStream(socketId, stream) {
    setRemoteStreams((prev) => {
      const other = prev.filter((r) => r.socketId !== socketId);
      return [...other, { socketId, stream }];
    });
  }

  async function handleExistingParticipants(list) {
    // list is array of { socketId, user }
    for (const p of list) {
      // create peer as offerer
      await createPeer(p.socketId, true);
    }
  }

  async function handleNewParticipant(p) {
    // when someone else joins, we prepare to receive their offer by creating a peer (not offerer)
    await createPeer(p.socketId, false);
  }

  function removeParticipant(socketId) {
    const entry = peersRef.current.get(socketId);
    if (entry) {
      try { entry.pc.close(); } catch (e) {}
      if (entry.statsInterval) clearInterval(entry.statsInterval);
      peersRef.current.delete(socketId);
      setRemoteStreams((prev) => prev.filter((r) => r.socketId !== socketId));
    }
  }

  return {
    remoteStreams,
    handleExistingParticipants,
    handleNewParticipant,
    removeParticipant,
    createPeer,
  };
}
