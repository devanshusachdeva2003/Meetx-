import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MeetingCard } from "./MeetingCard";
import api from "../utils/api";

export function UpcomingMeetings() {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await api.get('/meetings');
        // Currently we don't have a scheduledAt field, so we just assume no upcoming meetings
        // If we added one, we would filter: m => new Date(m.scheduledAt) > new Date()
        setMeetings([]); 
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeetings();
  }, []);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Upcoming Meetings</h2>
        <button onClick={() => navigate('/meetings')} className="text-xs text-primary hover:text-primary-glow transition">View all</button>
      </div>
      <div className="divide-y divide-border/50">
        {meetings.length > 0 ? (
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
          <p className="text-gray-400 text-sm">No upcoming meetings scheduled.</p>
        )}
      </div>
    </div>
  );
}
