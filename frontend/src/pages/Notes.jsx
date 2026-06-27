import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Star, Clock, Users, Share, MoreHorizontal, 
  Calendar as CalendarIcon, AlignLeft, Bold, Italic, Underline, 
  Strikethrough, List, ListOrdered, Link2, Code, Quote, CheckSquare, 
  Image as ImageIcon, Sparkles, FileText, CheckCircle, Circle, Plus
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import Button from '../component/ui/Button';
import api from '../utils/api';
import { toast } from 'sonner';

export default function Notes() {
  const { user } = useUser();
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('All Notes');
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newDecision, setNewDecision] = useState('');
  const [newActionText, setNewActionText] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');
  const [newGeneralNote, setNewGeneralNote] = useState('');

  // Note Update Helper
  const updateNoteData = async (updates) => {
    if (!selectedNote || selectedNote._id.startsWith('mock')) return;
    try {
      // Optimistic Update
      const updatedNote = { ...selectedNote, ...updates };
      setSelectedNote(updatedNote);
      setNotes(notes.map(n => n._id === updatedNote._id ? updatedNote : n));
      
      // API call
      await api.put(`/notes/${selectedNote._id}`, updates);
    } catch (e) {
      console.error('Failed to update note:', e);
    }
  };

  // We fetch notes from backend, but if empty we can use some mock data for the UI
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes');
      
      let fetchedNotes = res.data.notes || [];
      setNotes(fetchedNotes);
      setSelectedNote(fetchedNotes[0]);
    } catch (e) {
      console.error("Failed to fetch notes", e);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    try {
      const res = await api.post('/notes', {
        title: 'New Note',
        content: '',
        isPinned: false
      });
      setNotes([res.data.note, ...notes]);
      setSelectedNote(res.data.note);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create note");
    }
  };

  const togglePin = async (note) => {
    try {
      // Optimistic update
      const updatedNotes = notes.map(n => n._id === note._id ? { ...n, isPinned: !n.isPinned } : n);
      setNotes(updatedNotes);
      if (selectedNote?._id === note._id) {
        setSelectedNote({ ...selectedNote, isPinned: !selectedNote.isPinned });
      }
      
      // We only call API if it's a real note
      if (!note._id.startsWith('mock')) {
        await api.put(`/notes/${note._id}`, { isPinned: !note.isPinned });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pinnedNotes = notes.filter(n => n.isPinned);
  const recentNotes = notes.filter(n => !n.isPinned);

  return (
    <div className="flex h-full overflow-hidden text-gray-200">
      
      {/* Left Sidebar - Notes List */}
      <div className="w-80 border-r border-border/50 flex flex-col bg-background/50 h-full">
        <div className="p-6 pb-4">
          <h1 className="text-3xl font-bold text-white mb-2">Notes</h1>
          <p className="text-xs text-gray-400 mb-6">All your meeting notes, summaries and ideas in one place.</p>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <button className="p-2.5 bg-card/50 border border-border rounded-xl hover:bg-white/5 transition-colors">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-6 border-b border-border/50">
            {['All Notes', 'Pinned', 'Shared', 'Trash'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs font-medium transition-colors relative ${
                  activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-4">Loading notes...</div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedNotes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between px-2 mb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <Star className="w-3.5 h-3.5" /> Pinned
                    </div>
                    <span className="text-xs text-gray-500">{pinnedNotes.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {pinnedNotes.map(note => (
                      <NoteCard 
                        key={note._id} 
                        note={note} 
                        isSelected={selectedNote?._id === note._id}
                        onClick={() => setSelectedNote(note)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Notes Section */}
              {recentNotes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Recent Notes
                    </div>
                    <span className="text-xs text-gray-500">{recentNotes.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {recentNotes.map(note => (
                      <NoteCard 
                        key={note._id} 
                        note={note} 
                        isSelected={selectedNote?._id === note._id}
                        onClick={() => setSelectedNote(note)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <button className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                  View all notes <MoreHorizontal className="w-4 h-4 ml-1" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Main Area - Note Editor */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0a0b]">
        {/* Header toolbar */}
        <div className="h-16 border-b border-border/50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search within note..." 
                className="bg-card/30 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-white w-48 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 border border-border rounded-md px-2 py-1 bg-card/30">
              <span className="font-mono">⌘</span>K
            </div>
          </div>
          <Button onClick={createNote} size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-lg text-xs py-1.5">
            <Plus className="w-4 h-4 mr-1" /> New Note
          </Button>
        </div>

        {selectedNote ? (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-8 flex gap-8">
              
              {/* Left Column (Editor Content) */}
              <div className="flex-1 min-w-0">
                {/* Note Title Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <input
                      value={selectedNote.title || ''}
                      onChange={(e) => updateNoteData({ title: e.target.value })}
                      className="text-3xl font-bold text-white tracking-tight bg-transparent border-none outline-none focus:ring-0 placeholder-gray-500 w-full p-0 m-0"
                      placeholder="Note Title"
                    />
                    <button onClick={() => togglePin(selectedNote)}>
                      <Star className={`w-6 h-6 ${selectedNote.isPinned ? 'text-primary fill-primary' : 'text-gray-500 hover:text-gray-400'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">Saved 2m ago</span>
                    <div className="flex -space-x-2">
                      <img src="/download.jpg" className="w-8 h-8 rounded-full border-2 border-[#0a0a0b] object-cover" />
                      <div className="w-8 h-8 rounded-full border-2 border-[#0a0a0b] bg-gray-800 flex items-center justify-center text-[10px] text-white font-medium z-10">+2</div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs h-8 border-border">
                      <Share className="w-3.5 h-3.5 mr-1.5" /> Share
                    </Button>
                    <button className="text-gray-400 hover:text-white p-1">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400 mb-8 pb-6 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(selectedNote.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{selectedNote.participants?.length || 0} participants</span>
                  </div>
                </div>

                {/* Editor Toolbar (Mock) */}
                <div className="flex items-center gap-1 mb-8 bg-card/40 border border-border rounded-xl p-1.5 overflow-x-auto">
                  <select className="bg-transparent text-sm text-gray-300 outline-none px-2 py-1 border-r border-border cursor-pointer">
                    <option>Heading 1</option>
                    <option>Heading 2</option>
                    <option>Paragraph</option>
                  </select>
                  <div className="flex items-center px-2 border-r border-border gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><Bold className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><Italic className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><Underline className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><Strikethrough className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center px-2 border-r border-border gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><List className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><ListOrdered className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><CheckSquare className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center px-2 border-r border-border gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><Link2 className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><Code className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><Quote className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><ImageIcon className="w-4 h-4" /></button>
                  </div>
                  <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded ml-auto"><AlignLeft className="w-4 h-4" /></button>
                </div>

                {/* Content Area */}
                <div className="space-y-10">
                  {/* Meeting Summary */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Meeting Summary</h3>
                    </div>
                    <textarea 
                      value={selectedNote.content || ''}
                      onChange={(e) => updateNoteData({ content: e.target.value })}
                      placeholder="Write your meeting summary or general content here..."
                      className="w-full min-h-[100px] bg-card/30 border border-border rounded-xl p-4 text-sm text-gray-300 outline-none focus:border-primary/50 transition-colors resize-y"
                    />
                  </div>

                  {/* Key Decisions */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Key Decisions</h3>
                    </div>
                    <div className="space-y-3">
                      {(selectedNote.decisions || []).map((dec, i) => (
                        <div key={i} className="flex items-start gap-3 group">
                          <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-300 flex-1">{dec}</p>
                          <button onClick={() => {
                            const newDecisions = [...(selectedNote.decisions || [])];
                            newDecisions.splice(i, 1);
                            updateNoteData({ decisions: newDecisions });
                          }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                            Delete
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          value={newDecision} 
                          onChange={(e) => setNewDecision(e.target.value)}
                          onKeyDown={(e) => {
                            if(e.key === 'Enter' && newDecision.trim()) {
                              updateNoteData({ decisions: [...(selectedNote.decisions || []), newDecision.trim()] });
                              setNewDecision('');
                            }
                          }}
                          placeholder="Add a new decision..."
                          className="flex-1 bg-card/30 border border-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                        />
                        <Button size="sm" onClick={() => {
                          if(newDecision.trim()) {
                            updateNoteData({ decisions: [...(selectedNote.decisions || []), newDecision.trim()] });
                            setNewDecision('');
                          }
                        }}>Add</Button>
                      </div>
                    </div>
                  </div>

                  {/* Action Items */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Action Items</h3>
                    </div>
                    <div className="space-y-3">
                      {(selectedNote.actionItems || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between group py-1">
                          <div className="flex items-center gap-3 flex-1">
                            <button className="text-primary" onClick={() => {
                              const newActions = [...(selectedNote.actionItems || [])];
                              newActions[i] = { ...newActions[i], completed: !newActions[i].completed };
                              updateNoteData({ actionItems: newActions });
                            }}>
                              {item.completed ? <CheckSquare className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-gray-500 rounded flex items-center justify-center" />}
                            </button>
                            <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item.text}</span>
                          </div>
                          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {
                              const newActions = [...(selectedNote.actionItems || [])];
                              newActions.splice(i, 1);
                              updateNoteData({ actionItems: newActions });
                            }} className="text-xs text-red-400 hover:text-red-300 mr-2">Delete</button>
                            {item.assignee && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{item.assignee}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          value={newActionText} 
                          onChange={(e) => setNewActionText(e.target.value)}
                          placeholder="New action item..."
                          className="flex-1 bg-card/30 border border-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                        />
                        <input 
                          value={newActionAssignee} 
                          onChange={(e) => setNewActionAssignee(e.target.value)}
                          placeholder="Assignee (opt)"
                          className="w-32 bg-card/30 border border-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                        />
                        <Button size="sm" onClick={() => {
                          if(newActionText.trim()) {
                            updateNoteData({ actionItems: [...(selectedNote.actionItems || []), { text: newActionText.trim(), assignee: newActionAssignee.trim(), completed: false }] });
                            setNewActionText('');
                            setNewActionAssignee('');
                          }
                        }}>Add</Button>
                      </div>
                    </div>
                  </div>

                  {/* General Notes */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <List className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Notes</h3>
                    </div>
                    <ul className="space-y-2 list-disc list-inside text-sm text-gray-300">
                      {(selectedNote.generalNotes || []).map((note, i) => (
                        <li key={i} className="group flex justify-between items-start">
                          <span className="flex-1">{note}</span>
                          <button onClick={() => {
                            const newNotes = [...(selectedNote.generalNotes || [])];
                            newNotes.splice(i, 1);
                            updateNoteData({ generalNotes: newNotes });
                          }} className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 ml-4 transition-opacity">
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2 mt-4">
                      <input 
                        value={newGeneralNote} 
                        onChange={(e) => setNewGeneralNote(e.target.value)}
                        onKeyDown={(e) => {
                          if(e.key === 'Enter' && newGeneralNote.trim()) {
                            updateNoteData({ generalNotes: [...(selectedNote.generalNotes || []), newGeneralNote.trim()] });
                            setNewGeneralNote('');
                          }
                        }}
                        placeholder="Add a new note..."
                        className="flex-1 bg-card/30 border border-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                      />
                      <Button size="sm" onClick={() => {
                        if(newGeneralNote.trim()) {
                          updateNoteData({ generalNotes: [...(selectedNote.generalNotes || []), newGeneralNote.trim()] });
                          setNewGeneralNote('');
                        }
                      }}>Add</Button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column (Sidebar Insights) */}
              <div className="w-80 shrink-0 space-y-6 hidden lg:block">
                
                {/* Note Details */}
                <div className="bg-card/40 border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-white">Note Details</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Created At</div>
                      <div className="text-xs text-gray-300">{new Date(selectedNote.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Last Updated</div>
                      <div className="text-xs text-gray-300">{new Date(selectedNote.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a note to view its details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, isSelected, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer transition-all border ${
        isSelected 
          ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
          : 'bg-card/50 border-border hover:border-white/10 hover:bg-card'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-white truncate max-w-[150px]">{note.title}</h3>
        </div>
        {note.isPinned && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0 mt-1" />}
      </div>
      
      <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3 ml-9">
        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        <span>•</span>
        <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="flex items-center justify-between ml-9">
        <div className="text-[10px] text-gray-500">
          {note.participants?.length || 5} participants
        </div>
      </div>
      
      {note.summary && (
        <div className="mt-3 ml-9">
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
            AI Summary
          </span>
        </div>
      )}
    </div>
  );
}
