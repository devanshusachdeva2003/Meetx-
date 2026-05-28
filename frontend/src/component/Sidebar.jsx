import { Home, Calendar, Users, Video, Settings, PlayCircle, ChevronDown, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useUser } from "../context/UserContext";
import Button from "./ui/Button";

const avatarJohn = "/download.jpg";

const menu = [
  { icon: Home, label: "Home", key: "home", path: '/', public: true },
  { icon: Video, label: "Meetings", key: "meetings", path: '/meetings', public: true },
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
  const { user, logoutContext } = useUser();

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  const visibleMenu = user ? menu : menu.filter(item => item.public);

  return (
    <motion.aside 
      animate={{ width: isCollapsed && !mobileOpen ? 80 : 260 }}
      className={`sidebar shrink-0 h-screen bg-background border-r border-border flex flex-col p-4 gap-6 z-[100] transition-transform duration-300 md:sticky md:top-0 fixed top-0 left-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <Button 
        variant="none"
        size="none"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-6 w-6 h-6 bg-primary rounded-full items-center justify-center text-white z-50 hover:bg-primary-glow transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {/* Mobile Close Button */}
      {mobileOpen && (
        <Button 
          variant="none"
          size="none"
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 -right-12 p-2 bg-card rounded-xl border border-white/10 text-white shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      )}

      <div className={`flex items-center ${isCollapsed && !mobileOpen ? 'justify-center' : 'gap-2 px-2'} pt-2 mb-2`}>
        <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center shadow-[0_0_15px_rgba(168,85,247,0.5)] shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <Video className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed || mobileOpen ? (
          <span className="font-bold text-xl tracking-tight text-white whitespace-nowrap cursor-pointer" onClick={() => navigate('/')}>
            Meet<span className="text-primary">X</span>
          </span>
        ) : null}
      </div>

      <nav className="flex flex-col gap-2">
        {visibleMenu.map((item) => {
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
                  className={`relative flex items-center ${isCollapsed && !mobileOpen ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
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
        {!(isCollapsed && !mobileOpen) && user && (
          <div className="mt-auto pt-6 border-t border-border">
            <div className="bg-card rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-all duration-500 pointer-events-none" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-white">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-white/50 mb-4 relative z-10">
                Get unlimited meetings & 4K video quality.
              </p>
              <Button className="w-full bg-primary text-white hover:opacity-90 relative z-10">
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {user ? (
          <div className={`flex items-center ${isCollapsed && !mobileOpen ? 'justify-center' : 'gap-3 p-2'} rounded-xl hover:bg-white/5 transition-colors cursor-pointer mt-2`}>
            <img src={avatarJohn} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/40 shrink-0" />
            {!(isCollapsed && !mobileOpen) && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="flex flex-col items-end">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                  <Button
                    variant="none"
                    size="none"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      logoutContext();
                      navigate('/login'); 
                    }}
                    className="text-xs text-primary mt-1 hover:text-primary-glow whitespace-nowrap"
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mt-auto pt-6 border-t border-border px-2">
            <Button
              onClick={() => navigate('/login')}
              className={`w-full bg-primary text-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] flex items-center justify-center ${isCollapsed && !mobileOpen ? 'p-3' : 'py-3 px-4'}`}
            >
              {isCollapsed && !mobileOpen ? (
                <Users className="w-5 h-5 shrink-0" />
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
