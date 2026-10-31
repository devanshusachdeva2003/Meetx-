import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import api from '../utils/api';
import { createSocket } from '../lib/socketClient';
import { ConversationList } from '../component/privateConnect/ConversationList';
import { ActiveChat } from '../component/privateConnect/ActiveChat';
import { UserProfileDrawer } from '../component/privateConnect/UserProfileDrawer';
import { InvitationsView } from '../component/privateConnect/InvitationsView';
import { UserSearchModal } from '../component/privateConnect/UserSearchModal';
import { ReportModal } from '../component/privateConnect/ReportModal';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PrivateConnect() {
  const { user } = useUser();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [invitations, setInvitations] = useState({ incoming: [], outgoing: [] });
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'couple' | 'requests'
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [reportUser, setReportUser] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [isRespondingInviteId, setIsRespondingInviteId] = useState(null);

  const socketRef = useRef(null);

  const activeConversation = conversations.find(
    (c) => c._id === activeConversationId
  );

  // Fetch initial conversations and invitations
  const fetchData = async () => {
    try {
      const [convRes, inviteRes] = await Promise.all([
        api.get('/private-connect/conversations'),
        api.get('/private-connect/invitations'),
      ]);
      setConversations(convRes.data.conversations || []);
      setInvitations(inviteRes.data || { incoming: [], outgoing: [] });

      // Automatically select first conversation if none selected and on desktop
      if (!activeConversationId && convRes.data.conversations?.length > 0 && window.innerWidth >= 768) {
        setActiveConversationId(convRes.data.conversations[0]._id);
      }
    } catch (err) {
      console.error('Error fetching Private Connect data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Socket.io Connection & Events
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    const socket = createSocket(socketUrl, token);
    socketRef.current = socket;

    socket.on('connect', () => {
      // Re-join active conversation if selected
      if (activeConversationId) {
        socket.emit('join_conversation', activeConversationId);
      }
    });

    // New Message event
    socket.on('new_message', ({ message, conversationId }) => {
      if (conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        // Mark message as read immediately since user is in active chat
        api.post(`/private-connect/conversations/${conversationId}/read`).catch(() => {});
      }

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId) {
            return {
              ...c,
              lastMessage: message,
              lastMessageAt: message.createdAt,
              unreadCount:
                c._id === activeConversationId
                  ? 0
                  : (c.unreadCount || 0) + (message.sender._id !== user?.id ? 1 : 0),
            };
          }
          return c;
        })
      );
    });

    // Messages marked read
    socket.on('messages_marked_read', ({ conversationId, messageIds }) => {
      if (conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (!messageIds || messageIds.includes(m._id)) {
              return {
                ...m,
                readBy: m.readBy?.includes(user?.id)
                  ? m.readBy
                  : [...(m.readBy || []), 'partner_id'],
              };
            }
            return m;
          })
        );
      }
    });

    // Reaction update
    socket.on('message_reaction', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    });

    // Message deleted
    socket.on('message_deleted', ({ messageId, forEveryone }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId && forEveryone) {
            return {
              ...m,
              isDeletedForEveryone: true,
              content: 'This message was deleted',
              mediaUrl: null,
            };
          }
          return m;
        })
      );
    });

    // Typing indicators
    socket.on('user_typing', ({ conversationId, isTyping, userName }) => {
      if (conversationId === activeConversationId) {
        setTypingUser(isTyping ? userName || 'Partner' : null);
      }
    });

    // Online status
    socket.on('user_status', ({ userId, status }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.otherParticipant?._id === userId) {
            return {
              ...c,
              otherParticipant: {
                ...c.otherParticipant,
                isOnline: status === 'online',
              },
            };
          }
          return c;
        })
      );
    });

    // New Invitation Received
    socket.on('invitation_received', (newInvite) => {
      setInvitations((prev) => ({
        ...prev,
        incoming: [newInvite, ...prev.incoming],
      }));
      toast.info(
        newInvite.type === 'couple'
          ? `❤️ Couple Mode request from ${newInvite.sender?.name}!`
          : `💬 Chat invite from ${newInvite.sender?.name}`
      );
    });

    // Couple Settings updated
    socket.on('couple_settings_updated', ({ conversationId, coupleData }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, coupleData } : c))
      );
    });

    // Couple disconnected
    socket.on('couple_disconnected', ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, isCouple: false } : c))
      );
      toast.info('Couple Mode was disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [activeConversationId, user?.id]);

  // Fallback Polling (Keeps chat and requests in sync across serverless / Vercel environments)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [convRes, inviteRes] = await Promise.all([
          api.get('/private-connect/conversations'),
          api.get('/private-connect/invitations'),
        ]);
        setConversations(convRes.data.conversations || []);
        setInvitations(inviteRes.data || { incoming: [], outgoing: [] });

        if (activeConversationId) {
          const msgRes = await api.get(
            `/private-connect/conversations/${activeConversationId}/messages`
          );
          setMessages(msgRes.data.messages || []);
        }
      } catch (err) {
        // Silently ignore background polling errors
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeConversationId]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', activeConversationId);
    }

    const fetchMessages = async () => {
      try {
        const res = await api.get(
          `/private-connect/conversations/${activeConversationId}/messages`
        );
        setMessages(res.data.messages || []);

        // Clear unread count locally
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversationId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_conversation', activeConversationId);
      }
    };
  }, [activeConversationId]);

  // Actions
  const handleSendMessage = async (payload) => {
    if (!activeConversationId) return;

    try {
      const res = await api.post(
        `/private-connect/conversations/${activeConversationId}/messages`,
        payload
      );
      const newMsg = res.data.message;

      // Optimistic update
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversationId
            ? { ...c, lastMessage: newMsg, lastMessageAt: new Date() }
            : c
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    }
  };

  const handleReactMessage = async (messageId, emoji) => {
    try {
      await api.post(`/private-connect/messages/${messageId}/reactions`, { emoji });
      // Update locally
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id !== messageId) return m;
          const currentReactions = m.reactions || [];
          const exists = currentReactions.find((r) => r.userId === user?.id && r.emoji === emoji);
          let newReactions;
          if (exists) {
            newReactions = currentReactions.filter((r) => !(r.userId === user?.id && r.emoji === emoji));
          } else {
            newReactions = [...currentReactions.filter((r) => r.userId !== user?.id), { userId: user?.id, emoji }];
          }
          return { ...m, reactions: newReactions };
        })
      );
    } catch (err) {
      toast.error('Failed to react to message');
    }
  };

  const handleDeleteMessage = async (messageId, forEveryone) => {
    try {
      await api.delete(`/private-connect/messages/${messageId}`, {
        data: { forEveryone },
      });

      if (forEveryone) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, isDeletedForEveryone: true, content: 'This message was deleted', mediaUrl: null }
              : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
      toast.success('Message deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete message');
    }
  };

  const handleRespondInvitation = async (invitationId, action) => {
    try {
      setIsRespondingInviteId(invitationId);
      const res = await api.put(`/private-connect/invitations/${invitationId}`, { action });
      toast.success(res.data.message || `Invitation ${action}ed`);

      // Refresh conversations & invitations
      await fetchData();

      if (action === 'accept' && res.data.conversationId) {
        setActiveConversationId(res.data.conversationId);
        setActiveTab('chats');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} invitation`);
    } finally {
      setIsRespondingInviteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-gray-200">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-gray-400">Loading Private Connect...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden bg-background">
      <div className="flex-1 flex h-full overflow-hidden relative">
        {/* Left Column: Conversation List / Requests */}
        <div
          className={`${
            activeConversationId && activeTab !== 'requests'
              ? 'hidden md:flex'
              : 'flex'
          } flex-col h-full w-full md:w-80 lg:w-96 shrink-0 z-20`}
        >
          {activeTab === 'requests' ? (
            <div className="flex flex-col h-full bg-card border-r border-border">
              {/* Requests Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Invitations</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('chats')}
                  className="text-xs text-primary hover:text-primary-glow font-medium"
                >
                  Back to chats
                </button>
              </div>

              <InvitationsView
                invitations={invitations}
                onRespond={handleRespondInvitation}
                isRespondingId={isRespondingInviteId}
                onOpenSearch={() => setIsSearchOpen(true)}
              />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => {
                setActiveConversationId(id);
                setActiveTab('chats');
              }}
              onOpenSearch={() => setIsSearchOpen(true)}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              pendingRequestsCount={invitations.incoming?.length || 0}
              filterText={filterText}
              setFilterText={setFilterText}
            />
          )}
        </div>

        {/* Center Column: Active Chat */}
        {activeConversation ? (
          <div
            className={`${
              activeConversationId ? 'flex' : 'hidden md:flex'
            } flex-1 flex-col h-full min-w-0 z-10`}
          >
            <ActiveChat
              conversation={activeConversation}
              messages={messages}
              currentUserId={user?.id}
              onSendMessage={handleSendMessage}
              onReactMessage={handleReactMessage}
              onDeleteMessage={handleDeleteMessage}
              onToggleDrawer={setIsDrawerOpen}
              isDrawerOpen={isDrawerOpen}
              onBackToList={() => setActiveConversationId(null)}
              typingUser={typingUser}
              socket={socketRef.current}
              onOpenPhotoLightbox={setLightboxPhoto}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center flex-col text-gray-500 p-8 text-center bg-card/20">
            <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4 shadow-lg shadow-pink-500/10">
              ❤️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Private Connect</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Select a conversation from the left or search users to start a private chat or Couple Mode.
            </p>
          </div>
        )}

        {/* Right Column: User Profile & Couple Drawer */}
        {activeConversation && isDrawerOpen && (
          <UserProfileDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            conversation={activeConversation}
            currentUserId={user?.id}
            onUpdateConversation={(updated) => {
              setConversations((prev) =>
                prev.map((c) => (c._id === updated._id ? updated : c))
              );
            }}
            onOpenReport={() => setReportUser(activeConversation.otherParticipant)}
            onSelectPhoto={setLightboxPhoto}
            messages={messages}
          />
        )}
      </div>

      {/* User Search & Invite Modal */}
      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setActiveTab('chats');
        }}
        onInviteSent={fetchData}
      />

      {/* Report User Modal */}
      <ReportModal
        isOpen={!!reportUser}
        onClose={() => setReportUser(null)}
        reportedUser={reportUser}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxPhoto}
              alt="Enlarged shared photo"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
