import React from 'react';
import { X, Mic, MicOff, Camera, CameraOff, Send } from 'lucide-react';
import Button from '../ui/Button';

export function MeetingSidePanel({
  showChat,
  showParticipants,
  onClose,
  participants,
  remoteStreams,
  localUser,
  isLocalMuted,
  chatMessages,
  chatMessage,
  setChatMessage,
  onSendMessage,
  socketId
}) {
  if (!showChat && !showParticipants) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-[400px] z-50 bg-card/95 backdrop-blur-3xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
      <header className="p-4 flex items-center justify-between border-b border-white/5">
        <h2 className="text-lg font-bold">{showChat ? 'Chat' : 'Participants'}</h2>
        <Button variant="none" size="icon" onClick={onClose} className="hover:bg-white/5">
          <X />
        </Button>
      </header>
      
      <div className="flex-1 p-4 overflow-y-auto overscroll-contain">
        {showParticipants ? (
          <ul className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-card rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs">
                  ME
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">You (Host)</span>
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">Host</span>
                </div>
              </div>
              {isLocalMuted ? <MicOff className="text-red-500" /> : <Mic className="text-green-400" />}
            </div>
            {participants.map((p) => {
              const isMe = p.socketId === socketId;
              const displayName = p.user?.name || p.user || 'Guest';
              const initial = (displayName || 'G').charAt(0).toUpperCase();
              const hasStream = remoteStreams.some(r => r.socketId === p.socketId);
              return (
                <li key={p.socketId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                      {p.user?.avatar ? (
                        <img
                          src={p.user.avatar}
                          alt={displayName}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : null}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-[#4ea1ff] flex items-center justify-center font-bold text-sm text-white uppercase">
                        {initial}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm truncate max-w-[180px]">{displayName}{isMe ? ' (You)' : ''}</span>
                      <div className="text-[11px] text-white/60 flex items-center gap-2">
                        {isMe && <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">Host</span>}
                        <span>{hasStream ? 'Video' : 'No video'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1 rounded-md bg-white/5">
                      {isMe ? (isLocalMuted ? <MicOff className="text-red-400" /> : <Mic className="text-green-400" />) : <Mic className="text-white/40" />}
                    </div>
                    <div className="p-1 rounded-md bg-white/5">
                      {hasStream ? <Camera className="text-white/40" /> : <CameraOff className="text-white/30" />}
                    </div>
                  </div>
                </li>
              );
            })}

            {/* MOCK PARTICIPANTS FOR DEMONSTRATION */}
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <li key={`mock-list-${i}`} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-[#4ea1ff] flex items-center justify-center font-bold text-sm text-white uppercase">
                      M
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm truncate max-w-[180px]">Mock User {i}</span>
                    <div className="text-[11px] text-white/60 flex items-center gap-2">
                      <span>No video</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-md bg-white/5">
                    <MicOff className="text-red-400 w-4 h-4" />
                  </div>
                  <div className="p-1 rounded-md bg-white/5">
                    <CameraOff className="text-white/30 w-4 h-4" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-4">
            {chatMessages && chatMessages.length > 0 ? (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.user?.name === localUser?.name ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-white/50 mb-1">{msg.user?.name || 'Guest'}</span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${msg.user?.name === localUser?.name ? 'bg-primary text-white rounded-tr-sm' : 'bg-white/10 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/40 italic text-sm">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>
        )}
      </div>

      {showChat && (
        <div className="p-4 border-t border-white/5 pb-10 bg-card">
          <div className="flex gap-2 items-center bg-white/5 rounded-xl p-2 px-4 border border-white/10">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="bg-transparent flex-1 text-sm outline-none py-2"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
            />
            <Button 
              variant="soft"
              size="icon"
              onClick={onSendMessage}
            >
              <Send />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
