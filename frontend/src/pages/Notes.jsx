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

const MOCK_ACTION_ITEMS = [
  { id: 1, text: "Update the design system with new colors", assignee: "Sarah Johnson", date: "May 30, 2024", completed: true },
  { id: 2, text: "Create high-fidelity mockups for analytics page", assignee: "Michael Chen", date: "May 31, 2024", completed: false },
  { id: 3, text: "Review and approve new icon set", assignee: "Emily Davis", date: "Jun 02, 2024", completed: false }
];

const MOCK_DECISIONS = [
  "We will proceed with the new dashboard layout",
  "Implement the updated color scheme (v2.0)",
  "Adopt the new component library in next sprint"
];

const MOCK_NOTES = [
  "User feedback on the sidebar: more contrast needed",
  "Mobile responsive issues on the reports page",
  "Team feels good about the new progress \ud83c\udf89"
];

export default function Notes() {
  const { user } = useUser();
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('All Notes');
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // We fetch notes from backend, but if empty we can use some mock data for the UI
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes');
      
      // If user has no notes, let's inject a mock one for presentation purposes
      let fetchedNotes = res.data.notes || [];
      if (fetchedNotes.length === 0) {
        fetchedNotes = [
          {
            _id: 'mock-1',
            title: 'Design Team Standup',
            content: 'The design team discussed the progress of the new dashboard...',
            isPinned: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            participants: ['John', 'Sarah', 'Mike'],
            summary: 'Automatically generated from the meeting transcription.',
          },
          {
            _id: 'mock-2',
            title: 'Product Roadmap Discussion',
            content: 'Discussion about Q3 roadmap.',
            isPinned: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            _id: 'mock-3',
            title: 'Marketing Sync',
            content: 'Sync on the new campaign.',
            isPinned: false,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString(),
          }
        ];
      }
      
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
      alert("Failed to create note");
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
                    <h2 className="text-3xl font-bold text-white tracking-tight">{selectedNote.title}</h2>
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
                    <span>May 28, 2024 • 10:30 AM - 11:00 AM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>12 participants</span>
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
                      <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ml-auto flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Generated
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      The design team discussed the progress of the new dashboard, reviewed user feedback, and aligned on upcoming tasks. Key decisions were made regarding the color scheme update and new component library.
                    </p>
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
                      {MOCK_DECISIONS.map((dec, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-300">{dec}</p>
                        </div>
                      ))}
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
                      {MOCK_ACTION_ITEMS.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group py-1">
                          <div className="flex items-center gap-3">
                            <button className="text-primary">
                              {item.completed ? <CheckSquare className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-gray-500 rounded flex items-center justify-center" />}
                            </button>
                            <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item.text}</span>
                          </div>
                          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-2">
                              <img src="/download.jpg" className="w-5 h-5 rounded-full object-cover" />
                              <span className="text-xs text-gray-400">{item.assignee}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                              <CalendarIcon className="w-3 h-3" /> {item.date}
                            </div>
                          </div>
                        </div>
                      ))}
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
                      {MOCK_NOTES.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

              {/* Right Column (Sidebar Insights) */}
              <div className="w-80 shrink-0 space-y-6">
                
                {/* AI Summary Panel */}
                <div className="bg-card/40 border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-white">AI Summary</h4>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Automatically generated from the meeting transcription.
                  </p>
                  <Button variant="outline" className="w-full text-xs py-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
                    Regenerate
                  </Button>
                </div>

                {/* Meeting Details */}
                <div className="bg-card/40 border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-white">Meeting Details</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Meeting ID</div>
                      <div className="text-xs text-gray-300">784-512-988</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Host</div>
                      <div className="text-xs text-gray-300">John Doe</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Duration</div>
                      <div className="text-xs text-gray-300">30 min</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                        Participants <span>+8</span>
                      </div>
                      <div className="flex -space-x-2">
                        {[1,2,3,4].map(i => (
                          <img key={i} src="/download.jpg" className="w-7 h-7 rounded-full border-2 border-card object-cover" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files */}
                <div className="bg-card/40 border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <h4 className="text-sm font-semibold text-white">Files</h4>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white truncate">Dashboard Mockup.fig</div>
                        <div className="text-[10px] text-gray-500">2.4 MB</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white truncate">Design System v2.0.pdf</div>
                        <div className="text-[10px] text-gray-500">1.8 MB</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white truncate">User Feedback.xlsx</div>
                        <div className="text-[10px] text-gray-500">1.2 MB</div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-4 text-xs text-gray-400 hover:text-white transition-colors">
                    View all files
                  </button>
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
