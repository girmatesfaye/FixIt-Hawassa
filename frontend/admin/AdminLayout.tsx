import React from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";

interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: "dashboard", label: "Dashboard", path: "/admin/dashboard" },
    { icon: "group", label: "User Management", path: "/admin/users" },
    {
      icon: "category",
      label: "Category Management",
      path: "/admin/categories",
    },
    { icon: "report", label: "Reported Content", path: "/admin/reports" },
    // Analytics functionality is available from Dashboard; removing duplicate menu entry
  ];

  const systemItems = [
    { icon: "settings", label: "Settings", path: "/admin/settings" },
  ];

  const getBreadcrumb = () => {
    if (location.pathname.includes("/users")) return "Users";
    if (location.pathname.includes("/reports")) return "Reports";
    if (location.pathname.includes("/categories")) return "Categories";
    if (location.pathname.includes("/dashboard")) return "Dashboard";
    // analytics removed from menu; keep dashboard breadcrumb behavior
    if (location.pathname.includes("/settings")) return "Settings";
    return "Dashboard";
  };

  return (
    <div className="flex h-screen portal-shell font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col portal-panel-soft border-r-[#e8edf7] shrink-0">
        <Link
          to="/"
          className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined font-semibold text-xl">
              construction
            </span>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[#120e1b]">
              FixIt Hawassa
            </h2>
            <p className="text-xs font-medium text-gray-500">Admin Portal</p>
          </div>
        </Link>

        <nav className="flex-1 px-4 py-6 space-y-8">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-gray-600 hover:bg-white/80 hover:text-primary"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              System
            </h3>
            <div className="space-y-1">
              {systemItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "text-gray-600 hover:bg-white/80 hover:text-primary"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-[#e8edf7]">
          <button
            onClick={() => {
              onLogout();
              navigate("/");
            }}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-600 hover:text-red-600 font-medium text-sm rounded-xl hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              logout
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 portal-topbar border-x-0 border-t-0 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#120e1b] font-semibold">
              {getBreadcrumb()}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button
              aria-label="Open admin notifications"
              className="relative size-10 flex items-center justify-center text-gray-500 hover:text-[#120e1b] hover:bg-primary/10 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-white"></span>
            </button>
            <div
              className="size-9 rounded-full overflow-hidden border border-gray-200 shadow-sm cursor-pointer"
              aria-label="Admin profile"
            >
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                alt="Admin"
                className="w-full h-full object-cover"
              />
            </div>
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

export default AdminLayout;
