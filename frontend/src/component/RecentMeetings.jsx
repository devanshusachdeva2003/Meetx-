import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MeetingCard } from "./MeetingCard";
import api from "../utils/api";

export function RecentMeetings() {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await api.get('/meetings');
        setMeetings(res.data.meetings?.slice(0, 3) || []); // Get top 3
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeetings();
  }, []);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Meetings</h2>
        <button onClick={() => navigate('/meetings')} className="text-xs text-primary hover:text-primary-glow transition">View all</button>
      </div>
      <div className="flex flex-col gap-3">
        {meetings.length > 0 ? (
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
          <p className="text-muted-foreground text-sm">No recent meetings found.</p>
        )}
      </div>
    </div>
  );
}
