import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Clock, MoreHorizontal, BarChart2, Megaphone, Map, Presentation, Users, Video, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../component/ui/Button';
import { useUser } from '../context/UserContext';

export default function Meetings() {
  const [activeTab, setActiveTab] = useState('Past');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meetings');
      setMeetings(res.data.meetings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createNewMeeting = async (e) => {
    e.preventDefault();
    if (!newMeetingTitle.trim()) return;

    try {
      setCreating(true);
      const response = await api.post('/meetings', { title: newMeetingTitle.trim() });
      const newId = response.data.meeting.roomId;
      setIsModalOpen(false);
      setNewMeetingTitle('');
      navigate(`/meeting/${newId}`);
    } catch (err) {
      console.error("Failed to create meeting", err);
      alert("Failed to create meeting.");
    } finally {
      setCreating(false);
    }
  };

  const joinMeeting = (roomId) => {
    navigate(`/meeting/${roomId}`);
  };

  // Derived state
  const filteredMeetings = meetings.filter(m => 
    (m.title || 'Untitled Meeting').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const personalRoomId = user?.name ? `${user.name.toLowerCase().replace(/\s+/g, '-')}-room` : 'my-personal-room';

  return (
    <div className="flex-1 min-w-0 px-4 py-8 md:px-8 md:py-10 flex flex-col gap-8 h-full overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Meetings</h1>
          <p className="text-sm text-gray-400">View and manage your scheduled sessions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search meetings..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm text-white w-64 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Plus className="w-4 h-4 mr-1" />
            New Meeting
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-border/50">
        {['Past', 'Upcoming', 'Personal Room'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 pb-10">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <p className="text-gray-400">Loading meetings...</p>
          </div>
        ) : activeTab === 'Personal Room' ? (
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{user?.name}'s Personal Room</h3>
              <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Permanent
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-6">Your personal room is always available at the same URL. You can use this for quick, ad-hoc meetings.</p>
            <div className="flex items-center gap-3">
              <Button onClick={() => joinMeeting(personalRoomId)}>Join Room</Button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/meeting/${personalRoomId}`);
                  alert("Link copied to clipboard!");
                }}
                className="px-4 py-2 text-sm font-semibold text-primary hover:text-primary-glow transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        ) : activeTab === 'Upcoming' ? (
          <div className="flex flex-col items-center justify-center p-16 bg-card border border-border rounded-2xl">
            <Calendar className="w-12 h-12 text-gray-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No upcoming meetings</h3>
            <p className="text-gray-400 mb-6 text-center max-w-sm">You don't have any future meetings scheduled yet.</p>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-card border border-border rounded-2xl">
            <Video className="w-12 h-12 text-gray-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No past meetings</h3>
            <p className="text-gray-400 mb-6 text-center max-w-sm">
              {searchQuery ? "No meetings match your search." : "Create your first meeting to start collaborating with your team."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create Meeting
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Featured Card (Latest Meeting) */}
            <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{filteredMeetings[0].title || 'Untitled Meeting'}</h3>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400 mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(filteredMeetings[0].createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(filteredMeetings[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    <img src="/download.jpg" alt="Host" className="w-8 h-8 rounded-full border-2 border-card object-cover" />
                  </div>
                  <div className="ml-4 text-sm text-gray-400">
                    Host
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={() => joinMeeting(filteredMeetings[0].roomId)}>Rejoin</Button>
                </div>
              </div>
            </div>

            {/* Grid of standard cards */}
            {filteredMeetings.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredMeetings.slice(1).map((m, idx) => (
                  <div key={m.roomId} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                        {idx % 4 === 0 && <BarChart2 className="w-5 h-5 text-gray-300" />}
                        {idx % 4 === 1 && <Megaphone className="w-5 h-5 text-gray-300" />}
                        {idx % 4 === 2 && <Map className="w-5 h-5 text-primary/70" />}
                        {idx % 4 === 3 && <Presentation className="w-5 h-5 text-primary/70" />}
                      </div>
                      <button className="text-gray-500 hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1 truncate" title={m.title || 'Untitled Meeting'}>{m.title || 'Untitled Meeting'}</h4>
                      <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <button onClick={() => joinMeeting(m.roomId)} className="text-sm font-semibold text-white hover:text-primary transition-colors">Rejoin</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Create New Meeting</h2>
            <form onSubmit={createNewMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Meeting Title</label>
                <input 
                  type="text" 
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="e.g. Weekly Sync"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!newMeetingTitle.trim() || creating}>
                  {creating ? 'Creating...' : 'Create & Join'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
