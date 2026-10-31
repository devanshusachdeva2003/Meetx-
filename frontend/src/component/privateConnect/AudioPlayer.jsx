import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export function AudioPlayer({ src, duration = 0, isMine }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error('Audio play error:', err);
      });
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-2 rounded-2xl ${isMine ? 'bg-white/10' : 'bg-black/20'} min-w-[200px] max-w-[260px]`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-all ${
          isMine
            ? 'bg-white text-purple-600 hover:bg-white/90'
            : 'bg-primary text-white hover:bg-primary-glow'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {/* Animated Sound Wave bars representation */}
        <div className="flex items-center gap-1 h-4">
          {[40, 75, 55, 90, 60, 85, 45, 95, 65, 50, 80, 40].map((h, i) => {
            const barProgress = (i / 12) * 100;
            const active = progress >= barProgress;
            return (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  active
                    ? isMine ? 'bg-white' : 'bg-pink-400'
                    : isMine ? 'bg-white/30' : 'bg-gray-600'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(25, (h * (isPlaying ? Math.random() * 0.6 + 0.6 : 1)))}%` : `${h}%`,
                }}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[11px] font-mono leading-none opacity-80">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
