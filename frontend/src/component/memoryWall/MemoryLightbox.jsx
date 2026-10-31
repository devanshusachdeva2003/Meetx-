import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Heart,
  Share2,
  Download,
  Tag,
  Edit3,
  Trash2,
  Check,
  Film,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { CATEGORY_COLORS } from './MemoryCard';

export function MemoryLightbox({
  memory,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
  onShare,
  onDownload,
}) {
  if (!memory) return null;

  const categoryStyle =
    CATEGORY_COLORS[memory.category] || CATEGORY_COLORS.Other;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row my-8 max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Preview (Left / Top) */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[480px] max-h-[50vh] md:max-h-[85vh]">
          {memory.mediaType === 'video' ? (
            <video
              src={memory.mediaUrl}
              controls
              autoPlay
              className="w-full h-full object-contain max-h-[85vh]"
            />
          ) : (
            <img
              src={memory.mediaUrl}
              alt={memory.title}
              className="w-full h-full object-contain max-h-[85vh]"
            />
          )}
        </div>

        {/* Info & Action Panel (Right / Bottom) */}
        <div className="w-full md:w-80 lg:w-96 p-6 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-border bg-card">
          <div className="space-y-4">
            {/* Header: Category & Favorite */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryStyle}`}
              >
                {memory.category}
              </span>

              <button
                type="button"
                onClick={() => onToggleFavorite(memory._id)}
                className={`p-2 rounded-xl transition ${
                  memory.isFavorite
                    ? 'bg-pink-500/20 text-pink-400'
                    : 'bg-white/5 text-gray-400 hover:text-pink-400'
                }`}
                title={memory.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`w-4 h-4 ${
                    memory.isFavorite ? 'fill-pink-500' : ''
                  }`}
                />
              </button>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white leading-snug">
              {memory.title}
            </h2>

            {/* Date & Location */}
            <div className="space-y-1.5 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>
                  {new Date(memory.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {memory.location && (
                <div className="flex items-center gap-2 text-pink-300">
                  <MapPin className="w-4 h-4 text-pink-400" />
                  <span>{memory.location}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {memory.description && (
              <div className="pt-2">
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap bg-input/40 p-3.5 rounded-2xl border border-border/50">
                  {memory.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {memory.tags && memory.tags.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {memory.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-300 border border-border"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="pt-6 border-t border-border space-y-2.5 mt-6">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="none"
                onClick={() => onShare(memory)}
                className="py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 border border-purple-500/20 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                {memory.isShared ? 'Copy Share Link' : 'Share Memory'}
              </Button>

              <Button
                variant="none"
                onClick={() => onDownload(memory)}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="none"
                onClick={() => {
                  onClose();
                  onEdit(memory);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-input hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Button>

              <Button
                variant="none"
                onClick={() => {
                  onClose();
                  onDelete(memory._id);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
