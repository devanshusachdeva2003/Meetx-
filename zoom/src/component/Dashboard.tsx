import { Header } from "./Header";
import { StartMeetingCard } from "./StartMeetingCard";
import { JoinMeeting } from "./JoinMeeting";
import { UpcomingMeetings } from "./UpcomingMeetings";
import { RecentMeetings } from "./RecentMeetings";
import { PersonalLink } from "./PersonalLink";

export function Dashboard() {
  return (
    <main className="flex-1 min-w-0 px-8 py-10 flex flex-col gap-8 h-full">
      <Header />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <StartMeetingCard />
        </div>
        <JoinMeeting />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UpcomingMeetings />
        <RecentMeetings />
        <PersonalLink />
      </section>

      <footer className="mt-auto pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <p>© 2026 MeetX. All rights reserved.</p>
        <div className="flex gap-5">
          <a href="#" className="hover:text-white transition">Privacy Policy</a>
          <a href="#" className="hover:text-white transition">Terms of Service</a>
        </div>
      </footer>
    </main>
  );
}
