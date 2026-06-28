import React from 'react';
import { Image as ImageIcon, Sparkles, Ban } from 'lucide-react';
import Button from '../ui/Button';

export function VirtualBackgroundMenu({ currentBg, onSelectBg, onUploadCustom, isOpen, onClose }) {
  if (!isOpen) return null;

  const defaultBgs = [
    { id: 'office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80', name: 'Office' },
    { id: 'home', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80', name: 'Cozy Home' },
    { id: 'nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80', name: 'Forest' },
  ];

  return (
    <div className="absolute bottom-full left-[-20px] sm:left-1/2 sm:-translate-x-1/2 mb-4 bg-card/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl w-[85vw] sm:w-80 shadow-2xl z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 max-w-[320px]">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Virtual Background</h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-white">&times;</button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {/* None */}
        <button
          onClick={() => onSelectBg('none')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${currentBg === 'none' ? 'border-primary bg-primary/10' : 'border-white/10 hover:bg-white/5'}`}
        >
          <Ban className="w-6 h-6 mb-1 text-muted-foreground" />
          <span className="text-[10px] font-medium">None</span>
        </button>

        {/* Blur */}
        <button
          onClick={() => onSelectBg('blur')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${currentBg === 'blur' ? 'border-primary bg-primary/10' : 'border-white/10 hover:bg-white/5'}`}
        >
          <Sparkles className="w-6 h-6 mb-1 text-blue-400" />
          <span className="text-[10px] font-medium">Blur</span>
        </button>

        {/* Custom Upload */}
        <label className={`cursor-pointer flex flex-col items-center justify-center p-2 rounded-xl border-2 border-dashed transition-all ${currentBg?.startsWith('custom') ? 'border-primary bg-primary/10' : 'border-white/20 hover:bg-white/5 hover:border-white/40'}`}>
          <ImageIcon className="w-6 h-6 mb-1 text-muted-foreground" />
          <span className="text-[10px] font-medium">Upload</span>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const url = URL.createObjectURL(e.target.files[0]);
                onUploadCustom(url);
              }
            }} 
          />
        </label>
      </div>

      <div className="pt-2 border-t border-white/10">
        <span className="text-xs text-muted-foreground mb-2 block">Default Backgrounds</span>
        <div className="grid grid-cols-3 gap-2">
          {defaultBgs.map((bg) => (
            <button
              key={bg.id}
              onClick={() => onSelectBg(bg.url)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${currentBg === bg.url ? 'border-primary' : 'border-transparent hover:border-white/20'}`}
            >
              <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
