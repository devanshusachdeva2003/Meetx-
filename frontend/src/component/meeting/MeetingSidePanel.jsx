import React, { useState, useRef } from 'react';
import { X, Mic, MicOff, Camera, CameraOff, Send, Paperclip, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import Button from '../ui/Button';
import api from '../../utils/api';

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
  socketId,
  isHost,
  onMute,
  onRemove,
  roomId,
  onAdmit,
  onDeny
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 100 MB size limit
    if (file.size > 100 * 1024 * 1024) {
      alert("File size exceeds the 100MB limit.");
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/meetings/${roomId}/share`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        // Construct a special chat message
        const msgObj = { 
          text: `Shared a file: ${res.data.file.name}`, 
          file: res.data.file,
          user: localUser 
        };
        onSendMessage(msgObj);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

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
          <div className="space-y-6">
            {/* Lobby Section */}
            {isHost && participants.filter(p => p.isLobby).length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-3 px-2">Waiting in Lobby ({participants.filter(p => p.isLobby).length})</h3>
                <ul className="space-y-2">
                  {participants.filter(p => p.isLobby).map((p) => (
                    <li key={p.socketId} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center font-bold text-sm text-yellow-500 uppercase">
                           {(p.user?.name || 'G').charAt(0)}
                         </div>
                         <span className="text-sm font-medium">{p.user?.name || 'Guest'}</span>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="danger" size="sm" className="px-3 h-8 text-xs" onClick={() => onDeny(p.socketId)}>Deny</Button>
                         <Button size="sm" className="px-3 h-8 text-xs bg-yellow-500 hover:bg-yellow-600 text-black shadow-yellow-500/30" onClick={() => onAdmit(p.socketId)}>Admit</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Active Participants */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">In Meeting ({participants.filter(p => !p.isLobby).length})</h3>
              <ul className="space-y-2">
                {participants.filter(p => !p.isLobby).map((p) => {
                  const isMe = p.socketId === socketId;
                  const displayName = p.user?.name || p.user || 'Guest';
                  const initial = (displayName || 'G').charAt(0).toUpperCase();
                  const hasStream = remoteStreams.some(r => r.socketId === p.socketId);
                  return (
                    <li key={p.socketId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                          {p.user?.avatar ? (
                            <img
                              src={p.user.avatar}
                              alt={displayName}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : null}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-[#4ea1ff] flex items-center justify-center font-bold text-xs text-white uppercase">
                            {initial}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[150px]">{displayName}{isMe ? ' (You)' : ''}</span>
                          <div className="text-[10px] text-white/60 flex items-center gap-2">
                            {isMe && <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm font-semibold">Host</span>}
                            <span>{hasStream ? 'Video' : 'No video'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-white/5">
                          {isMe ? (isLocalMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-green-400" />) : <Mic className="w-4 h-4 text-white/40" />}
                        </div>
                        <div className="p-1.5 rounded-md bg-white/5">
                          {hasStream ? <Camera className="w-4 h-4 text-white/40" /> : <CameraOff className="w-4 h-4 text-white/30" />}
                        </div>
                        {isHost && !isMe && (
                          <div className="flex gap-1 ml-1">
                            <Button variant="danger" size="sm" className="px-2 py-1 text-[10px] h-7" onClick={() => onMute(p.socketId, 'audio', !p.isMuted)}>{p.isMuted ? 'Unmute' : 'Mute'}</Button>
                            <Button variant="danger" size="sm" className="px-2 py-1 text-[10px] h-7" onClick={() => onMute(p.socketId, 'video', p.hasVideo)}>{p.hasVideo ? 'No Video' : 'On Video'}</Button>
                            <Button variant="danger" size="sm" className="px-2 py-1 text-[10px] h-7" onClick={() => onRemove(p.socketId)}>Kick</Button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages && chatMessages.length > 0 ? (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.user?.name === localUser?.name ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-white/50 mb-1">{msg.user?.name || 'Guest'}</span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${msg.user?.name === localUser?.name ? 'bg-primary text-white rounded-tr-sm' : 'bg-white/10 rounded-tl-sm'}`}>
                    {msg.file ? (
                      <div className="flex flex-col gap-2">
                        {msg.file.type === 'image' && msg.file.format !== 'pdf' ? (
                          <img src={msg.file.url} alt={msg.file.name} className="max-w-full rounded-lg" />
                        ) : (
                          <a href={msg.file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white hover:underline bg-white/10 px-3 py-2 rounded-lg">
                            <FileText size={16} />
                            <span className="truncate">Download {msg.file.name}</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      msg.text
                    )}
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
              onKeyDown={(e) => e.key === 'Enter' && onSendMessage(null)}
            />
            {isHost && (
              <>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <Button variant="none" size="icon" className="hover:bg-white/5" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </Button>
              </>
            )}
            <Button 
              variant="soft"
              size="icon"
              onClick={() => onSendMessage(null)}
            >
              <Send />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
