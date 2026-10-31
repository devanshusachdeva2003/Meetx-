import React from 'react';
import { Heart, Search, Plus, MessageSquare, Check, CheckCheck, Clock } from 'lucide-react';
import Button from '../ui/Button';

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenSearch,
  activeTab,
  setActiveTab,
  pendingRequestsCount,
  filterText,
  setFilterText,
}) {
  const filteredConversations = conversations.filter((c) => {
    if (!filterText.trim()) return true;
    const name = c.otherParticipant?.name?.toLowerCase() || '';
    const email = c.otherParticipant?.email?.toLowerCase() || '';
    return name.includes(filterText.toLowerCase()) || email.includes(filterText.toLowerCase());
  });

  const coupleConversations = filteredConversations.filter((c) => c.isCouple);
  const displayList = activeTab === 'couple' ? coupleConversations : filteredConversations;

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border shrink-0 w-full md:w-80 lg:w-96 select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Private Connect</h2>
          </div>

          <Button
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-input border border-border text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-3 bg-background/60 p-1 rounded-xl border border-border/50 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'chats'
                ? 'bg-card text-white shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>All Chats</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('couple')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'couple'
                ? 'bg-gradient-to-r from-pink-500/30 to-purple-600/30 text-pink-300 border border-pink-500/30 font-semibold'
                : 'text-gray-400 hover:text-pink-300'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current text-pink-400" />
            <span>Couple</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-1.5 rounded-lg transition relative flex items-center justify-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-card text-white shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {displayList.length === 0 ? (
          <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
              {activeTab === 'couple' ? (
                <Heart className="w-6 h-6 text-pink-500/50" />
              ) : (
                <MessageSquare className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-300">
              {activeTab === 'couple' ? 'No Couple Connection Yet' : 'No Conversations'}
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
              {activeTab === 'couple'
                ? 'Invite someone special into Couple Mode to unlock exclusive private features.'
                : 'Start a chat by searching registered MeetX members.'}
            </p>
            <Button
              variant="none"
              onClick={onOpenSearch}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Find Users
            </Button>
          </div>
        ) : (
          displayList.map((conv) => {
            const isSelected = activeConversationId === conv._id;
            const other = conv.otherParticipant;
            const isOnline = other?.isOnline;
            const lastMsg = conv.lastMessage;

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition relative group ${
                  isSelected
                    ? 'bg-primary/10 border-l-4 border-l-primary'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Avatar with online status */}
                <div className="relative shrink-0">
                  <img
                    src={other?.avatar || '/download.jpg'}
                    alt={other?.name || 'User'}
                    className={`w-12 h-12 rounded-2xl object-cover ring-2 ${
                      conv.isCouple ? 'ring-pink-500' : isSelected ? 'ring-primary' : 'ring-border'
                    }`}
                  />
                  {isOnline ? (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-card" />
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gray-500 rounded-full ring-2 ring-card" />
                  )}
                  {conv.isCouple && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] shadow-sm">
                      ❤️
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4
                      className={`text-sm font-semibold truncate flex items-center gap-1.5 ${
                        isSelected ? 'text-primary' : 'text-white'
                      }`}
                    >
                      {other?.name || 'Unknown User'}
                    </h4>
                    <span className="text-[11px] text-gray-500 shrink-0 font-medium">
                      {formatMessageTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400 truncate flex-1">
                      {lastMsg ? (
                        lastMsg.isDeletedForEveryone ? (
                          <span className="italic text-gray-500">Message was deleted</span>
                        ) : lastMsg.messageType === 'image' ? (
                          '📷 Photo'
                        ) : lastMsg.messageType === 'voice' ? (
                          '🎤 Voice message'
                        ) : lastMsg.messageType === 'couple_invite' ? (
                          '❤️ Couple invitation'
                        ) : (
                          lastMsg.content || 'Sent an attachment'
                        )
                      ) : (
                        'Tap to start chatting'
                      )}
                    </p>

                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold shadow-sm shadow-pink-500/40">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
