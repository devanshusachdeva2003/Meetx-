import React from 'react';
import { Sparkles, Calendar, MapPin, Heart, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function OnThisDayBanner({ onThisDayMemories = [], onSelectMemory }) {
  if (!onThisDayMemories || onThisDayMemories.length === 0) return null;

  const currentYear = new Date().getFullYear();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-card border border-pink-500/30 p-6 shadow-[0_0_35px_rgba(217,70,239,0.15)] mb-8">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              On This Day <span className="text-pink-400">✨</span>
            </h3>
            <p className="text-xs text-pink-200/80">
              Rediscover your special moments captured on this exact day in previous years!
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-semibold self-start md:self-auto">
          {onThisDayMemories.length} {onThisDayMemories.length === 1 ? 'Memory' : 'Memories'} Found
        </span>
      </div>

      {/* Memories Carousel / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {onThisDayMemories.map((mem) => {
          const memYear = new Date(mem.date).getFullYear();
          const yearsAgo = currentYear - memYear;

          return (
            <motion.div
              key={mem._id}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => onSelectMemory(mem)}
              className="cursor-pointer group flex items-center gap-3 p-3 rounded-2xl bg-background/60 hover:bg-background/90 border border-border/80 hover:border-pink-500/40 transition shadow-md"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/40">
                {mem.mediaType === 'video' ? (
                  <video
                    src={mem.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={mem.mediaUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                )}
                {mem.isFavorite && (
                  <div className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-pink-400">
                    <Heart className="w-2.5 h-2.5 fill-pink-500" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="inline-block px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                  {yearsAgo > 0 ? `${yearsAgo} ${yearsAgo === 1 ? 'Year' : 'Years'} Ago` : 'Earlier'}
                </span>
                <h4 className="text-sm font-semibold text-white truncate group-hover:text-pink-300 transition">
                  {mem.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-pink-400" />
                    {new Date(mem.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {mem.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">{mem.location}</span>
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition shrink-0" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
