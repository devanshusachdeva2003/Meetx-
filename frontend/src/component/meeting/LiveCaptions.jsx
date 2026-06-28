import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LiveCaptions({ captions, settings }) {
  if (!settings.enabled || captions.length === 0) return null;

  const opacityStyle = settings.opacity !== undefined ? settings.opacity : 50;
  const opacityVal = opacityStyle / 100;
  
  const getBgColor = () => {
    if (settings.background === 'transparent') return 'transparent';
    if (settings.background === 'rgba(255,255,255,0.8)') return `rgba(255, 255, 255, ${opacityVal})`;
    return `rgba(0, 0, 0, ${opacityVal})`;
  };

  const backdropStyle = settings.filter === 'blur' ? 'backdrop-blur-md' : '';
  const bgColor = getBgColor();
  const textColor = settings.background === 'rgba(255,255,255,0.8)' ? 'text-black' : `text-white`;

  return (
    <div className={`absolute left-0 right-0 z-40 pointer-events-none flex flex-col items-center px-4 ${settings.position === 'top' ? 'top-24' : 'bottom-32'}`}>
      <div className="max-w-3xl w-full flex flex-col gap-2">
        <AnimatePresence>
          {captions.map((cap) => (
            <motion.div
              key={cap.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-3 rounded-xl mx-auto w-fit max-w-full text-center shadow-lg transition-all ${backdropStyle}`}
              style={{ backgroundColor: bgColor }}
            >
              <div className={`font-semibold text-sm opacity-70 mb-1 ${textColor}`}>{cap.name}</div>
              <div className={`${settings.fontSize} ${textColor}`} style={{ color: settings.color !== '#ffffff' ? settings.color : undefined }}>
                {cap.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
