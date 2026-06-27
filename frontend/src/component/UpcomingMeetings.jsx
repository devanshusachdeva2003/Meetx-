import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MeetingCard } from "./MeetingCard";
import api from "../utils/api";

export function UpcomingMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcomingMeetings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/meetings?type=upcoming&limit=3');
        setMeetings(res.data.meetings || []);
      } catch (err) {
        console.error("Failed to fetch upcoming meetings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcomingMeetings();
  }, []);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Upcoming Meetings</h2>
        <button onClick={() => navigate('/meetings')} className="text-xs text-primary hover:text-primary-glow transition">View all</button>
      </div>
      <div className="divide-y divide-border/50 flex-1 flex flex-col">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center p-3 rounded-xl bg-white/5 border border-white/10 mb-2">
              <div className="w-10 h-10 rounded-full bg-white/10 mr-4"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : meetings.length > 0 ? (
          meetings.map(m => (
            <div key={m.roomId} onClick={() => navigate(`/meeting/${m.roomId}`)} className="cursor-pointer">
              <MeetingCard 
                title={m.title || "Untitled Meeting"} 
                meta="Upcoming" 
                avatars={1} 
                extra={0} 
              />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No Upcoming Meetings</h3>
            <p className="text-white/50 text-sm max-w-[200px]">You have no scheduled meetings coming up.</p>
          </div>
        )}
      </div>
    </div>
  );
}
