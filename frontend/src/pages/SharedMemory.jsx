import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Tag,
  Download,
  Share2,
  Sparkles,
  Loader2,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import Button from '../component/ui/Button';
import { CATEGORY_COLORS } from '../component/memoryWall/MemoryCard';

export default function SharedMemory() {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSharedMemory = async () => {
      try {
        setLoading(false);
        const res = await api.get(`/memories/shared/${shareToken}`);
        setMemory(res.data.memory);
      } catch (err) {
        toast.error('Shared memory not found or link has expired');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedMemory();
  }, [shareToken]);

  const handleDownload = () => {
    if (!memory?.mediaUrl) return;
    const a = document.createElement('a');
    a.href = memory.mediaUrl;
    a.download = `${memory.title.replace(/\s+/g, '_')}_memory.${
      memory.mediaType === 'video' ? 'mp4' : 'jpg'
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-gray-200">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-gray-400">Loading shared memory...</p>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-gray-200 p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-gray-500 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Memory Not Found</h2>
        <p className="text-sm text-gray-400 max-w-sm mb-6">
          This shared memory link may have expired or was set to private by its author.
        </p>
        <Button
          onClick={() => navigate('/')}
          className="gradient-primary px-6 py-2.5 rounded-xl text-white font-medium text-sm"
        >
          Go to MeetX Home
        </Button>
      </div>
    );
  }

  const categoryStyle =
    CATEGORY_COLORS[memory.category] || CATEGORY_COLORS.Other;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/30">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img src="/meetlogo.png" alt="MeetX" className="w-8 h-8 object-contain" />
          <span className="font-bold text-xl tracking-tight text-white">
            Meet<span className="text-primary">X</span>{' '}
            <span className="text-xs text-pink-400 font-normal">Memory Wall</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="none"
            onClick={handleCopyLink}
            className="p-2 md:px-3.5 md:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Share</span>
          </Button>
          <Button
            variant="none"
            onClick={handleDownload}
            className="p-2 md:px-3.5 md:py-2 rounded-xl gradient-primary text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-purple-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Download</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full p-4 md:p-8 flex-1">
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
          {/* Media Player */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            {memory.mediaType === 'video' ? (
              <video
                src={memory.mediaUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={memory.mediaUrl}
                alt={memory.title}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryStyle}`}
              >
                {memory.category}
              </span>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {new Date(memory.date).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {memory.location && (
                  <span className="flex items-center gap-1.5 text-pink-300">
                    <MapPin className="w-4 h-4 text-pink-400" />
                    {memory.location}
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {memory.title}
            </h1>

            {memory.description && (
              <p className="text-sm md:text-base text-gray-300 leading-relaxed whitespace-pre-wrap bg-input/40 p-4 md:p-5 rounded-2xl border border-border/60">
                {memory.description}
              </p>
            )}

            {memory.tags && memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {memory.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-white/5 text-xs text-gray-300 border border-border"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Attribution */}
            {memory.user && (
              <div className="pt-6 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={memory.user.avatar || '/download.jpg'}
                    alt={memory.user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/40"
                  />
                  <div>
                    <p className="text-xs text-gray-400">Shared by</p>
                    <p className="text-sm font-bold text-white">
                      {memory.user.name}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 rounded-xl gradient-primary text-white text-xs font-semibold shadow-md"
                >
                  Join MeetX
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border text-center text-xs text-gray-500">
        <p>© 2026 MeetX. Preserving moments that matter.</p>
      </footer>
    </div>
  );
}
