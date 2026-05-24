import { MeetingCard } from "./MeetingCard";

export function RecentMeetings() {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Recent Meetings</h3>
        <button className="text-xs text-[#A855F7] hover:text-[#D946EF] transition">View all</button>
      </div>
      <div className="divide-y divide-border/50">
        <MeetingCard title="Product Discussion" meta="Yesterday, 4:30 PM · 30 min" avatars={3} extra={3} action="view" icon="video" />
        <MeetingCard title="Weekly Team Sync" meta="Apr 30, 2024 · 45 min" avatars={3} extra={5} action="view" icon="video" />
        <MeetingCard title="Client Call" meta="Apr 28, 2024 · 60 min" avatars={3} extra={2} action="view" icon="video" />
      </div>
    </div>
  );
}
