import { Home, Calendar, Users, Video, Settings, PlayCircle, ChevronDown, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, NavLink } from 'react-router-dom';

const avatarJohn = "/download.jpg";

const menu = [
  { icon: Home, label: "Home", key: "home", path: '/' },
  { icon: Video, label: "Meetings", key: "meetings", path: '/meetings' },
  { icon: Calendar, label: "Calendar", key: "calendar", path: '/calendar' },
  { icon: Users, label: "Contacts", key: "contacts", path: '/contacts' },
  { icon: PlayCircle, label: "Recordings", key: "recordings", path: '/recordings' },
  { icon: Settings, label: "Settings", key: "settings", path: '/settings' },
];

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  return (
    <motion.aside 
      animate={{ width: isCollapsed && !mobileOpen ? 80 : 260 }}
      className={`sidebar shrink-0 h-screen bg-[#0B0C10] border-r border-border flex flex-col p-4 gap-6 z-[100] transition-transform duration-300 md:sticky md:top-0 fixed top-0 left-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-6 w-6 h-6 bg-primary rounded-full items-center justify-center text-white z-50 hover:bg-primary-glow transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Mobile Close Button */}
      {mobileOpen && (
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 -right-12 p-2 bg-[#11131c] rounded-xl border border-white/10 text-white shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div className={`flex items-center ${isCollapsed && !mobileOpen ? 'justify-center' : 'gap-2 px-2'} pt-2 mb-2`}>
        <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center shadow-[0_0_15px_rgba(168,85,247,0.5)] shrink-0">
          <Video className="w-5 h-5 text-white" />
        </div>
        {!(isCollapsed && !mobileOpen) && (
          <motion.h1 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-2xl font-bold tracking-tight text-white whitespace-nowrap"
          >
            Meet<span className="text-[#A855F7]">X</span>
          </motion.h1>
        )}
      </div>

      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              to={item.path} 
              key={item.key}
              title={isCollapsed ? item.label : undefined}
              className="block"
            >
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex items-center ${isCollapsed && !mobileOpen ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? "gradient-primary shadow-[0_0_20px_rgba(168,85,247,0.3)] text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!(isCollapsed && !mobileOpen) && <span className="whitespace-nowrap">{item.label}</span>}
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {!(isCollapsed && !mobileOpen) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            whileHover={{ y: -2 }}
            className="bg-card rounded-2xl p-4 relative overflow-hidden border border-border"
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-1 relative z-10">
              <Sparkles className="w-4 h-4 text-[#A855F7]" />
              <h3 className="font-semibold text-sm text-white whitespace-nowrap">Upgrade to Pro</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3 relative z-10">
              Unlock more features and higher limits.
            </p>
            <button className="w-full bg-[#A855F7] text-white text-sm font-medium py-2 rounded-xl hover:opacity-90 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] relative z-10">
              Upgrade Now
            </button>
          </motion.div>
        )}

        <div className={`flex items-center ${isCollapsed && !mobileOpen ? 'justify-center' : 'gap-3 p-2'} rounded-xl hover:bg-white/5 transition-colors cursor-pointer mt-2`}>
          <img src={avatarJohn} alt="John Doe" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/40 shrink-0" />
          {!(isCollapsed && !mobileOpen) && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">John Doe</p>
                <p className="text-xs text-gray-400 truncate">john.doe@email.com</p>
              </div>
              <div className="flex flex-col items-end">
                <ChevronDown className="w-4 h-4 text-gray-400" />
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/login'); }}
                  className="text-xs text-primary mt-1 hover:text-primary-glow whitespace-nowrap"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
