import React, { useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

export const VideoTile = React.memo(({
  isMain,
  stream,
  label,
  isMuted,
  isLocal,
  localVideoRef // Only passed if this is the local tile, to store the ref for future access
}) => {
  const containerClass = isMain 
    ? "relative w-full h-full min-h-0 rounded-3xl overflow-hidden bg-card border border-white/10 shadow-2xl ring-2 ring-primary/50 group"
    : "relative w-48 lg:w-full aspect-video rounded-2xl overflow-hidden bg-card border border-white/10 shadow-lg group shrink-0 snap-center";

  const internalRef = useRef(null);

  // Safely assign the stream without causing browser re-paints if it's the exact same stream
  useEffect(() => {
    const videoNode = internalRef.current;
    if (videoNode && stream) {
      if (videoNode.srcObject !== stream) {
        videoNode.srcObject = stream;
      }
    }
    
    if (isLocal && localVideoRef) {
      localVideoRef.current = videoNode;
    }
  }, [stream, isLocal, localVideoRef]);

  return (
    <div className={containerClass}>
      <video
        ref={internalRef}
        autoPlay
        muted={isLocal}
        playsInline
        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg">
        {label}
        {isLocal && (
          isMuted ? <MicOff className="text-red-400 w-3.5 h-3.5" /> : <Mic className="text-green-400 w-3.5 h-3.5" />
        )}
      </div>
    </div>
  );
});
