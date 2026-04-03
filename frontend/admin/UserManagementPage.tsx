import React, { useEffect, useState } from "react";
import { getAuthToken } from "../services/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = getAuthToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [usersRes, statsRes, reportsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/users`, { headers }),
          fetch(`${API_BASE_URL}/admin/stats`, { headers }),
          fetch(`${API_BASE_URL}/admin/reports`, { headers }),
        ]);

        const usersData = await usersRes.json();
        const statsData = await statsRes.json();
        const reportsData = await reportsRes.json();

        setUsers(
          (usersData.users || []).map((u: any) => ({
            name: u.name,
            email: u.phone, // mapping phone to email placeholder
            role: u.role,
            status: u.status,
            joined: "N/A", // could map from id or createdAt if returned
            reports: null,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
          }))
        );

        setStats([
          {
            label: "Total Users",
            value: statsData.totalUsers?.toString() || "0",
            change: "",
            icon: "group",
            color: "bg-red-500",
          },
          {
            label: "Pending Complaints",
            value: statsData.pendingReports?.toString() || "0",
            sub: "Action needed",
            icon: "report_problem",
            color: "bg-orange-500",
            alert: true,
          },
          {
            label: "Total Workers",
            value: statsData.totalWorkers?.toString() || "0",
            icon: "engineering",
            color: "bg-green-500",
          },
          {
            label: "Total Services",
            value: statsData.totalRequests?.toString() || "0",
            icon: "home_repair_service",
            color: "bg-blue-500",
          },
        ]);

        setRecentReports(
          (reportsData.reports || []).slice(0, 3).map((r: any) => ({
            type: r.type,
            time: new Date(r.createdAt).toLocaleDateString(),
            text: r.text,
            against: r.reportedUserId?.fullName || "Unknown",
          }))
        );
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading admin data...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#120e1b]">User Management</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${i === 0 || i === 1 ? "border-red-500" : "border-gray-50"} relative overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">
                  {stat.label}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#120e1b]">
                    {stat.value}
                  </span>
                  {stat.change && (
                    <span className="text-xs font-semibold text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      <span className="material-symbols-outlined text-[12px] mr-1">
                        trending_up
                      </span>
                      {stat.change}
                    </span>
                  )}
                </div>
                {stat.sub && (
                  <p
                    className={`text-xs font-medium ${stat.alert ? "text-red-500" : "text-gray-400"}`}
                  >
                    {stat.alert && "❗ "} {stat.sub}
                  </p>
                )}
              </div>
              <div
                className={`size-10 rounded-xl ${stat.color} bg-opacity-10 flex items-center justify-center text-current`}
              >
                <span
                  className={`material-symbols-outlined ${stat.color.replace("bg-", "text-")}`}
                >
                  {stat.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent User Reports */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">
              warning
            </span>
            <h3 className="text-base font-semibold text-[#120e1b]">
              Recent User Reports
            </h3>
          </div>
          <button className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-colors">
            View All Reports
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recentReports.map((report, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider bg-red-50 px-2.5 py-1 rounded border border-red-100">
                  {report.type}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {report.time}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                {report.text}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    Against:
                  </span>
                  <span className="text-sm font-semibold text-[#120e1b]">
                    {report.against}
                  </span>
                </div>
                <button className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors">
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-red-500"
          />
        </div>
        <button className="h-10 px-5 rounded-lg border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full md:w-auto">
          <span className="material-symbols-outlined text-[18px]">
            filter_list
          </span>
          Filter
        </button>
        <button className="h-10 px-5 bg-primary text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-primary-dark shadow-sm transition-all w-full md:w-auto">
          <span className="material-symbols-outlined text-[18px]">
            person_search
          </span>
          Search User
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[860px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length ? (
                users.map((user, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          className="size-10 rounded-full bg-gray-100"
                          alt=""
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#120e1b]">
                            {user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          user.role.includes("Worker")
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${
                          user.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.joined}
                    </td>
                    <td className="px-6 py-4">
                      {user.reports ? (
                        <span className="size-6 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center justify-center">
                          {user.reports}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className={`h-8 px-3 rounded text-xs font-medium transition-all border ${
                            user.status === "Active"
                              ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                              : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {user.status === "Active" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          aria-label={`Edit ${user.name}`}
                          className="size-8 rounded flex items-center justify-center text-gray-400 hover:text-[#120e1b] hover:bg-gray-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          aria-label={`View ${user.name}`}
                          className="size-8 rounded flex items-center justify-center text-gray-400 hover:text-[#120e1b] hover:bg-gray-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            visibility
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-6 py-12 text-center text-sm text-gray-500"
                    colSpan={6}
                  >
                    No users found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-[#120e1b]">1-3</span> of{" "}
            <span className="font-medium text-[#120e1b]">1,240</span> results
          </p>
          <div className="flex items-center gap-1">
            <button className="h-8 px-3 rounded text-sm font-medium text-gray-500 hover:text-[#120e1b] hover:bg-gray-100 disabled:opacity-50 transition-colors">
              Previous
            </button>
            <button className="size-8 rounded bg-primary text-white text-sm font-medium">
              1
            </button>
            <button className="size-8 rounded text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
              2
            </button>
            <span className="px-1 text-gray-400">...</span>
            <button className="size-8 rounded text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
              10
            </button>
            <button className="h-8 px-3 rounded text-sm font-medium text-gray-500 hover:text-[#120e1b] hover:bg-gray-100 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
