import React, { useState } from 'react';
import {
  Heart,
  Calendar,
  MapPin,
  Share2,
  Download,
  MoreVertical,
  Edit3,
  Trash2,
  Play,
  Film,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CATEGORY_COLORS = {
  Friends: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  College: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Travel: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Family: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Birthdays: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  Events: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  Achievements: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export function MemoryCard({
  memory,
  onSelect,
  onToggleFavorite,
  onEdit,
  onDelete,
  onShare,
  onDownload,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const categoryStyle =
    CATEGORY_COLORS[memory.category] || CATEGORY_COLORS.Other;

  const handleShareClick = (e) => {
    e.stopPropagation();
    onShare(memory);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    onDownload(memory);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(memory._id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      onClick={() => onSelect(memory)}
      className="group relative flex flex-col rounded-3xl bg-card border border-border/80 hover:border-primary/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] cursor-pointer"
    >
      {/* Media Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
        {memory.mediaType === 'video' ? (
          <div className="relative w-full h-full">
            <video
              src={memory.mediaUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition">
              <div className="w-11 h-11 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/40 group-hover:scale-110 transition duration-300">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
            <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-white flex items-center gap-1">
              <Film className="w-3 h-3" /> Video
            </span>
          </div>
        ) : (
          <img
            src={memory.mediaUrl}
            alt={memory.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14141C] via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Category Pill Top Left */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm ${categoryStyle}`}
          >
            {memory.category}
          </span>
        </div>

        {/* Favorite & Options Buttons Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={handleFavoriteClick}
            title={memory.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-2 rounded-xl backdrop-blur-md transition shadow-md ${
              memory.isFavorite
                ? 'bg-pink-500 text-white shadow-pink-500/30 scale-105'
                : 'bg-black/50 hover:bg-black/70 text-gray-300 hover:text-pink-400'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${memory.isFavorite ? 'fill-white' : ''}`}
            />
          </button>

          {/* More options menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-gray-300 hover:text-white backdrop-blur-md transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-36 bg-card border border-border rounded-2xl shadow-2xl p-1.5 z-30"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    setShowMenu(false);
                    onEdit(memory);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-primary" /> Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setShowMenu(false);
                    handleShareClick(e);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2 transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-400" /> Share Link
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setShowMenu(false);
                    handleDownloadClick(e);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Download
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setShowMenu(false);
                    onDelete(memory._id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
            {memory.title}
          </h3>

          {memory.description && (
            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
              {memory.description}
            </p>
          )}

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {memory.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-gray-400 border border-white/5"
                >
                  #{tag}
                </span>
              ))}
              {memory.tags.length > 3 && (
                <span className="text-[10px] text-gray-500 self-center">
                  +{memory.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Date & Location */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>
              {new Date(memory.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {memory.location && (
            <div className="flex items-center gap-1 max-w-[120px] truncate text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="truncate">{memory.location}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
