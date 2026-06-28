import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ReactionsOverlay({ reactions }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 50, scale: 0.5, x: Math.random() * 40 - 20 }}
            animate={{ opacity: [0, 1, 1, 0], y: -200, scale: [0.5, 1.2, 1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            className="absolute bottom-24 left-1/2 flex flex-col items-center drop-shadow-xl"
            style={{ 
              marginLeft: `${(Math.random() - 0.5) * 60}%`,
              transform: `translateX(-50%)`
            }}
          >
            <div className="bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-lg mb-2 text-foreground whitespace-nowrap">
              {r.name}
            </div>
            <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              {r.emoji}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
