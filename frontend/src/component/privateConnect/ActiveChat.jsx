import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Image as ImageIcon,
  Mic,
  Square,
  Trash2,
  MoreVertical,
  Check,
  CheckCheck,
  Info,
  Heart,
  ChevronLeft,
  X,
  Phone,
  Sparkles,
  Loader2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { AudioPlayer } from './AudioPlayer';
import Button from '../ui/Button';

export function ActiveChat({
  conversation,
  messages = [],
  currentUserId,
  onSendMessage,
  onReactMessage,
  onDeleteMessage,
  onToggleDrawer,
  isDrawerOpen,
  onBackToList,
  typingUser,
  socket,
  onOpenPhotoLightbox,
}) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const other = conversation?.otherParticipant;
  const isCouple = conversation?.isCouple;
  const coupleTheme = conversation?.coupleData?.theme || 'romantic-pink';

  // Auto-scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?._id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socket && conversation?._id) {
      socket.emit('typing_start', {
        conversationId: conversation._id,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', {
          conversationId: conversation._id,
        });
      }, 2000);
    }
  };

  // Image Selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // Voice Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting voice recording:', err);
      toast.error('Microphone access denied or not supported');
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    const currentDuration = recordingSeconds;
    clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        onSendMessage({
          content: '',
          messageType: 'voice',
          mediaUrl: base64Audio,
          voiceDuration: currentDuration || 1,
        });
      };
      reader.readAsDataURL(audioBlob);

      // Stop audio tracks
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setRecordingSeconds(0);
    };

    mediaRecorderRef.current.stop();
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current.onstop = () => {
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setRecordingSeconds(0);
      audioChunksRef.current = [];
    };
    mediaRecorderRef.current.stop();
  };

  // Submit Text/Image message
  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    if (selectedImage) {
      onSendMessage({
        content: inputText.trim(),
        messageType: 'image',
        mediaUrl: selectedImage,
      });
      setSelectedImage(null);
    } else {
      onSendMessage({
        content: inputText.trim(),
        messageType: 'text',
      });
    }

    setInputText('');
    setShowEmojiPicker(false);

    if (socket && conversation?._id) {
      socket.emit('typing_stop', {
        conversationId: conversation._id,
      });
    }
  };

  // Helper for formatting time
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const emojis = ['❤️', '💕', '💖', '🥰', '😍', '😘', '✨', '🔥', '🌸', '🌹', '👍', '🎉', '😊', '😂'];

  // Theme gradient styles for Couple Mode
  const getThemeBackground = () => {
    if (!isCouple) return 'bg-background';
    if (coupleTheme === 'midnight-velvet') return 'bg-gradient-to-b from-[#130d22] via-[#0B0C10] to-[#0B0C10]';
    if (coupleTheme === 'cosmic-love') return 'bg-gradient-to-b from-[#1a0f2b] via-[#0d0915] to-[#0B0C10]';
    if (coupleTheme === 'sunset-glow') return 'bg-gradient-to-b from-[#241118] via-[#120b12] to-[#0B0C10]';
    return 'bg-gradient-to-b from-[#200b1a] via-[#100812] to-[#0B0C10]';
  };

  return (
    <div className={`flex-1 flex flex-col h-full min-w-0 relative ${getThemeBackground()} transition-colors duration-500`}>
      {/* Chat Top Header */}
      <div className="p-4 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button for mobile */}
          <button
            type="button"
            onClick={onBackToList}
            className="md:hidden p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="relative shrink-0">
            <img
              src={other?.avatar || '/download.jpg'}
              alt={other?.name}
              className={`w-11 h-11 rounded-2xl object-cover ring-2 ${
                isCouple ? 'ring-pink-500' : 'ring-primary'
              }`}
            />
            {other?.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-card" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base truncate flex items-center gap-1.5">
                {other?.name || 'Private Chat'}
              </h3>
              {isCouple && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                  <Heart className="w-3 h-3 fill-pink-500 text-pink-500" /> Couple Mode
                </span>
              )}
            </div>
            <p className="text-xs truncate">
              {typingUser ? (
                <span className="text-pink-400 font-medium animate-pulse flex items-center gap-1">
                  typing<span className="inline-block animate-bounce">...</span>
                </span>
              ) : other?.isOnline ? (
                <span className="text-green-400 font-medium">Online</span>
              ) : (
                <span className="text-gray-400">Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="none"
            onClick={() => onToggleDrawer(!isDrawerOpen)}
            className={`p-2 rounded-xl transition ${
              isDrawerOpen
                ? 'bg-primary/20 text-primary'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Conversation Details & Safety"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
        onClick={() => {
          setActiveMessageMenuId(null);
          setShowEmojiPicker(false);
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
            <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4 shadow-lg shadow-pink-500/10">
              <Heart className="w-8 h-8 fill-pink-500/30 animate-pulse" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Private Channel Ready</h4>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Your messages are protected and only accessible by the two of you. Say hi or send a photo!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.sender?._id?.toString() === currentUserId || msg.sender === currentUserId;
            const isRead = msg.readBy && msg.readBy.length > 1;

            if (msg.messageType === 'system') {
              return (
                <div key={msg._id || index} className="flex justify-center my-3">
                  <span className="px-3.5 py-1.5 rounded-full bg-card/80 border border-border/80 text-[11px] text-pink-300 font-medium shadow-sm backdrop-blur-sm">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg._id || index}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%]`}>
                  {/* Sender Avatar if not mine */}
                  {!isMine && (
                    <img
                      src={msg.sender?.avatar || '/download.jpg'}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 ring-1 ring-border"
                    />
                  )}

                  {/* Message Bubble Container */}
                  <div className="relative">
                    <div
                      className={`relative rounded-3xl p-3.5 transition-all shadow-md ${
                        msg.isDeletedForEveryone
                          ? 'bg-card/60 border border-border text-gray-400 italic text-xs'
                          : isMine
                          ? 'gradient-primary text-white rounded-br-sm shadow-[0_4px_16px_rgba(168,85,247,0.25)]'
                          : 'bg-card border border-border/80 text-white rounded-bl-sm'
                      }`}
                    >
                      {/* Photo Attachment */}
                      {msg.messageType === 'image' && msg.mediaUrl && !msg.isDeletedForEveryone && (
                        <div className="mb-2 overflow-hidden rounded-2xl cursor-pointer">
                          <img
                            src={msg.mediaUrl}
                            alt="Attachment"
                            onClick={() => onOpenPhotoLightbox(msg.mediaUrl)}
                            className="max-h-72 w-full object-cover rounded-2xl hover:scale-[1.02] transition duration-200"
                          />
                        </div>
                      )}

                      {/* Voice Note Player */}
                      {msg.messageType === 'voice' && msg.mediaUrl && !msg.isDeletedForEveryone && (
                        <AudioPlayer
                          src={msg.mediaUrl}
                          duration={msg.voiceDuration}
                          isMine={isMine}
                        />
                      )}

                      {/* Text Content */}
                      {msg.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}

                      {/* Message Footer: Timestamp and Read Receipts */}
                      <div
                        className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] ${
                          isMine ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMine && !msg.isDeletedForEveryone && (
                          <span>
                            {isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-pink-300" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reactions display badge */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div
                        className={`absolute -bottom-2.5 ${
                          isMine ? 'right-2' : 'left-2'
                        } flex items-center gap-1 bg-card border border-border/90 px-2 py-0.5 rounded-full shadow-lg text-xs z-10 cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReactMessage(msg._id, '❤️');
                        }}
                      >
                        {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji, i) => (
                          <span key={i}>{emoji}</span>
                        ))}
                        <span className="text-[10px] font-bold text-gray-300 ml-0.5">
                          {msg.reactions.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hover Quick Action Buttons */}
                  {!msg.isDeletedForEveryone && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 self-center shrink-0">
                      {/* Heart Quick React */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReactMessage(msg._id, '❤️');
                        }}
                        className="p-1.5 rounded-full bg-card hover:bg-pink-500/20 text-gray-400 hover:text-pink-400 border border-border text-xs transition"
                        title="React with Heart"
                      >
                        ❤️
                      </button>

                      {/* Message Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMessageMenuId(
                              activeMessageMenuId === msg._id ? null : msg._id
                            );
                          }}
                          className="p-1 rounded-full hover:bg-white/10 text-gray-400 transition"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {activeMessageMenuId === msg._id && (
                          <div className="absolute right-0 bottom-full mb-1 w-36 bg-card border border-border rounded-xl shadow-2xl p-1 z-30">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteMessage(msg._id, false);
                                setActiveMessageMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete for me
                            </button>
                            {isMine && (
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteMessage(msg._id, true);
                                  setActiveMessageMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete for all
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Block Notice Banner */}
      {conversation.isBlockedByMe ? (
        <div className="p-3 bg-red-950/40 border-t border-red-500/30 text-center text-xs text-red-300">
          You have blocked this user. Unblock them in details to resume chatting.
        </div>
      ) : conversation.hasBlockedMe ? (
        <div className="p-3 bg-card border-t border-border text-center text-xs text-gray-400">
          Messages cannot be sent because this user is currently unavailable.
        </div>
      ) : (
        /* Composer Bar */
        <div className="p-3 md:p-4 bg-card/90 backdrop-blur-md border-t border-border shrink-0">
          {/* Image Preview Banner */}
          {selectedImage && (
            <div className="relative inline-block mb-3 p-1.5 rounded-2xl bg-input border border-border">
              <img
                src={selectedImage}
                alt="Upload preview"
                className="h-20 w-auto rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Voice Recording Active Bar */}
          {isRecording ? (
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-2xl p-3 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-red-400 font-mono">
                  Recording: {Math.floor(recordingSeconds / 60)}:
                  {recordingSeconds % 60 < 10 ? '0' : ''}
                  {recordingSeconds % 60}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1 transition"
                >
                  <Trash2 className="w-4 h-4" /> Cancel
                </button>
                <Button
                  variant="none"
                  onClick={stopAndSendRecording}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/30"
                >
                  <Send className="w-3.5 h-3.5" /> Send Voice
                </Button>
              </div>
            </div>
          ) : (
            /* Standard Message Composer */
            <form onSubmit={handleSend} className="flex items-center gap-2 relative">
              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute left-0 bottom-full mb-2 p-2.5 rounded-2xl bg-card border border-border shadow-2xl flex flex-wrap gap-2 max-w-xs z-30">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setInputText((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg p-1.5 hover:bg-white/10 rounded-xl transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
                title="Emojis & Hearts"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Photo Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
                title="Send Photo"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Voice Note Button */}
              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 rounded-xl text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 transition"
                title="Record Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder={
                  isCouple
                    ? 'Write something sweet...'
                    : 'Type a private message...'
                }
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
              />

              {/* Send Button */}
              <Button
                type="submit"
                disabled={!inputText.trim() && !selectedImage}
                className={`p-2.5 rounded-2xl font-semibold flex items-center justify-center transition shadow-lg ${
                  inputText.trim() || selectedImage
                    ? isCouple
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-500/30'
                      : 'gradient-primary text-white shadow-purple-500/30'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed shadow-none'
                }`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
