import React, { useState } from 'react';
import {
  X,
  Heart,
  Calendar,
  ShieldAlert,
  UserX,
  Image as ImageIcon,
  Mic,
  Palette,
  Sparkles,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Button from '../ui/Button';

export function UserProfileDrawer({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onUpdateConversation,
  onOpenReport,
  onSelectPhoto,
  messages = [],
}) {
  const [isUpdatingCouple, setIsUpdatingCouple] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  if (!isOpen || !conversation) return null;

  const other = conversation.otherParticipant;
  const isCouple = conversation.isCouple;
  const coupleData = conversation.coupleData || {};

  // Calculate days together
  const calculateDaysTogether = () => {
    if (!coupleData.anniversaryDate) return 0;
    const start = new Date(coupleData.anniversaryDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysTogether = calculateDaysTogether();

  // Extract shared media
  const sharedPhotos = messages.filter((m) => m.messageType === 'image' && m.mediaUrl);
  const sharedVoiceNotes = messages.filter((m) => m.messageType === 'voice' && m.mediaUrl);

  const handleUpdateTheme = async (themeName) => {
    try {
      setIsUpdatingCouple(true);
      const res = await api.put('/private-connect/couple/settings', {
        conversationId: conversation._id,
        theme: themeName,
      });
      toast.success('Couple theme updated');
      onUpdateConversation({
        ...conversation,
        coupleData: { ...conversation.coupleData, theme: themeName },
      });
    } catch (err) {
      toast.error('Failed to update theme');
    } finally {
      setIsUpdatingCouple(false);
    }
  };

  const handleUpdateAnniversary = async (newDate) => {
    try {
      setIsUpdatingCouple(true);
      await api.put('/private-connect/couple/settings', {
        conversationId: conversation._id,
        anniversaryDate: newDate,
      });
      toast.success('Anniversary date updated');
      onUpdateConversation({
        ...conversation,
        coupleData: { ...conversation.coupleData, anniversaryDate: newDate },
      });
    } catch (err) {
      toast.error('Failed to update anniversary date');
    } finally {
      setIsUpdatingCouple(false);
    }
  };

  const handleDisconnectCouple = async () => {
    try {
      setIsDisconnecting(true);
      await api.post('/private-connect/couple/disconnect', {
        conversationId: conversation._id,
      });
      toast.success('Disconnected from Couple Mode');
      setShowDisconnectConfirm(false);
      onUpdateConversation({
        ...conversation,
        isCouple: false,
      });
    } catch (err) {
      toast.error('Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleToggleBlock = async () => {
    try {
      setIsBlocking(true);
      const action = conversation.isBlockedByMe ? 'unblock' : 'block';
      const res = await api.post('/private-connect/block', {
        conversationId: conversation._id,
        action,
      });
      toast.success(res.data.message);
      onUpdateConversation({
        ...conversation,
        isBlockedByMe: !conversation.isBlockedByMe,
      });
    } catch (err) {
      toast.error('Failed to update block status');
    } finally {
      setIsBlocking(false);
    }
  };

  const themes = [
    { id: 'romantic-pink', name: 'Rose Romance', color: 'from-pink-500 to-rose-600' },
    { id: 'midnight-velvet', name: 'Midnight Velvet', color: 'from-purple-900 to-indigo-950' },
    { id: 'cosmic-love', name: 'Cosmic Amour', color: 'from-violet-600 to-fuchsia-600' },
    { id: 'sunset-glow', name: 'Sunset Glow', color: 'from-amber-600 to-rose-500' },
  ];

  return (
    <div className="w-80 lg:w-96 border-l border-border bg-card shrink-0 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-white text-base">Details & Privacy</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* User Profile Card */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-border/50">
          <div className="relative mb-3">
            <img
              src={other?.avatar || '/download.jpg'}
              alt={other?.name}
              className={`w-20 h-20 rounded-full object-cover ring-4 ${
                isCouple ? 'ring-pink-500' : 'ring-primary'
              } shadow-xl`}
            />
            {other?.isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-card" />
            )}
          </div>
          <h4 className="text-lg font-bold text-white flex items-center gap-1.5">
            {other?.name}
            {isCouple && <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />}
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">{other?.email}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/5 text-[11px] font-medium text-gray-300">
            {other?.isOnline ? '🟢 Currently Active' : '⚪ Offline'}
          </span>
        </div>

        {/* Couple Mode Section */}
        {isCouple ? (
          <div className="p-4 rounded-3xl bg-gradient-to-br from-pink-950/40 via-purple-950/20 to-card border border-pink-500/30 shadow-lg shadow-pink-500/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Couple Mode
              </span>
              <span className="text-xs text-pink-300 font-semibold">Active Sanctuary</span>
            </div>

            {/* Anniversary Days Counter */}
            <div className="text-center py-2 bg-pink-500/10 rounded-2xl border border-pink-500/20">
              <p className="text-2xl font-black text-white flex items-center justify-center gap-1.5">
                <span>{daysTogether}</span>
                <span className="text-pink-400">Days</span>
                <Heart className="w-5 h-5 fill-pink-500 text-pink-500 animate-pulse" />
              </p>
              <p className="text-[11px] text-pink-300 mt-0.5 font-medium">Together in Love</p>
            </div>

            {/* Anniversary Date Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Anniversary Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={
                    coupleData.anniversaryDate
                      ? new Date(coupleData.anniversaryDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleUpdateAnniversary(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-input border border-border text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Couple Themes */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Chat Atmosphere
              </label>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleUpdateTheme(t.id)}
                    className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                      coupleData.theme === t.id
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-border/60 hover:border-pink-500/40 bg-input/40'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${t.color} shrink-0`} />
                    <span className="text-xs font-medium text-white truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Disconnect Button */}
            <div className="pt-2">
              <Button
                variant="none"
                onClick={() => setShowDisconnectConfirm(true)}
                className="w-full py-2 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                Disconnect Couple Mode
              </Button>
            </div>
          </div>
        ) : null}

        {/* Shared Media Gallery */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Shared Photos ({sharedPhotos.length})
          </h4>

          {sharedPhotos.length === 0 ? (
            <p className="text-xs text-gray-500 italic bg-input/40 p-3 rounded-xl text-center">
              No photos shared yet
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {sharedPhotos.map((photo) => (
                <img
                  key={photo._id}
                  src={photo.mediaUrl}
                  alt="Shared media"
                  onClick={() => onSelectPhoto(photo.mediaUrl)}
                  className="w-full h-16 rounded-xl object-cover cursor-pointer hover:opacity-80 transition ring-1 ring-border"
                />
              ))}
            </div>
          )}
        </div>

        {/* Shared Voice Clips */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" /> Voice Notes ({sharedVoiceNotes.length})
          </h4>
          <p className="text-xs text-gray-400">
            {sharedVoiceNotes.length} voice messages recorded in this chat.
          </p>
        </div>

        {/* Privacy & Safety Controls */}
        <div className="pt-4 border-t border-border/50 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Safety & Privacy
          </h4>

          <Button
            variant="none"
            disabled={isBlocking}
            onClick={handleToggleBlock}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              conversation.isBlockedByMe
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {isBlocking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserX className="w-3.5 h-3.5" />
            )}
            {conversation.isBlockedByMe ? 'Unblock User' : 'Block User'}
          </Button>

          <Button
            variant="none"
            onClick={onOpenReport}
            className="w-full py-2.5 px-3 rounded-xl bg-white/5 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Report Account
          </Button>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Disconnect Couple Mode?
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              This will return your chat to a regular private conversation and reset your anniversary tracking. You can always reconnect later.
            </p>
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="none"
                onClick={() => setShowDisconnectConfirm(false)}
                className="px-3.5 py-2 text-xs text-gray-400 hover:text-white rounded-xl"
              >
                Keep Together
              </Button>
              <Button
                variant="none"
                disabled={isDisconnecting}
                onClick={handleDisconnectCouple}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/30"
              >
                {isDisconnecting && <Loader2 className="w-3 h-3 animate-spin" />}
                Yes, Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
