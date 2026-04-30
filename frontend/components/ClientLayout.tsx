import React from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";

interface ClientLayoutProps {
  onLogout: () => void;
  unreadCount?: number;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ onLogout, unreadCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
    { icon: "task", label: "My Requests", path: "/my-requests" },
    { icon: "chat", label: "Messages", path: "/messages", badge: unreadCount },
    { icon: "report", label: "Reports", path: "/reports" },
    { icon: "add_circle", label: "Request Service", path: "/request-service" },
  ];

  const systemItems = [
    { icon: "engineering", label: "Worker Hub", path: "/worker-hub" },
  ];



  return (
    <div className="flex h-screen portal-shell font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 hover:w-64 group flex flex-col portal-panel-soft border-r-[#e8edf7] shrink-0 transition-all duration-300 ease-in-out z-50">
        <Link
          to="/"
          className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity overflow-hidden"
        >
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="material-symbols-outlined font-semibold text-xl">
              handyman
            </span>
          </div>
          <div className="max-w-0 group-hover:max-w-[160px] opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
            <h2 className="text-sm font-bold tracking-tight text-[#120e1b]">
              FixIt Hawassa
            </h2>
            <p className="text-xs font-medium text-primary">Client Portal</p>
          </div>
        </Link>

        <nav className="flex-1 px-4 py-6 space-y-8">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-gray-600 hover:bg-white/80 hover:text-primary"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[24px] shrink-0">
                  {item.icon}
                </span>
                <span className="max-w-0 group-hover:max-w-[160px] opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
                  {item.label}
                </span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute right-2 group-hover:static opacity-100 transition-all">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[2px] max-w-0 group-hover:max-w-[160px] opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
              Switch
            </h3>
            <div className="space-y-1">
              {systemItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "text-gray-600 hover:bg-white/80 hover:text-primary"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[24px] shrink-0">
                    {item.icon}
                  </span>
                  <span className="max-w-0 group-hover:max-w-[160px] opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-[#e8edf7] overflow-hidden">
          <button
            onClick={() => {
              onLogout();
              navigate("/");
            }}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-600 hover:text-red-600 font-medium text-sm rounded-xl hover:bg-red-50 transition-colors overflow-hidden"
          >
            <span className="material-symbols-outlined text-[24px] shrink-0">
              logout
            </span>
            <span className="max-w-0 group-hover:max-w-[160px] opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-10 portal-topbar border-x-0 border-t-0 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center">
            {/* Breadcrumb removed as requested */}
          </div>

          <div className="flex items-center gap-6">
            {/* Notifications and Profile removed as requested */}
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

export default ClientLayout;
