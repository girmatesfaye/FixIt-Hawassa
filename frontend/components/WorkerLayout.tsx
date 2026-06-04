import React, { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import logoMuyayePrimary from "../assets/logo-muyaye-primary.svg";

interface WorkerLayoutProps {
  onLogout: () => void;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";
const UNREAD_MARKER_PREFIX = "fixit_last_seen_messages_";

const WorkerLayout: React.FC<WorkerLayoutProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    const token = localStorage.getItem("fixit_auth_token");
    if (!token) return;

    const fetchCounts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/requests/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const requests = (await res.json()) as any[];
        const requestsWithChat = requests.filter(
          (r: any) => r.assignedWorkerId,
        );

        const totals = await Promise.all(
          requestsWithChat.map(async (req: any) => {
            const markerKey = `${UNREAD_MARKER_PREFIX}${req.id}`;
            const lastSeenAt = localStorage.getItem(markerKey);
            const msgRes = await fetch(`${API_BASE_URL}/messages/${req.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!msgRes.ok) return 0;
            const data = await msgRes.json();
            const messages = data.messages || [];
            return messages.filter((m: any) => {
              if (m.senderRole === "worker") return false;
              if (!lastSeenAt) return true;
              return (
                new Date(m.createdAt).getTime() > new Date(lastSeenAt).getTime()
              );
            }).length;
          }),
        );
        setUnreadCount(totals.reduce((a, b) => a + b, 0));
      } catch (err) {
        console.error("Layout badge poll failed", err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { icon: "construction", label: "Worker Hub", path: "/worker-hub" },
    { icon: "chat", label: "Messages", path: "/messages", badge: unreadCount },
    { icon: "person_search", label: "Find Help", path: "/help" },
  ];

  const systemItems = [
    { icon: "edit", label: "Edit Profile", path: "/worker/edit-profile" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen portal-shell font-sans overflow-hidden relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-[#f8faff] dark:bg-surface-dark border-r border-[#e8edf7] dark:border-gray-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-20 lg:hover:w-64 group flex flex-col shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-6 flex items-center justify-between">
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity overflow-hidden"
          >
            <img
              src={logoMuyayePrimary}
              alt="Muyaye"
              className="h-8 w-auto shrink-0"
            />
            <div className="lg:max-w-0 lg:group-hover:max-w-[160px] lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
              <h2 className="text-sm font-bold tracking-tight text-[#120e1b] dark:text-white">
                Muyaye
              </h2>
              <p className="text-xs font-medium text-primary">Worker Portal</p>
            </div>
          </Link>
          <button
            onClick={closeMobileMenu}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden relative ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-primary"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[24px] shrink-0">
                  {item.icon}
                </span>
                <span className="lg:max-w-0 lg:group-hover:max-w-[160px] lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
                  {item.label}
                </span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto lg:absolute lg:right-2 lg:group-hover:static opacity-100 transition-all">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[2px] lg:max-w-0 lg:group-hover:max-w-[160px] lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
              Account
            </h3>
            <div className="space-y-1">
              {systemItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-primary"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[24px] shrink-0">
                    {item.icon}
                  </span>
                  <span className="lg:max-w-0 lg:group-hover:max-w-[160px] lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-[#e8edf7] dark:border-gray-800 overflow-hidden">
          <button
            onClick={() => {
              onLogout();
              navigate("/");
              closeMobileMenu();
            }}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-600 dark:text-gray-400 hover:text-red-600 font-medium text-sm rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors overflow-hidden"
          >
            <span className="material-symbols-outlined text-[24px] shrink-0">
              logout
            </span>
            <span className="lg:max-w-0 lg:group-hover:max-w-[160px] lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 lg:h-10 portal-topbar border-x-0 border-t-0 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="lg:hidden text-base font-bold text-[#120e1b] dark:text-white tracking-tight">
              {menuItems.find((i) => location.pathname.startsWith(i.path))
                ?.label || "Worker Hub"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications and Profile removed for clean UI */}
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto portal-shell">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WorkerLayout;
