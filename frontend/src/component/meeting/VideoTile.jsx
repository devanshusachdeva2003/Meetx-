import React, { useRef, useEffect, useState } from "react";
import { Mic, MicOff, User } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export const VideoTile = React.memo(
  ({
    isMain,
    stream,
    label,
    isMuted,
    isLocal,
    localVideoRef, // Only passed if this is the local tile, to store the ref for future access
    publication,
  }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const { theme } = useTheme();

    const containerClass = isMain
      ? "relative w-full h-full min-h-0 rounded-3xl overflow-hidden bg-card border border-border shadow-2xl ring-2 ring-primary/50 group"
      : "relative w-48 lg:w-full aspect-video rounded-2xl overflow-hidden bg-card border border-border shadow-lg group shrink-0 snap-center";

    const internalRef = useRef(null);

    // Safely assign the stream without causing browser re-paints if it's the exact same stream
    useEffect(() => {
      const videoNode = internalRef.current;
      if (videoNode && stream) {
        const currentStream = videoNode.srcObject;
        const currentTrack = currentStream?.getTracks()[0];
        const newTrack = stream.getTracks()[0];

        if (!currentStream || currentTrack !== newTrack) {
          videoNode.srcObject = stream;
        }
      }

      if (isLocal && localVideoRef) {
        localVideoRef.current = videoNode;
      }
    }, [stream, isLocal, localVideoRef]);

    // Intersection Observer to mute/unmute track subscription when off-screen
    useEffect(() => {
      const node = internalRef.current;
      if (!node || !publication) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              publication.setSubscribed(true);
            } else {
              publication.setSubscribed(false);
            }
          });
        },
        { threshold: 0.1 },
      );

      observer.observe(node);

      return () => {
        observer.disconnect();
        publication.setSubscribed(true); // Re-subscribe when unmounting just in case
      };
    }, [publication]);

    const noVideo = !stream || stream.getVideoTracks().length === 0;

    const labelBgClass = theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-white/60 border-black/10 text-black';

    return (
      <motion.div layout className={containerClass}>
        <video
          ref={internalRef}
          autoPlay
          muted={isLocal}
          playsInline
          onPlaying={() => setIsPlaying(true)}
          className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${!isPlaying && !noVideo ? "opacity-0" : "opacity-100"}`}
        />

        {/* Skeleton Loader */}
        {!isPlaying && !noVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse z-10">
            <div className="w-16 h-16 rounded-full bg-border flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Fallback if no video stream */}
        {noVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <User className="w-10 h-10 text-primary/60" />
            </div>
          </div>
        )}

        {theme === 'dark' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-20" />
        )}
        
        <div className={`absolute bottom-4 left-4 backdrop-blur-xl border px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg z-30 ${labelBgClass}`}>
          {label}
          {isMuted !== undefined &&
            (isMuted ? (
              <MicOff className="text-red-500 w-3.5 h-3.5" />
            ) : (
              <Mic className="text-green-500 w-3.5 h-3.5" />
            ))}
        </div>
      </motion.div>
    );
  },
);
