import React from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  PenTool,
  Clock,
  Sparkles,
} from 'lucide-react';
import Button from '../ui/Button';

export function SavedBoardsDrawer({
  isOpen,
  onClose,
  boards = [],
  currentBoardId,
  onSelectBoard,
  onCreateNewBoard,
  onDeleteBoard,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border-l border-border h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">My Whiteboards</h3>
              <p className="text-xs text-gray-400">Save and switch between your boards</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Board Button */}
        <div className="my-4">
          <Button
            onClick={() => {
              onCreateNewBoard();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl gradient-primary hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Board</span>
          </Button>
        </div>

        {/* Boards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {boards.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No saved boards yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Your saved whiteboards will show up here.
              </p>
            </div>
          ) : (
            boards.map((b) => {
              const isActive = b._id === currentBoardId;
              return (
                <div
                  key={b._id}
                  onClick={() => {
                    onSelectBoard(b._id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer group flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-primary/20 border-primary shadow-md shadow-primary/10'
                      : 'bg-input/30 hover:bg-input border-border/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-primary' : 'text-white'
                      }`}
                    >
                      {b.title || 'Untitled Whiteboard'}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                      <Clock className="w-3 h-3 text-pink-400" />
                      <span>
                        {new Date(b.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBoard(b._id);
                    }}
                    className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                    title="Delete board"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
