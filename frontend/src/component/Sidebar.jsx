import {
  Home,
  Calendar,
  Users,
  Video,
  Settings,
  PlayCircle,
  ChevronDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import Button from "./ui/Button";

const avatarJohn = "/download.jpg";

const menu = [
  { icon: Home, label: "Home", key: "home", path: "/", public: true },
  {
    icon: Video,
    label: "Meetings",
    key: "meetings",
    path: "/meetings",
    public: true,
  },
  { icon: Calendar, label: "Calendar", key: "calendar", path: "/calendar" },
  {
    icon: FileText,
    label: "Notes",
    key: "notes",
    path: "/notes",
    public: true,
  },
  // { icon: Users, label: "Contacts", key: "contacts", path: "/contacts" },
  // {
  //   icon: PlayCircle,
  //   label: "Recordings",
  //   key: "recordings",
  //   path: "/recordings",
  // },
  { icon: Settings, label: "Settings", key: "settings", path: "/settings" },
];

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { user, logoutContext } = useUser();

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  const visibleMenu = user ? menu : menu.filter((item) => item.public);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed && !mobileOpen ? 80 : 260 }}
        className={`sidebar shrink-0 h-screen bg-background border-r border-border z-[100] transition-all duration-300 md:sticky md:top-0 fixed top-0 left-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <Button
          variant="none"
          size="none"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-6 w-6 h-6 bg-primary rounded-full items-center justify-center text-white z-50 hover:bg-primary-glow transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>

        {mobileOpen && (
          <Button
            variant="none"
            size="none"
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute top-4 -right-12 p-2 bg-card rounded-xl border border-border text-foreground shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}

        <div className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden p-4 gap-6">

        <div
          className={`flex items-center ${isCollapsed && !mobileOpen ? "justify-center" : "gap-3 px-2"} pt-2 mb-2 cursor-pointer`}
          onClick={() => navigate("/")}
        >
          <img
            src="/meetlogo.png"
            alt="MeetX Logo"
            className="w-10 h-10 object-contain shrink-0"
          />
          {!isCollapsed || mobileOpen ? (
            <span className="font-bold text-2xl tracking-tight text-foreground whitespace-nowrap">
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
                    className={`relative flex items-center ${isCollapsed && !mobileOpen ? "justify-center" : "gap-3 px-4"} py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "gradient-primary shadow-[0_0_20px_rgba(168,85,247,0.3)] text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!(isCollapsed && !mobileOpen) && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4">


          {user ? (
            <div
              className={`flex items-center ${isCollapsed && !mobileOpen ? "justify-center" : "gap-3 p-2"} rounded-xl hover:bg-muted transition-colors cursor-pointer mt-2`}
            >
              <img
                src={user?.avatar || avatarJohn}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/40 shrink-0"
              />
              {!(isCollapsed && !mobileOpen) && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    <Button
                      variant="none"
                      size="none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLogoutConfirm(true);
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
                onClick={() => navigate("/login")}
                className={`w-full bg-primary text-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] flex items-center justify-center ${isCollapsed && !mobileOpen ? "p-3" : "py-3 px-4"}`}
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
        </div>
      </motion.aside>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-foreground mb-2">Sign Out</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Are you sure you want to sign out of your account?
              </p>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="none"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="none"
                  className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logoutContext();
                    navigate("/login");
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
