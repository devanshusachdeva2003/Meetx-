import { MeetingCard } from "./MeetingCard";

export function UpcomingMeetings() {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Upcoming Meetings</h2>
        <button className="text-xs text-primary hover:text-primary-glow transition">View all</button>
      </div>
      <div className="divide-y divide-border/50">
        <MeetingCard title="Design Team Standup" meta="Today, 10:30 AM" avatars={3} extra={3} />
        <MeetingCard title="Project X Review" meta="Today, 2:00 PM" avatars={3} extra={5} />
        <MeetingCard title="Marketing Sync" meta="Tomorrow, 11:00 AM" avatars={3} extra={2} />
      </div>
    </div>
  );
}
