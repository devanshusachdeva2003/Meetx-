import { useEffect, useRef, useState } from 'react';

export function usePeerConnections({ socketRef, localStreamRef, roomId, localUser }) {
  const peersRef = useRef(new Map()); // socketId -> { pc, stream }
  const [remoteStreams, setRemoteStreams] = useState([]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    function handleSignal(msg) {
      const { from, data } = msg;
      handleIncomingSignal(from, data).catch(console.error);
    }

    socket.on('signal', handleSignal);

    return () => {
      socket.off('signal', handleSignal);
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

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    const remoteStream = new MediaStream();

    pc.ontrack = (ev) => {
      ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      updateRemoteStream(socketId, remoteStream);
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        socketRef.current.emit('signal', { to: socketId, data: { type: 'ice', candidate: ev.candidate } });
      }
    };

    // add local tracks
    localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));

    peersRef.current.set(socketId, { pc, stream: remoteStream });

    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('signal', { to: socketId, data: { type: 'offer', sdp: pc.localDescription } });
    }

    return { pc, stream: remoteStream };
  }

  async function handleIncomingSignal(fromSocketId, data) {
    if (!data) return;
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
      entry.pc.close();
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
