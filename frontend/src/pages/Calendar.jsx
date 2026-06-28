import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import ScheduledMeetingCard from '../component/ScheduledMeetingCard';
import ScheduleMeetingModal from '../component/ScheduleMeetingModal';
import api from '../utils/api';

/**
 * MeetX Calendar UI Component
 * Theme: Obsidian Flux (Dark, Glassmorphism, Neon Purple)
 */

const MeetXCalendar = () => {
  const navigate = useNavigate();
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
      const res = await api.get(`/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
      const evs = res.data.events || [];
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

  useEffect(() => {
    fetchEventsForMonth(displayDate);
  }, [displayDate]);

  const handleCreateMeeting = async (data) => {
    setCreating(true);
    const { title, description, date, startTime, endTime, isMeeting, recurrence, recurrenceEndDate } = data;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    // date comes as YYYY-MM-DD
    const [dYear, dMonth, dDate] = date.split('-').map(Number);
    
    const start = new Date(dYear, dMonth - 1, dDate, startH, startM).toISOString();
    const end = new Date(dYear, dMonth - 1, dDate, endH, endM).toISOString();
    
    try {
      await api.post('/calendar', { title, description, start, end, isMeeting, recurrence, recurrenceEndDate });
      setIsModalOpen(false);
      fetchEventsForMonth(displayDate);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        toast.error('Authentication required to create events');
      } else {
        toast.error('Could not create event');
      }
    } finally { 
      setCreating(false); 
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground font-sans relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 md:px-6 pt-16 md:pt-6 pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <CalendarIcon className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        </div>
        <Button 
          variant="none"
          size="none"
          onClick={() => setIsModalOpen(true)}
          className="p-3 bg-primary hover:bg-primary-dark rounded-2xl shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] transition-all active:scale-95"
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      </header>

      {/* Calendar Controls */}
      <div className="px-4 md:px-6 mb-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 mb-6">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="hover:bg-muted bg-card border-border" onClick={() => {
                if (currentView === 'Day') {
                  const d = new Date(year, month, selectedDate - 1);
                  setDisplayDate(d);
                  setSelectedDate(d.getDate());
                } else if (currentView === 'Week') {
                  const d = new Date(year, month, selectedDate - 7);
                  setDisplayDate(d);
                  setSelectedDate(d.getDate());
                } else {
                  setDisplayDate(new Date(year, month - 1, 1));
                }
              }}>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </Button>
              <h2 className="text-xl font-semibold">{displayDate.toLocaleString('default', { month: 'long' })} {year}</h2>
              <Button variant="outline" size="icon" className="hover:bg-muted bg-card border-border" onClick={() => {
                if (currentView === 'Day') {
                  const d = new Date(year, month, selectedDate + 1);
                  setDisplayDate(d);
                  setSelectedDate(d.getDate());
                } else if (currentView === 'Week') {
                  const d = new Date(year, month, selectedDate + 7);
                  setDisplayDate(d);
                  setSelectedDate(d.getDate());
                } else {
                  setDisplayDate(new Date(year, month + 1, 1));
                }
              }}>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Button>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-xl w-full sm:w-auto justify-center border border-border">
            {['Day', 'Week', 'Month'].map((view) => (
              <Button
                variant="none"
                size="none"
                key={view}
                onClick={() => setCurrentView(view)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentView === view ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {view}
              </Button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        {currentView === 'Month' && (
          <div className="grid grid-cols-7 gap-y-4 text-center">
            {days.map(day => (
              <span key={day} className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{day}</span>
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
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/50 ring-offset-2 ring-offset-background' 
                      : isToday 
                        ? 'text-primary font-bold border border-primary/30 bg-primary/10'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="relative z-10">{date}</span>
                  </Button>
                  {/* Event Indicators */}
                  <div className="flex gap-1 mt-1.5 h-1.5 w-full justify-center">
                    {(eventsByDate[date] || []).slice(0,3).map((e, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-primary shadow-[0_0_5px_rgba(168,85,247,0.8)]' : 'bg-green-400'}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentView === 'Week' && (
          <div className="grid grid-cols-7 gap-y-4 text-center">
            {days.map(day => (
              <span key={day} className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{day}</span>
            ))}
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(year, month, selectedDate);
              const dayOfWeek = d.getDay();
              const startOfWeek = new Date(year, month, selectedDate - dayOfWeek);
              const currentDay = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
              const dateNum = currentDay.getDate();
              const currentMonth = currentDay.getMonth();
              const currentYear = currentDay.getFullYear();
              
              const isToday = dateNum === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
              const isSelected = dateNum === selectedDate && currentMonth === month && currentYear === year;
              
              const eventsForDay = (currentMonth === month ? eventsByDate[dateNum] : []) || [];

              return (
                <div key={i} className="relative flex flex-col items-center justify-start h-14 md:h-16">
                  <Button
                    variant="none"
                    size="none"
                    onClick={() => {
                      if (currentMonth !== month) {
                        setDisplayDate(new Date(currentYear, currentMonth, 1));
                      }
                      setSelectedDate(dateNum);
                    }}
                    className={`relative w-8 h-8 md:w-10 md:h-10 flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ${
                      isSelected
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/50 ring-offset-2 ring-offset-background' 
                      : isToday 
                        ? 'text-primary font-bold border border-primary/30 bg-primary/10'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="relative z-10">{dateNum}</span>
                  </Button>
                  <div className="flex gap-1 mt-1.5 h-1.5 w-full justify-center">
                    {eventsForDay.slice(0,3).map((e, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-primary shadow-[0_0_5px_rgba(168,85,247,0.8)]' : 'bg-green-400'}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentView === 'Day' && (
          <div className="flex flex-col items-center justify-center py-6">
            <h3 className="text-3xl font-bold text-primary mb-2">
              {new Date(year, month, selectedDate).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-muted-foreground text-sm">
              {eventsByDate[selectedDate]?.length || 0} events scheduled
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Meetings Section */}
      <div className="flex-1 bg-card/60 backdrop-blur-3xl rounded-t-[40px] border-t border-border px-4 md:px-6 pt-8 pb-10 relative z-10 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-xl font-bold">Schedule for {displayDate.toLocaleString('default', { month: 'short' })} {selectedDate}</h3>
          <Button variant="outline" size="none" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border-primary/30 text-primary hover:bg-primary/10 rounded-xl">
            <Plus className="w-4 h-4" /> Schedule Meeting
          </Button>
        </div>

        <div className="space-y-4">
          {events.filter(e => {
            const d = new Date(e.start);
            return d.getDate() === selectedDate && d.getMonth() === month && d.getFullYear() === year;
          }).map((meeting) => (
            <ScheduledMeetingCard key={meeting._id} meeting={meeting} />
          ))}
          
          {events.filter(e => {
            const d = new Date(e.start);
            return d.getDate() === selectedDate && d.getMonth() === month && d.getFullYear() === year;
          }).length === 0 && (
            <div className="py-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-muted/30">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground shadow-inner">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <p className="text-foreground font-semibold">No meetings on this day</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Click below to schedule a meeting for {displayDate.toLocaleString('default', { month: 'short' })} {selectedDate}.</p>
              <Button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-primary text-white hover:bg-primary-dark shadow-[0_4px_14px_rgba(168,85,247,0.4)]">
                Schedule Meeting
              </Button>
            </div>
          )}
        </div>
      </div>

      <ScheduleMeetingModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateMeeting}
        displayDate={displayDate}
        selectedDate={selectedDate}
        year={year}
        creating={creating}
      />
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
