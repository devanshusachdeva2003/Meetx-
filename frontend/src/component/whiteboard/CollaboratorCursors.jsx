import React from 'react';
import { MousePointer } from 'lucide-react';

export function CollaboratorCursors({ cursors = {}, zoom = 1, pan = { x: 0, y: 0 } }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {Object.entries(cursors).map(([socketId, cursor]) => {
        if (!cursor || cursor.x === undefined || cursor.y === undefined) return null;

        const screenX = cursor.x * zoom + pan.x;
        const screenY = cursor.y * zoom + pan.y;

        return (
          <div
            key={socketId}
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
              transition: 'transform 0.08s ease-out',
            }}
            className="absolute top-0 left-0 flex items-start gap-1"
          >
            {/* Custom glowing cursor arrow */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={cursor.color || '#A855F7'}
              className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] filter"
            >
              <path
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35z"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </svg>

            {/* Name badge */}
            <span
              style={{ backgroundColor: cursor.color || '#A855F7' }}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg whitespace-nowrap -mt-1 ml-1"
            >
              {cursor.name || 'Collaborator'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
