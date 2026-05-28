import React from 'react';
import { Lock, Copy } from 'lucide-react';

export function MeetingHeader({ id, onLeave }) {
  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <header className="absolute top-0 inset-x-0 flex items-center justify-between px-4 md:px-6 py-4 bg-card/60 backdrop-blur-md z-40 border-b border-white/5 shadow-lg">
      <div className="flex items-center gap-2 md:gap-4 bg-white/5 px-3 md:px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md flex-1 min-w-0 mr-4">
        <Lock className="text-primary w-4 h-4 shrink-0" />
        <h1 className="text-sm font-semibold truncate tracking-wide min-w-0">Meeting: {id}</h1>
        <button onClick={handleCopy} className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-1 shrink-0">
          <Copy className="w-4 h-4 text-white/60 hover:text-white" />
        </button>
      </div>
      <button 
        onClick={onLeave}
        className="shrink-0 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 text-sm font-bold px-4 md:px-6 py-2.5 rounded-2xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
      >
        Leave
      </button>
    </header>
  );
}
