import React from 'react';
import { Heart, MessageSquare, Check, X, Calendar, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

export function InvitationsView({
  invitations,
  onRespond,
  isRespondingId,
  onOpenSearch,
}) {
  const { incoming = [], outgoing = [] } = invitations;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Incoming Requests Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Incoming Invitations
            {incoming.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs font-semibold">
                {incoming.length}
              </span>
            )}
          </h3>
        </div>

        {incoming.length === 0 ? (
          <div className="p-8 rounded-3xl bg-card border border-border text-center text-gray-400">
            <Heart className="w-10 h-10 text-pink-500/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-300">No incoming invitations</p>
            <p className="text-xs text-gray-500 mt-1">
              When other MeetX users invite you to chat or Couple Mode, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {incoming.map((invite) => {
              const isCouple = invite.type === 'couple';
              const isLoading = isRespondingId === invite._id;

              return (
                <div
                  key={invite._id}
                  className={`p-4 rounded-3xl border transition shadow-lg ${
                    isCouple
                      ? 'bg-gradient-to-r from-pink-950/30 to-purple-950/20 border-pink-500/40 shadow-pink-500/5'
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={invite.sender?.avatar || '/download.jpg'}
                        alt={invite.sender?.name}
                        className={`w-12 h-12 rounded-full object-cover shrink-0 ${
                          isCouple ? 'ring-2 ring-pink-500' : 'ring-1 ring-border'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-sm">
                            {invite.sender?.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                              isCouple
                                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                : 'bg-primary/20 text-primary border border-primary/30'
                            }`}
                          >
                            {isCouple ? (
                              <>
                                <Heart className="w-3 h-3 fill-pink-400" /> Couple Request
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-3 h-3" /> Chat Invite
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{invite.sender?.email}</p>

                        {invite.message && (
                          <p className="text-xs text-gray-300 mt-2 bg-background/50 p-2.5 rounded-xl border border-border/50 italic">
                            "{invite.message}"
                          </p>
                        )}

                        {isCouple && invite.anniversaryDate && (
                          <div className="flex items-center gap-1.5 text-xs text-pink-300 mt-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              Anniversary:{' '}
                              {new Date(invite.anniversaryDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="none"
                        disabled={isLoading}
                        onClick={() => onRespond(invite._id, 'accept')}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition cursor-pointer"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Accept
                      </Button>
                      <Button
                        variant="none"
                        disabled={isLoading}
                        onClick={() => onRespond(invite._id, 'decline')}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Outgoing Requests Section */}
      <div>
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          Sent Invitations ({outgoing.length})
        </h3>

        {outgoing.length === 0 ? (
          <div className="p-6 rounded-3xl bg-card border border-border text-center text-gray-400">
            <p className="text-sm">You haven't sent any invitations yet.</p>
            <Button
              variant="none"
              onClick={onOpenSearch}
              className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5"
            >
              Search & Invite Users
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {outgoing.map((invite) => (
              <div
                key={invite._id}
                className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={invite.recipient?.avatar || '/download.jpg'}
                    alt={invite.recipient?.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-border"
                  />
                  <div>
                    <h4 className="font-semibold text-white text-sm flex items-center gap-1.5">
                      {invite.recipient?.name}
                      {invite.type === 'couple' && (
                        <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                      )}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {invite.type === 'couple' ? 'Couple Mode Request' : 'Chat Invite'} • Pending
                    </p>
                  </div>
                </div>

                <Button
                  variant="none"
                  disabled={isRespondingId === invite._id}
                  onClick={() => onRespond(invite._id, 'cancel')}
                  className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition"
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
