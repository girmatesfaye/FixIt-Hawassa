import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { getAuthToken } from "../services/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

type AdminUser = {
  id: string;
  name: string;
  phone: string;
  role: "client" | "worker" | "admin";
  status: "active" | "suspended";
  joined: string;
  reportCount: number;
  area: string;
  avatar: string;
  category: string;
};

type UserDetail = {
  id: string;
  name: string;
  phone: string;
  role: "client" | "worker" | "admin";
  status: "active" | "suspended";
  area: string;
  isVerified: boolean;
  createdAt: string;
  reportCount: number;
  reportedAgainstCount: number;
  workerProfile?: {
    title?: string;
    skills?: string[];
    isActive?: boolean;
  } | null;
};

type RecentReport = {
  id: string;
  type: string;
  time: string;
  text: string;
  against: string;
};

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [actionUserId, setActionUserId] = useState("");
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    area: "",
    status: "active" as "active" | "suspended",
  });

  const getHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("UNAUTHORIZED");
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("UNAUTHORIZED");
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const toUserDetailFromRow = (user: AdminUser): UserDetail => ({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    area: user.area,
    isVerified: false,
    createdAt: user.joined,
    reportCount: 0,
    reportedAgainstCount: user.reportCount,
    workerProfile: null,
  });

  const fetchAdminData = async () => {
    try {
      const headers = getAuthHeaders();

      const [usersRes, statsRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, { headers }),
        fetch(`${API_BASE_URL}/admin/stats`, { headers }),
        fetch(`${API_BASE_URL}/admin/reports`, { headers }),
      ]);

      if (!usersRes.ok || !statsRes.ok || !reportsRes.ok) {
        throw new Error("ADMIN_LOAD_FAILED");
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const reportsData = await reportsRes.json();

      setUsers(
        (usersData.users || []).map((u: any) => ({
          id: String(u.id),
          name: u.name,
          phone: u.phone,
          role: u.role,
          status: u.status,
          joined: u.createdAt
            ? new Date(u.createdAt).toLocaleDateString()
            : "-",
          reportCount: typeof u.reportCount === "number" ? u.reportCount : 0,
          area: u.area || "",
          category:
            u.role === "worker"
              ? String(
                  u.workerProfile?.title || u.workerProfile?.skills?.[0] || "-",
                )
              : "-",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
        })),
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
          id: String(r._id),
          type: r.type,
          time: new Date(r.createdAt).toLocaleDateString(),
          text: r.text,
          against: r.reportedUserId?.fullName || "Unknown",
        })),
      );
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.category.toLowerCase().includes(query),
    );
  }, [searchQuery, users]);

  const openUserView = async (userId: string) => {
    try {
      setActionUserId(userId);
      const fallbackRow = users.find((entry) => entry.id === userId);

      if (!userId || userId === "undefined") {
        if (fallbackRow) {
          setSelectedUser(toUserDetailFromRow(fallbackRow));
          setIsViewOpen(true);
          return;
        }

        throw new Error("INVALID_USER_ID");
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      });

      const result = (await response.json().catch(() => null)) as {
        user?: UserDetail;
      } | null;

      if (!response.ok || !result?.user) {
        if (fallbackRow) {
          setSelectedUser(toUserDetailFromRow(fallbackRow));
          setIsViewOpen(true);
          return;
        }

        throw new Error("LOAD_FAILED");
      }

      setSelectedUser(result.user);
      setIsViewOpen(true);
    } catch (error) {
      console.error("Failed to fetch user details", error);
      alert("Could not load user details.");
    } finally {
      setActionUserId("");
    }
  };

  const openUserEdit = async (userId: string) => {
    try {
      setActionUserId(userId);
      const fallbackRow = users.find((entry) => entry.id === userId);

      if (!userId || userId === "undefined") {
        if (fallbackRow) {
          const fallbackDetail = toUserDetailFromRow(fallbackRow);
          setSelectedUser(fallbackDetail);
          setEditForm({
            fullName: fallbackDetail.name,
            phone: fallbackDetail.phone,
            area: fallbackDetail.area || "",
            status: fallbackDetail.status,
          });
          setIsEditOpen(true);
          return;
        }

        throw new Error("INVALID_USER_ID");
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      });

      const result = (await response.json().catch(() => null)) as {
        user?: UserDetail;
      } | null;

      if (!response.ok || !result?.user) {
        if (fallbackRow) {
          const fallbackDetail = toUserDetailFromRow(fallbackRow);
          setSelectedUser(fallbackDetail);
          setEditForm({
            fullName: fallbackDetail.name,
            phone: fallbackDetail.phone,
            area: fallbackDetail.area || "",
            status: fallbackDetail.status,
          });
          setIsEditOpen(true);
          return;
        }

        throw new Error("LOAD_FAILED");
      }

      setSelectedUser(result.user);
      setEditForm({
        fullName: result.user.name,
        phone: result.user.phone,
        area: result.user.area || "",
        status: result.user.status,
      });
      setIsEditOpen(true);
    } catch (error) {
      console.error("Failed to fetch user for edit", error);
      alert("Could not load user details for edit.");
    } finally {
      setActionUserId("");
    }
  };

  const submitUserEdit = async () => {
    if (!selectedUser) return;

    try {
      setActionUserId(selectedUser.id);
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            fullName: editForm.fullName,
            phone: editForm.phone,
            area: editForm.area,
            status: editForm.status,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("UPDATE_FAILED");
      }

      setIsEditOpen(false);
      await fetchAdminData();
    } catch (error) {
      console.error("Failed to update user", error);
      alert("Could not update this user.");
    } finally {
      setActionUserId("");
    }
  };

  const toggleUserStatus = async (user: AdminUser) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";

    try {
      setActionUserId(user.id);
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${user.id}/status`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      if (!response.ok) {
        const fallbackResponse = await fetch(
          `${API_BASE_URL}/admin/users/${user.id}`,
          {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ status: nextStatus }),
          },
        );

        if (!fallbackResponse.ok) {
          throw new Error("STATUS_UPDATE_FAILED");
        }
      }

      setUsers((current) =>
        current.map((entry) =>
          entry.id === user.id ? { ...entry, status: nextStatus } : entry,
        ),
      );
    } catch (error) {
      console.error("Failed to update user status", error);
      alert("Could not change user status.");
    } finally {
      setActionUserId("");
    }
  };

  if (loading) {
    return <div className="p-8">Loading admin data...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#120e1b]">User Management</h1>
      </div>

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
                </div>
                {stat.sub && (
                  <p
                    className={`text-xs font-medium ${stat.alert ? "text-red-500" : "text-gray-400"}`}
                  >
                    {stat.alert ? "Action needed" : stat.sub}
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
          <button
            onClick={() => navigate("/admin/reports")}
            className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
          >
            View All Reports
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recentReports.map((report) => (
            <div
              key={report.id}
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
                <button
                  onClick={() =>
                    navigate("/admin/reports", {
                      state: { focusReportId: report.id },
                    })
                  }
                  className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, phone, or role..."
            className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

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
                  Category / Skill
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
              {filteredUsers.length ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
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
                            {user.phone}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          user.role === "worker"
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
                          user.status === "active"
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.category}
                    </td>
                    <td className="px-6 py-4">
                      {user.reportCount > 0 ? (
                        <span className="size-6 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center justify-center">
                          {user.reportCount}
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
                          disabled={actionUserId === user.id}
                          onClick={() => toggleUserStatus(user)}
                          className={`h-8 px-3 rounded text-xs font-medium transition-all border ${
                            user.status === "active"
                              ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                              : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {actionUserId === user.id
                            ? "Working..."
                            : user.status === "active"
                              ? "Suspend"
                              : "Activate"}
                        </button>
                        <button
                          onClick={() => openUserEdit(user.id)}
                          aria-label={`Edit ${user.name}`}
                          className="size-8 rounded flex items-center justify-center text-gray-400 hover:text-[#120e1b] hover:bg-gray-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => openUserView(user.id)}
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
                    colSpan={7}
                  >
                    No users found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-[#120e1b]">
              {filteredUsers.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-[#120e1b]">{users.length}</span>{" "}
            results
          </p>
        </div>
      </div>

      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="User Details"
      >
        {selectedUser ? (
          <div className="space-y-4 text-sm">
            <p>
              <span className="text-gray-500">Name:</span>{" "}
              <span className="font-semibold">{selectedUser.name}</span>
            </p>
            <p>
              <span className="text-gray-500">Role:</span>{" "}
              <span className="font-semibold capitalize">
                {selectedUser.role}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Phone:</span>{" "}
              <span className="font-semibold">{selectedUser.phone}</span>
            </p>
            <p>
              <span className="text-gray-500">Area:</span>{" "}
              <span className="font-semibold">{selectedUser.area || "-"}</span>
            </p>
            <p>
              <span className="text-gray-500">Category / Skill:</span>{" "}
              <span className="font-semibold">
                {selectedUser.role === "worker"
                  ? selectedUser.workerProfile?.title ||
                    selectedUser.workerProfile?.skills?.[0] ||
                    "-"
                  : "-"}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Status:</span>{" "}
              <span className="font-semibold capitalize">
                {selectedUser.status}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Joined:</span>{" "}
              <span className="font-semibold">
                {new Date(selectedUser.createdAt).toLocaleString()}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Reports by user:</span>{" "}
              <span className="font-semibold">{selectedUser.reportCount}</span>
            </p>
            <p>
              <span className="text-gray-500">Reports against user:</span>{" "}
              <span className="font-semibold">
                {selectedUser.reportedAgainstCount}
              </span>
            </p>
            {selectedUser.role === "worker" ? (
              <div className="pt-2 border-t border-gray-100">
                <p className="font-semibold text-[#120e1b]">Worker Profile</p>
                <p className="text-xs text-gray-500 mt-1">
                  Title: {selectedUser.workerProfile?.title || "-"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Skills:{" "}
                  {selectedUser.workerProfile?.skills?.join(", ") || "-"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Active for requests:{" "}
                  {selectedUser.workerProfile?.isActive ? "Yes" : "No"}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit User"
      >
        <div className="space-y-4">
          <input
            value={editForm.fullName}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
            placeholder="Full name"
            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
          <input
            value={editForm.phone}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            placeholder="Phone"
            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
          <input
            value={editForm.area}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                area: event.target.value,
              }))
            }
            placeholder="Area"
            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
          <select
            value={editForm.status}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                status:
                  event.target.value === "suspended" ? "suspended" : "active",
              }))
            }
            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsEditOpen(false)}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={Boolean(actionUserId)}
              onClick={submitUserEdit}
              className="flex-1 h-11 rounded-xl bg-primary text-white font-semibold"
            >
              {actionUserId ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
