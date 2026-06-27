import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MeetingCard } from "./MeetingCard";
import api from "../utils/api";

export function RecentMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentMeetings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/meetings?type=recent&limit=3');
        setMeetings(res.data.meetings || []);
      } catch (err) {
        console.error("Failed to fetch recent meetings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentMeetings();
  }, []);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Meetings</h2>
        <button onClick={() => navigate('/meetings')} className="text-xs text-primary hover:text-primary-glow transition">View all</button>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center p-3 rounded-xl bg-white/5 border border-white/10">
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
                meta={`${new Date(m.createdAt).toLocaleDateString()} · ${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} 
                avatars={1} 
                extra={0} 
                action="view" 
                icon="video" 
              />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No Recent Meetings</h3>
            <p className="text-white/50 text-sm max-w-[200px]">You haven't joined any meetings recently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
