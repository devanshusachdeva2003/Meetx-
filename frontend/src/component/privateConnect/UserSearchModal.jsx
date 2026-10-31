import React, { useState, useEffect } from 'react';
import { Search, X, Heart, MessageSquare, Loader2, Check, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Button from '../ui/Button';

export function UserSearchModal({ isOpen, onClose, onSelectConversation, onInviteSent }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserForCouple, setSelectedUserForCouple] = useState(null);
  const [coupleMessage, setCoupleMessage] = useState('I want you to be my special one in MeetX Couple Mode ❤️');
  const [anniversaryDate, setAnniversaryDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [sendingInviteId, setSendingInviteId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setResults([]);
      setSelectedUserForCouple(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await api.get(`/private-connect/users/search?q=${encodeURIComponent(searchTerm.trim())}`);
        setResults(res.data.users || []);
      } catch (err) {
        toast.error('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, isOpen]);

  if (!isOpen) return null;

  const handleSendChatInvite = async (user) => {
    try {
      setSendingInviteId(user._id);
      const res = await api.post('/private-connect/invitations', {
        recipientId: user._id,
        type: 'chat',
        message: 'Let’s connect privately on MeetX!',
      });

      if (res.data.conversationId) {
        toast.success('Conversation opened');
        onSelectConversation(res.data.conversationId);
        onClose();
      } else {
        toast.success(`Chat invitation sent to ${user.name}`);
        if (onInviteSent) onInviteSent();
        // Update user status in list
        setResults((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, pendingInvite: { type: 'chat', isSender: true } } : u
          )
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send invite');
    } finally {
      setSendingInviteId(null);
    }
  };

  const handleSendCoupleInvite = async (e) => {
    e.preventDefault();
    if (!selectedUserForCouple) return;

    try {
      setSendingInviteId(selectedUserForCouple._id);
      await api.post('/private-connect/invitations', {
        recipientId: selectedUserForCouple._id,
        type: 'couple',
        message: coupleMessage,
        anniversaryDate: new Date(anniversaryDate),
      });

      toast.success(`Couple Mode request sent to ${selectedUserForCouple.name} ❤️`);
      setSelectedUserForCouple(null);
      if (onInviteSent) onInviteSent();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send couple request');
    } finally {
      setSendingInviteId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Find MeetX Users</h3>
              <p className="text-xs text-gray-400">Search by name or email to connect</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Couple Invite Form Modal Subview */}
        {selectedUserForCouple ? (
          <form onSubmit={handleSendCoupleInvite} className="py-4 space-y-4">
            <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center gap-3">
              <img
                src={selectedUserForCouple.avatar || '/download.jpg'}
                alt={selectedUserForCouple.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500"
              />
              <div>
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  Couple Request to {selectedUserForCouple.name} <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                </h4>
                <p className="text-xs text-pink-300">
                  Enter an exclusive couple sanctuary with anniversary tracking & custom themes.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Anniversary / Special Date
              </label>
              <input
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Sweet Note (Optional)
              </label>
              <textarea
                rows={3}
                value={coupleMessage}
                onChange={(e) => setCoupleMessage(e.target.value)}
                placeholder="Write a sweet message..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="none"
                onClick={() => setSelectedUserForCouple(null)}
                className="px-4 py-2.5 text-sm text-gray-400 hover:text-white rounded-xl"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={sendingInviteId === selectedUserForCouple._id}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-pink-500/30"
              >
                {sendingInviteId === selectedUserForCouple._id && <Loader2 className="w-4 h-4 animate-spin" />}
                <Heart className="w-4 h-4 fill-white" />
                Send Couple Request
              </Button>
            </div>
          </form>
        ) : (
          <>
            {/* Search Input */}
            <div className="relative my-4">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search by name or email address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm">Searching MeetX community...</p>
                </div>
              ) : results.length > 0 ? (
                results.map((user) => (
                  <div
                    key={user._id}
                    className="p-3 rounded-2xl bg-background/50 hover:bg-background border border-border/60 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar || '/download.jpg'}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-border"
                        />
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-card" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                          {user.name}
                          {user.isCouple && <span title="Couple Mode">❤️</span>}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user.hasConversation ? (
                        <Button
                          variant="none"
                          onClick={() => {
                            onSelectConversation(user.conversationId);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat
                        </Button>
                      ) : user.pendingInvite ? (
                        <span className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 text-xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          {user.pendingInvite.isSender ? 'Requested' : 'Invited you'}
                        </span>
                      ) : (
                        <Button
                          variant="none"
                          disabled={sendingInviteId === user._id}
                          onClick={() => handleSendChatInvite(user)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          {sendingInviteId === user._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5" />
                          )}
                          Invite
                        </Button>
                      )}

                      {/* Request Couple Mode button */}
                      {!user.isCouple && (
                        <Button
                          variant="none"
                          onClick={() => setSelectedUserForCouple(user)}
                          title="Invite to Couple Mode"
                          className="p-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 hover:text-pink-300 transition"
                        >
                          <Heart className="w-4 h-4 fill-pink-500/30" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : searchTerm.trim() ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm font-medium">No users found</p>
                  <p className="text-xs text-gray-500 mt-1">Try another name or email</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Heart className="w-8 h-8 text-pink-500/40 mx-auto mb-2 animate-bounce" />
                  <p className="text-sm font-medium text-gray-300">Find someone special</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Type a name or email to search registered MeetX users and send private chat or couple requests.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
