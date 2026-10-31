import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from './ui/Button';

export function PrivateConnectCard() {
  const navigate = useNavigate();

  return (
    <div className="relative group overflow-hidden bg-card border border-pink-500/20 hover:border-pink-500/40 rounded-3xl p-6 transition-all duration-300 shadow-[0_0_30px_rgba(217,70,239,0.06)] hover:shadow-[0_0_40px_rgba(217,70,239,0.15)] flex flex-col justify-between h-full min-h-[220px]">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/20 transition-all duration-500" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Private Connect <span className="text-pink-400">💕</span>
          </h2>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed max-w-[260px]">
          Chat, call, and share privately with your special one.
        </p>
      </div>

      {/* Floating Speech Bubbles & Glowing Hearts Graphic */}
      <div className="my-4 relative flex items-center justify-center py-2">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex items-center justify-center"
        >
          {/* Main Chat Bubble */}
          <div className="w-16 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-[0_0_25px_rgba(217,70,239,0.5)] transform -rotate-3">
            <Heart className="w-7 h-7 text-white fill-white animate-pulse" />
          </div>

          {/* Small background bubble */}
          <div className="absolute -left-6 bottom-0 w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center backdrop-blur-sm -rotate-12">
            <MessageSquare className="w-4 h-4 text-pink-300" />
          </div>

          {/* Floating tiny heart */}
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -top-3 -right-3 text-pink-400 text-xs"
          >
            💖
          </motion.div>
        </motion.div>
      </div>

      {/* Action Button */}
      <Button
        onClick={() => navigate('/private-connect')}
        className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#D946EF] hover:from-[#9333EA] hover:to-[#C026D3] text-white font-medium flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(217,70,239,0.35)] hover:shadow-[0_6px_25px_rgba(217,70,239,0.5)] transition-all cursor-pointer"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Open Chat</span>
      </Button>
    </div>
  );
}
