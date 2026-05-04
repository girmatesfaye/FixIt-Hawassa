import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Modal from "../components/Modal";
import { RequestStatus } from "../types";
import {
  ApiRequestStatus,
  ClientRequestItem,
  ClientReportItem,
  fetchClientRequests,
  fetchMyReports,
} from "../services/clientRequests";
import { getAuthToken } from "../services/auth";
import { getUploadedImageUrl } from "../services/upload";

interface DashboardPageProps {
  onLogout: () => void;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";
const UNREAD_MARKER_PREFIX = "fixit_last_seen_messages_";

type DashboardReport = {
  id: string;
  workerName: string;
  dateSubmitted: string;
  status: ClientReportItem["status"];
  category: string;
  issue: string;
  clientDescription: string;
  adminResolution: string;
};

const formatReportStatus = (status: ClientReportItem["status"]): string => {
  if (status === "investigating") return "Investigating";
  if (status === "resolved") return "Resolved";
  if (status === "dismissed") return "Dismissed";
  return "Pending";
};

const getReportResolutionText = (
  status: ClientReportItem["status"],
): string => {
  if (status === "resolved") {
    return "This report has been resolved by the admin team.";
  }

  if (status === "investigating") {
    return "The admin team is reviewing this report right now.";
  }

  if (status === "dismissed") {
    return "This report was dismissed after review.";
  }

  return "Your report has been received and is waiting for review.";
};

const toDashboardReport = (report: ClientReportItem): DashboardReport => {
  const workerName = report.reportedUser?.name ?? "Unknown worker";
  const requestCategory = report.request?.category ?? report.type;

  return {
    id: report.id,
    workerName,
    dateSubmitted: new Date(report.createdAt).toLocaleDateString(),
    status: report.status,
    category: report.type,
    issue: requestCategory,
    clientDescription: report.text,
    adminResolution:
      report.adminFeedback?.trim() || getReportResolutionText(report.status),
  };
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DashboardReport | null>(
    null,
  );
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [myRequestsPreview, setMyRequestsPreview] = useState<
    ClientRequestItem[]
  >([]);
  const [myReports, setMyReports] = useState<DashboardReport[]>([]);
  const [allClientRequests, setAllClientRequests] = useState<
    ClientRequestItem[]
  >([]);
  const [myUserId, setMyUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserArea, setCurrentUserArea] = useState("");
  const [currentUserPhone, setCurrentUserPhone] = useState("");
  const [currentUserAvatar, setCurrentUserAvatar] = useState("");
  const [profileNameInput, setProfileNameInput] = useState("");
  const [profileAreaInput, setProfileAreaInput] = useState("");
  const [profilePhoneInput, setProfilePhoneInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);

  const formatStatus = (status: ApiRequestStatus): RequestStatus => {
    if (status === "IN_PROGRESS") return RequestStatus.IN_PROGRESS;
    if (status === "PENDING") return RequestStatus.PENDING;
    if (status === "COMPLETED") return RequestStatus.COMPLETED;
    return RequestStatus.SEARCHING;
  };

  const handleServiceClick = (category?: string) => {
    if (category) {
      navigate("/request-service", { state: { category } });
      return;
    }

    navigate("/request-service");
  };

  const refreshRequests = () => {
    fetchClientRequests()
      .then((items) => {
        const count = items.filter(
          (item) => item.status !== "COMPLETED",
        ).length;
        setActiveRequestsCount(count);
        setAllClientRequests(items);
        setMyRequestsPreview(items.slice(0, 5));
      })
      .catch(() => {
        setActiveRequestsCount(0);
        setAllClientRequests([]);
        setMyRequestsPreview([]);
      });
  };

  const refreshReports = () => {
    fetchMyReports()
      .then((items) => {
        setMyReports(items.slice(0, 2).map(toDashboardReport));
      })
      .catch(() => {
        setMyReports([]);
      });
  };

  useEffect(() => {
    refreshRequests();
    refreshReports();

    fetch(`${API_BASE_URL}/requests/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error("Failed to load categories:", err));

    const intervalId = window.setInterval(refreshRequests, 5000);
    const reportsIntervalId = window.setInterval(refreshReports, 15000);
    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(reportsIntervalId);
    };
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setMyUserId("");
      return;
    }

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("UNAUTHORIZED");
        }

        const result = (await response.json().catch(() => null)) as {
          user?: { id?: string; name?: string; area?: string; phone?: string; avatar?: string };
        } | null;

        if (!result?.user?.id) {
          throw new Error("UNAUTHORIZED");
        }

        setMyUserId(result.user.id);
        setCurrentUserName(result.user.name ?? "");
        setCurrentUserArea(result.user.area ?? "");
        setCurrentUserPhone(result.user.phone ?? "");
        setCurrentUserAvatar(result.user.avatar ?? "");
      })
      .catch(() => {
        setMyUserId("");
        setCurrentUserName("");
        setCurrentUserArea("");
      });
  }, []);

  useEffect(() => {
    if (!myUserId) {
      setUnreadCount(0);
      return;
    }

    const requestsWithChat = allClientRequests.filter((request) =>
      Boolean(request.assignedWorkerId),
    );

    if (!requestsWithChat.length) {
      setUnreadCount(0);
      return;
    }

    const refreshUnreadCount = async () => {
      const token = getAuthToken();
      if (!token) {
        setUnreadCount(0);
        return;
      }

      try {
        const unreadTotals = await Promise.all(
          requestsWithChat.slice(0, 10).map(async (request) => {
            const markerKey = `${UNREAD_MARKER_PREFIX}${request.id}`;
            const lastSeenAt = localStorage.getItem(markerKey);

            const response = await fetch(
              `${API_BASE_URL}/messages/${request.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            if (!response.ok) {
              return 0;
            }

            const result = (await response.json().catch(() => null)) as {
              messages?: Array<{
                senderId?: string;
                createdAt?: string;
              }>;
            } | null;

            const messages = Array.isArray(result?.messages)
              ? result.messages
              : [];

            return messages.filter((message) => {
              if (!message?.createdAt || !message?.senderId) {
                return false;
              }

              if (message.senderId === myUserId) {
                return false;
              }

              if (!lastSeenAt) {
                return true;
              }

              return (
                new Date(message.createdAt).getTime() >
                new Date(lastSeenAt).getTime()
              );
            }).length;
          }),
        );

        setUnreadCount(unreadTotals.reduce((sum, count) => sum + count, 0));
      } catch {
        setUnreadCount(0);
      }
    };

    void refreshUnreadCount();
    const intervalId = window.setInterval(() => {
      void refreshUnreadCount();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [allClientRequests, myUserId]);

  useEffect(() => {
    if (!isProfileModalOpen) {
      return;
    }

    setProfileNameInput(currentUserName);
    setProfileAreaInput(currentUserArea);
    setProfilePhoneInput(currentUserPhone);
    setProfileSaveError("");
  }, [isProfileModalOpen, currentUserName, currentUserArea, currentUserPhone]);

  const handleSaveProfile = async () => {
    const nextName = profileNameInput.trim();
    const nextArea = profileAreaInput.trim();

    if (nextName.length < 2) {
      setProfileSaveError("Please enter a valid full name.");
      return;
    }

    if (nextArea.length < 2) {
      setProfileSaveError("Please enter a valid location.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: nextName,
          area: nextArea,
          phone: profilePhoneInput.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        user?: { name?: string; area?: string; phone?: string };
      } | null;

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result?.message ?? "Failed to save profile");
      }

      setCurrentUserName(result?.user?.name ?? nextName);
      setCurrentUserArea(result?.user?.area ?? nextArea);
      setCurrentUserPhone(result?.user?.phone ?? profilePhoneInput.trim());
      setIsProfileModalOpen(false);
    } catch (error) {
      setProfileSaveError(
        error instanceof Error ? error.message : "Failed to save profile",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenNotifications = () => {
    const requestsWithChat = allClientRequests.filter((request) =>
      Boolean(request.assignedWorkerId),
    );
    const now = new Date().toISOString();

    requestsWithChat.forEach((request) => {
      localStorage.setItem(`${UNREAD_MARKER_PREFIX}${request.id}`, now);
    });

    setUnreadCount(0);

    if (requestsWithChat.length) {
      navigate("/messages", { state: { requestId: requestsWithChat[0].id } });
      return;
    }

    navigate("/messages");
  };

  const openReportDetail = (report: DashboardReport) => {
    setSelectedReport(report);
    setIsReportDetailModalOpen(true);
  };

  const completedRequestsCount = allClientRequests.filter(
    (request) => request.status === "COMPLETED",
  ).length;
  const pendingResponsesCount = allClientRequests.filter(
    (request) => request.status === "PENDING",
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">

          <div className="flex flex-col gap-6 sm:gap-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Hero / Greeting */}
              <div className="flex flex-col justify-between gap-6 portal-panel p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    {/* Profile Edit Trigger Icon */}
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="group relative size-14 shrink-0 rounded-2xl bg-white dark:bg-surface-dark flex items-center justify-center text-primary hover:ring-2 hover:ring-primary transition-all duration-300 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800"
                      aria-label="Edit Profile"
                    >
                      <img
                        src={getUploadedImageUrl(currentUserAvatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUserName || "User")}`}
                        alt="Profile"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute -bottom-1 -right-1 size-5 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center border border-primary/20 shadow-sm">
                        <span className="material-symbols-outlined text-primary text-[12px] font-bold">
                          edit
                        </span>
                      </div>
                    </button>

                    <div className="space-y-1">
                      <h2 className="text-xl font-bold tracking-tight text-[#120e1b] dark:text-white">
                        Hi, {currentUserName || "there"}! 👋
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Need help in{" "}
                        <span className="text-primary font-medium">
                          {currentUserArea || "your area"}
                        </span>
                        ?
                      </p>
                    </div>
                  </div>

                  {/* Message Notification Button */}
                  <button
                    onClick={handleOpenNotifications}
                    className="relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                  >
                    <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-[#120e1b] dark:text-white">Messages</span>
                      <span className="text-[10px] font-medium text-gray-500">
                        {unreadCount > 0 ? `${unreadCount} new notifications` : "No new messages"}
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-white text-[10px] font-bold items-center justify-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      </span>
                    )}
                  </button>
                </div>


              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="portal-panel p-4 h-full">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Active Requests
                  </p>
                  <p className="text-xl font-semibold text-[#120e1b] dark:text-white mt-1">
                    {activeRequestsCount}
                  </p>
                </div>
                <div className="portal-panel p-4 h-full">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pending Replies
                  </p>
                  <p className="text-xl font-semibold text-[#120e1b] dark:text-white mt-1">
                    {pendingResponsesCount}
                  </p>
                </div>
                <div className="portal-panel p-4 h-full">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Completed Jobs
                  </p>
                  <p className="text-xl font-semibold text-[#120e1b] dark:text-white mt-1">
                    {completedRequestsCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Service Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold dark:text-white tracking-tight">
                    Service Categories
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pick a service to start a request fast
                  </p>
                </div>
                <Link
                  to="/bookings"
                  className="text-sm font-semibold text-primary hover:underline shrink-0 bg-primary/5 px-4 py-2 rounded-full transition-all"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-5">
                {(() => {
                  const defaultCategories = [
                    { id: "default-1", name: "Plumbing", icon: "plumbing" },
                    { id: "default-2", name: "Electrical", icon: "bolt" },
                    { id: "default-3", name: "Painting", icon: "format_paint" },
                    { id: "default-4", name: "Cleaning", icon: "cleaning_services" },
                    { id: "default-5", name: "Carpentry", icon: "carpenter" },
                    { id: "default-6", name: "Masonry", icon: "architecture" },
                    { id: "default-7", name: "General Fixes", icon: "build" },
                  ];

                  // Merge dynamic categories with defaults, avoiding duplicates by name
                  const merged = [...defaultCategories];
                  categories.forEach((dynamic) => {
                    if (!merged.find((m) => m.name.toLowerCase() === dynamic.name.toLowerCase())) {
                      merged.push(dynamic);
                    }
                  });

                  return merged;
                })().map((svc, index) => {
                  const colors = [
                    "bg-blue-50 text-blue-500 dark:bg-blue-500/10",
                    "bg-amber-50 text-amber-500 dark:bg-amber-500/10",
                    "bg-orange-50 text-orange-500 dark:bg-orange-500/10",
                    "bg-purple-50 text-purple-500 dark:bg-purple-500/10",
                    "bg-green-50 text-green-500 dark:bg-green-500/10",
                    "bg-slate-50 text-slate-500 dark:bg-slate-500/10",
                  ];
                  const color = colors[index % colors.length];
                  return (
                    <button
                      key={svc.id || svc.name}
                      onClick={() => handleServiceClick(svc.name)}
                      className="group flex flex-col items-center text-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div
                        className={`size-14 rounded-2xl ${color} flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm`}
                      >
                        <span className="material-symbols-outlined text-3xl">
                          {svc.icon || "build"}
                        </span>
                      </div>
                      <div className="space-y-1 w-full">
                        <p className="text-sm font-bold dark:text-white leading-tight">
                          {svc.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-primary transition-colors">
                          Request Now
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* My Requests Preview */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold dark:text-white tracking-tight">
                    My Recent Requests
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Latest activity from your requests
                  </p>
                </div>
                <Link
                  to="/bookings"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {myRequestsPreview.length ? (
                  myRequestsPreview.map((request) => (
                    <div
                      key={request.id}
                      className="portal-panel p-5 flex flex-col gap-4 hover:shadow-md hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-base font-semibold text-[#120e1b] dark:text-white truncate">
                          {request.category}
                        </h4>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            request.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : request.status === "PENDING"
                                ? "bg-purple-100 text-purple-700"
                                : request.status === "COMPLETED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {formatStatus(request.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {request.description}
                      </p>
                      <div className="flex items-center justify-between text-xs border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="flex items-center gap-1.5 text-primary font-medium truncate">
                          <span className="material-symbols-outlined text-[14px]">
                            location_on
                          </span>
                          <span className="truncate">{request.area}</span>
                        </div>
                        <span className="text-gray-400 shrink-0">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate("/bookings")}
                        className="h-9 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-semibold transition-all"
                      >
                        Open Booking
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="portal-panel p-8 w-full text-center md:col-span-2 xl:col-span-3">
                    <p className="text-base font-semibold text-[#120e1b] dark:text-white">
                      No requests yet
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Submit a service request to see your requests here.
                    </p>
                    <button
                      onClick={() => navigate("/request-service")}
                      className="mt-4 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Create Request
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* My Reports Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold dark:text-white tracking-tight">
                  Recent Reports
                </h3>
                <Link
                  to="/reports"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
              {activeRequestsCount ? (
                <p className="text-xs text-primary font-semibold">
                  You have {activeRequestsCount} active request
                  {activeRequestsCount > 1 ? "s" : ""} in progress.
                </p>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myReports.length ? (
                  myReports.map((report) => (
                    <div
                      key={report.id}
                      className="portal-panel p-6 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h4 className="text-base font-semibold dark:text-white tracking-tight">
                              {report.category}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Worker: {report.workerName}</span>
                              <span>•</span>
                              <span>{report.dateSubmitted}</span>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded inline-flex text-xs font-medium ${
                              report.status === "resolved"
                                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                                : report.status === "investigating"
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
                                  : report.status === "dismissed"
                                    ? "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 animate-pulse"
                            }`}
                          >
                            {formatReportStatus(report.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-5">
                          {report.clientDescription}
                        </p>
                      </div>

                      <button
                        onClick={() => openReportDetail(report)}
                        className="w-full h-10 bg-gray-50 hover:bg-primary text-gray-700 hover:text-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all"
                      >
                        View Report Details
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="portal-panel p-8 text-center md:col-span-2">
                    <p className="text-base font-semibold text-[#120e1b] dark:text-white">
                      No reports submitted
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      If an issue happens, you can report it from your request
                      details.
                    </p>
                  </div>
                )}
              </div>
          </div>
        </div>

      {/* Report Detail Modal */}
      <Modal
        isOpen={isReportDetailModalOpen}
        onClose={() => setIsReportDetailModalOpen(false)}
        title="Report Details"
      >
        {selectedReport && (
          <div className="flex flex-col gap-5 pt-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {selectedReport.id}
                </span>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    selectedReport.status === "resolved"
                      ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                      : selectedReport.status === "investigating"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
                        : selectedReport.status === "dismissed"
                          ? "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
                  }`}
                >
                  {formatReportStatus(selectedReport.status)}
                </span>
              </div>
              <h4 className="text-lg font-semibold dark:text-white tracking-tight">
                {selectedReport.category}
              </h4>
              <p className="text-sm text-primary font-medium">
                Against {selectedReport.workerName}
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  My Description
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{selectedReport.clientDescription}"
                </p>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-1.5">
                  Admin Resolution
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                  {selectedReport.adminResolution}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsReportDetailModalOpen(false)}
              className="w-full h-10 mt-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-sm transition-all"
            >
              Close Details
            </button>
          </div>
        )}
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Client Profile"
      >
        <div className="space-y-5 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              className="w-full h-10 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-white text-sm"
              type="text"
              value={profileNameInput}
              onChange={(event) => setProfileNameInput(event.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Location
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                location_on
              </span>
              <input
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-white text-sm"
                type="text"
                value={profileAreaInput}
                onChange={(event) => setProfileAreaInput(event.target.value)}
                placeholder="Neighborhood / Area"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                call
              </span>
              <input
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-white text-sm"
                type="tel"
                value={profilePhoneInput}
                onChange={(event) => setProfilePhoneInput(event.target.value)}
                placeholder="+251 9XX XXX XXX"
              />
            </div>
            <p className="text-[10px] text-gray-500 italic">
              Providing a phone number helps workers contact you faster.
            </p>
          </div>
          {profileSaveError ? (
            <p className="text-sm font-medium text-red-600">
              {profileSaveError}
            </p>
          ) : null}
          <button
            onClick={() => {
              void handleSaveProfile();
            }}
            disabled={isSavingProfile}
            className="w-full h-10 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-sm mt-3 transition-all"
          >
            {isSavingProfile ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
