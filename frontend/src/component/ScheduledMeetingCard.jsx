import React from "react";
import { Clock, MapPin } from "lucide-react";
import Button from "./ui/Button";
import { useNavigate } from "react-router-dom";

const ScheduledMeetingCard = ({ meeting }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-background/40 border border-border rounded-3xl p-5 backdrop-blur-xl hover:border-primary/30 transition-colors group">
      <div className="flex gap-4">
        <div className="flex flex-col items-center justify-center bg-muted/50 rounded-2xl p-3 min-w-[70px] h-fit border border-border group-hover:border-primary/20 transition-colors">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            {new Date(meeting.start)
              .toLocaleString("en-US", { month: "short" })
              .toUpperCase()}
          </span>
          <span className="text-2xl font-bold text-foreground">
            {new Date(meeting.start).getDate()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-lg leading-tight truncate text-foreground">
              {meeting.title}
            </h4>
          </div>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {meeting.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg border border-border">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">
                {new Date(meeting.start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg border border-border">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none font-medium text-foreground">
                  {meeting.location}
                </span>
              </div>
            )}
            {meeting.meetingId && (
              <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 text-primary">
                <span className="font-bold text-[10px] tracking-widest uppercase">
                  ID:
                </span>
                <span className="font-semibold text-foreground tracking-wide">
                  {meeting.meetingId}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex -space-x-2">
              {(meeting.attendees || []).slice(0, 4).map((p, idx) => (
                <img
                  key={idx}
                  src={p.avatar || ""}
                  alt={p.name || p.email}
                  className="w-8 h-8 rounded-full border-2 border-background object-cover shadow-sm"
                />
              ))}
            </div>
            {meeting.meetingId &&
              new Date(meeting.start).toDateString() ===
                new Date().toDateString() && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                  className="px-6 py-2.5 hover:bg-primary hover:text-white hover:border-primary transition-colors"
                >
                  Join
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledMeetingCard;
