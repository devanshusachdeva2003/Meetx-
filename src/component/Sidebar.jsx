import { Home, Calendar, Users, Video, Settings, PlayCircle, ChevronDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

const avatarJohn = "/download.jpg";

const menu = [
  { icon: Home, label: "Home", key: "home", path: '/' },
  { icon: Video, label: "Meetings", key: "meetings", path: '/meetings' },
  { icon: Calendar, label: "Calendar", key: "calendar", path: '/calendar' },
  { icon: Users, label: "Contacts", key: "contacts", path: '/contacts' },
  { icon: PlayCircle, label: "Recordings", key: "recordings", path: '/recordings' },
  { icon: Settings, label: "Settings", key: "settings", path: '/settings' },
];

export function Sidebar() {
  const [active, setActive] = useState("home");
  const navigate = useNavigate();
  const location = useLocation();

  // keep active in sync with current path
  const currentPath = location.pathname;
  // derive active from pathname when component mounts / location changes
  useEffect(() => {
    const match = menu.find((m) => m.path && (currentPath === m.path || currentPath.startsWith(m.path)));
    if (match) setActive(match.key);
  }, [currentPath]);
  return (
    <aside className="sidebar w-[260px] shrink-0 h-screen sticky top-0 bg-[#0B0C10] border-r border-border flex flex-col p-5 gap-6">
      <div className="flex items-center gap-2 px-2 pt-2 mb-2">
        <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          <Video className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Meet<span className="text-[#A855F7]">X</span>
        </h1>
      </div>

      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <motion.button
              key={item.key}
              onClick={() => {
                setActive(item.key);
                if (item.path) navigate(item.path);
              }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? "gradient-primary shadow-[0_0_20px_rgba(168,85,247,0.3)] text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-card rounded-2xl p-4 relative overflow-hidden border border-border"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <Sparkles className="w-4 h-4 text-[#A855F7]" />
            <h3 className="font-semibold text-sm text-white">Upgrade to Pro</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3 relative z-10">
            Unlock more features and higher limits.
          </p>
          <button className="w-full bg-[#A855F7] text-white text-sm font-medium py-2 rounded-xl hover:opacity-90 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] relative z-10">
            Upgrade Now
          </button>
        </motion.div>

        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer mt-2">
          <img src={avatarJohn} alt="John Doe" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/40" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">John Doe</p>
            <p className="text-xs text-gray-400 truncate">john.doe@email.com</p>
          </div>
          <div className="flex flex-col items-end">
            <ChevronDown className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-primary mt-1 hover:text-primary-glow"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
