import { Calendar, Video } from "lucide-react";
import { motion } from "framer-motion";

const avatarColors = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-orange-500 to-rose-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-indigo-500",
];

export function MeetingCard({ title, meta, avatars, extra, action = "join", icon = "calendar" }) {
  const Icon = icon === "calendar" ? Calendar : Video;
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="flex items-center gap-4 py-4 group"
    >
      <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center text-primary shrink-0">
        <Icon className="w-5 h-5 text-[#A855F7]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white truncate">{title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{meta}</p>
      </div>
      <div className="flex -space-x-2 shrink-0 mr-2">
        {Array.from({ length: avatars }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} ring-2 ring-card`}
          />
        ))}
        {extra ? (
          <div className="w-8 h-8 rounded-full bg-[#1C1C24] ring-2 ring-card text-[10px] grid place-items-center font-semibold text-gray-300">
            +{extra}
          </div>
        ) : null}
      </div>
      {action === "join" && (
        <button className="text-xs font-medium px-4 py-2 rounded-xl bg-primary/10 text-[#A855F7] hover:bg-[#A855F7] hover:text-white transition-colors border border-primary/20">
          Join
        </button>
      )}
    </motion.div>
  );
}
