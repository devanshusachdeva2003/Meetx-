import React from 'react';
import { X } from 'lucide-react';

export const STICKY_COLORS = {
  yellow: {
    bg: 'bg-amber-400/90 text-amber-950 border-amber-500 shadow-amber-500/20',
    textarea: 'text-amber-950 placeholder-amber-950/50',
  },
  pink: {
    bg: 'bg-pink-400/90 text-pink-950 border-pink-500 shadow-pink-500/20',
    textarea: 'text-pink-950 placeholder-pink-950/50',
  },
  purple: {
    bg: 'bg-purple-400/90 text-purple-950 border-purple-500 shadow-purple-500/20',
    textarea: 'text-purple-950 placeholder-purple-950/50',
  },
  cyan: {
    bg: 'bg-cyan-400/90 text-cyan-950 border-cyan-500 shadow-cyan-500/20',
    textarea: 'text-cyan-950 placeholder-cyan-950/50',
  },
  green: {
    bg: 'bg-emerald-400/90 text-emerald-950 border-emerald-500 shadow-emerald-500/20',
    textarea: 'text-emerald-950 placeholder-emerald-950/50',
  },
};

export function StickyNote({
  note,
  onUpdateText,
  onDelete,
  onDragStart,
  zoom = 1,
}) {
  const colorConfig = STICKY_COLORS[note.color] || STICKY_COLORS.yellow;

  return (
    <div
      style={{
        transform: `translate(${note.x}px, ${note.y}px)`,
        width: `${(note.width || 180) * zoom}px`,
        minHeight: `${(note.height || 160) * zoom}px`,
      }}
      className={`absolute z-20 rounded-2xl p-3 border shadow-xl flex flex-col justify-between cursor-move backdrop-blur-sm transition-shadow ${colorConfig.bg}`}
      onMouseDown={(e) => {
        // Only initiate drag if not clicking the textarea or delete button
        if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
          onDragStart(e, note.id);
        }
      }}
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-black/10 handle">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
          Sticky Note
        </span>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="p-0.5 rounded-md hover:bg-black/10 transition opacity-70 hover:opacity-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <textarea
        value={note.text}
        onChange={(e) => onUpdateText(note.id, e.target.value)}
        placeholder="Type a note..."
        rows={4}
        className={`w-full flex-1 bg-transparent resize-none focus:outline-none text-xs font-medium p-1 leading-relaxed ${colorConfig.textarea}`}
      />
    </div>
  );
}
