import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import Button from '../ui/Button';
import { toast } from 'sonner';

export function MeetingWhiteboard({ onClose, onSave, store }) {
  const [Tldraw, setTldraw] = useState(null);
  
  useEffect(() => {
    // Dynamic import to prevent crash if not installed
    import('@tldraw/tldraw').then((mod) => {
      import('@tldraw/tldraw/tldraw.css').catch(() => {});
      setTldraw(() => mod.Tldraw);
    }).catch(e => {
      console.error(e);
      toast.error('Whiteboard package not loaded. Run npm install @tldraw/tldraw');
    });
  }, []);

  return (
    <div className="absolute inset-0 m-4 md:m-8 bg-card/95 backdrop-blur-3xl border border-white/10 rounded-3xl z-40 flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8">
      <header className="p-4 flex items-center justify-between border-b border-white/10 bg-white/5 absolute top-0 w-full z-10 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <h2 className="text-xl font-bold drop-shadow-md">Collaborative Whiteboard</h2>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs font-bold rounded-md shadow-sm">Live</span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button variant="primary" size="sm" onClick={onSave} className="shadow-lg">
            <Save className="w-4 h-4 mr-2" /> Save to DB
          </Button>
          <Button variant="none" size="icon" onClick={onClose} className="hover:bg-white/10 ml-2 shadow-lg bg-card border border-white/10 rounded-full">
            <X />
          </Button>
        </div>
      </header>
      
      <div className="absolute inset-0 z-0" style={{ backgroundColor: '#ffffff' }}>
        {Tldraw ? (
          <Tldraw />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black">
            Loading Whiteboard...
          </div>
        )}
      </div>
    </div>
  );
}
