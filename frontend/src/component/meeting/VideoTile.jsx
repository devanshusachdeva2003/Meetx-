import React, { useRef, useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

// Generate a consistent color from a name string
function nameToColor(name = "") {
  const colors = [
    "from-purple-500 to-indigo-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
    "from-violet-500 to-purple-600",
    "from-sky-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Get up to 2 initials from a name
function getInitials(label = "") {
  // Strip "(You)" suffix
  const cleaned = label.replace(/\(you\)/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const VideoTile = React.memo(
  ({
    isMain,
    stream,
    label,
    isMuted,
    isLocal,
    localVideoRef, 
    publication,
    isHandRaised,
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
      if (!node || !publication || typeof publication.setSubscribed !== 'function') return;

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
        if (typeof publication.setSubscribed === 'function') {
          publication.setSubscribed(true); // Re-subscribe when unmounting just in case
        }
      };
    }, [publication]);

    const noVideo = !stream || stream.getVideoTracks().length === 0;
    const initials = getInitials(label);
    const avatarGradient = nameToColor(label);

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

        {/* Skeleton Loader while video is loading */}
        {!isPlaying && !noVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse z-10">
            <div className={`${isMain ? 'w-24 h-24 text-3xl' : 'w-14 h-14 text-lg'} rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-bold text-white shadow-lg`}>
              {initials}
            </div>
          </div>
        )}

        {/* Avatar fallback when video is off */}
        {noVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted z-10 gap-3">
            <div className={`${isMain ? 'w-28 h-28 text-4xl' : 'w-16 h-16 text-xl'} rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-bold text-white shadow-xl ring-4 ring-white/10`}>
              {initials}
            </div>
            {isMain && (
              <p className="text-foreground font-semibold text-sm opacity-70 tracking-wide">
                {label?.replace(/\(you\)/i, "").trim()}
              </p>
            )}
          </div>
        )}

        {theme === 'dark' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-20" />
        )}

        <div className={`absolute bottom-4 left-4 backdrop-blur-xl border px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg z-30 ${labelBgClass}`}>
          {label}
          {isHandRaised && <span title="Hand raised" className="text-sm ml-1 drop-shadow-md">✋</span>}
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


