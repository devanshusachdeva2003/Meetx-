import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Home, 
  Video, 
  Settings, 
  Mic, 
  Clock, 
  MapPin,
  MoreHorizontal,
  Search,
  Filter,
  User
} from 'lucide-react';
import Button from '../component/ui/Button';

/**
 * MeetX Calendar UI Component
 * Theme: Obsidian Flux (Dark, Glassmorphism, Neon Purple)
 */

const MeetXCalendar = () => {
  const [currentView, setCurrentView] = useState('Month');
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [events, setEvents] = useState([]);
  const [eventsByDate, setEventsByDate] = useState({});

  // display month state
  const [displayDate, setDisplayDate] = useState(() => new Date());

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstOfMonth.getDay();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // modal form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // helper: build query range for visible month
  function monthRange(d) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  async function fetchEventsForMonth(d) {
    const { start, end } = monthRange(d);
    try {
      const res = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const evs = data.events || [];
      setEvents(evs);
      const map = {};
      evs.forEach((e) => {
        const dt = new Date(e.start);
        const day = dt.getDate();
        map[day] = map[day] || [];
        map[day].push(e);
      });
      setEventsByDate(map);
    } catch (err) {
      console.error('fetchEvents error', err);
    }
  }

  useEffect(() => { fetchEventsForMonth(displayDate); }, [displayDate]);

  return (
    <div className="flex flex-col min-h-full bg-background text-white font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 md:px-6 pt-16 md:pt-6 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <CalendarIcon className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        </div>
        <Button 
          variant="none"
          size="none"
          onClick={() => setIsModalOpen(true)}
          className="p-3 bg-primary hover:bg-primary-dark rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      </header>

      {/* Calendar Controls */}
      <div className="px-4 md:px-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 mb-6">
          <div className="flex items-center gap-4">
              <Button variant="glass" size="icon" onClick={() => setDisplayDate(new Date(year, month - 1, 1))}>
                <ChevronLeft className="w-5 h-5 text-white/60" />
              </Button>
              <h2 className="text-xl font-semibold">{displayDate.toLocaleString('default', { month: 'long' })} {year}</h2>
              <Button variant="glass" size="icon" onClick={() => setDisplayDate(new Date(year, month + 1, 1))}>
                <ChevronRight className="w-5 h-5 text-white/60" />
              </Button>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl w-full sm:w-auto justify-center">
            {['Day', 'Week', 'Month'].map((view) => (
              <Button
                variant="none"
                size="none"
                key={view}
                onClick={() => setCurrentView(view)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentView === view ? 'bg-primary text-white shadow-md' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {view}
              </Button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-4 text-center">
          {days.map(day => (
            <span key={day} className="text-xs font-bold text-white/30 uppercase tracking-widest">{day}</span>
          ))}
          {/* Empty spaces for offset */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}
          {dates.map(date => {
            const isToday = date === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div key={date} className="relative flex flex-col items-center justify-start h-14 md:h-16">
                <Button
                  variant="none"
                  size="none"
                  onClick={() => setSelectedDate(date)}
                  className={`relative w-8 h-8 md:w-10 md:h-10 flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    selectedDate === date 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/50' 
                    : isToday 
                      ? 'text-primary font-bold border border-primary/30'
                      : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  <span className="relative z-10">{date}</span>
                </Button>
                {/* Event Indicators - Fixed height container prevents grid misalignment */}
                <div className="flex gap-1 mt-1.5 h-1.5 w-full justify-center">
                  {(eventsByDate[date] || []).slice(0,3).map((e, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-green-400'}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Meetings Section */}
      <div className="flex-1 bg-card rounded-t-[40px] border-t border-white/5 px-4 md:px-6 pt-8 pb-10">
          <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Upcoming Meetings</h3>
          <Button variant="none" size="none" className="text-primary text-sm font-semibold hover:underline">See all</Button>
        </div>

        <div className="space-y-4">
          {events.filter(e => new Date(e.start) >= new Date()).slice(0,6).map((meeting) => (
            <div key={meeting._id} className="bg-white/5 border border-white/5 rounded-3xl p-5 backdrop-blur-xl">
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center bg-white/5 rounded-2xl p-3 min-w-[70px] h-fit">
                  <span className="text-[10px] font-bold text-white/40 uppercase">{new Date(meeting.start).toLocaleString('en-US', { month: 'short' }).toUpperCase()}</span>
                  <span className="text-2xl font-bold">{new Date(meeting.start).getDate()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg leading-tight">{meeting.title}</h4>
                  </div>
                  <p className="text-white/40 text-sm mb-4 line-clamp-2">{meeting.description}</p>

                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-white/40 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {new Date(meeting.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{meeting.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {(meeting.attendees || []).slice(0,4).map((p, idx) => (
                        <img key={idx} src={(p.avatar || '')} alt={p.name || p.email} className="w-8 h-8 rounded-full border-2 border-card object-cover" />
                      ))}
                    </div>
                    <Button size="lg" className="px-6 py-2.5 shadow-lg shadow-primary/20">
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simple Modal Overlay Simulation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-0 sm:p-4">
          <div className="w-full md:w-[500px] bg-card rounded-t-[40px] sm:rounded-[40px] p-6 md:p-8 border-t sm:border border-primary/20 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-2 h-8 bg-primary rounded-full" />
                New Meeting
              </h2>
              <Button variant="glass" size="icon" onClick={() => setIsModalOpen(false)}>
                <Plus className="w-6 h-6 rotate-45" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <InputGroup label="Meeting Title" placeholder="Add title..." />
              <div>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Meeting title" className="w-full p-3 rounded-xl bg-white/5 outline-none text-white" />
              </div>
              <div>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description" className="w-full p-3 rounded-xl bg-white/5 outline-none text-white h-24" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button size="none" className="p-4 rounded-2xl w-full">
                  <Video className="w-5 h-5" /> Video Call
                </Button>
                <Button variant="glass" size="none" className="p-4 rounded-2xl w-full text-white/40">
                  <Mic className="w-5 h-5" /> Audio Only
                </Button>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{displayDate.toLocaleString('default', { month: 'long' })} {selectedDate}, {year}</span>
                </div>
                <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">11:00 AM - 12:00 PM</span>
                </div>
              </div>

              <Button 
                variant="none" 
                size="none"
                onClick={async () => {
                if (!newTitle) return alert('Please enter a title');
                setCreating(true);
                const start = new Date(year, month, selectedDate, 11, 0).toISOString();
                const end = new Date(year, month, selectedDate, 12, 0).toISOString();
                try {
                  const res = await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle, description: newDescription, start, end }) });
                  if (res.status === 401) { setCreating(false); return alert('Authentication required to create events'); }
                  if (!res.ok) throw new Error('Create failed');
                  const data = await res.json();
                  setIsModalOpen(false);
                  setNewTitle(''); setNewDescription('');
                  // refresh events for month
                  fetchEventsForMonth(displayDate);
                } catch (err) {
                  console.error(err);
                  alert('Could not create event');
                } finally { setCreating(false); }
              }} className="w-full bg-primary py-5 rounded-3xl font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-primary-dark transition-all">
                {creating ? 'Scheduling...' : 'Schedule Meeting'}
                <span className="text-xl">🚀</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, placeholder }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">{label}</label>
    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between focus-within:border-primary/50 transition-all">
      <input type="text" placeholder={placeholder} className="bg-transparent outline-none flex-1 text-white placeholder:text-white/20" />
      <Settings className="w-4 h-4 text-white/20" />
    </div>
  </div>
);

export default MeetXCalendar;
