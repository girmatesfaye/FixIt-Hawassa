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
  const [profileNameInput, setProfileNameInput] = useState("");
  const [profileAreaInput, setProfileAreaInput] = useState("");
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
        setMyReports(items.map(toDashboardReport));
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
          user?: { id?: string; name?: string; area?: string };
        } | null;

        if (!result?.user?.id) {
          throw new Error("UNAUTHORIZED");
        }

        setMyUserId(result.user.id);
        setCurrentUserName(result.user.name ?? "");
        setCurrentUserArea(result.user.area ?? "");
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
    setProfileSaveError("");
  }, [isProfileModalOpen, currentUserName, currentUserArea]);

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
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        user?: { name?: string; area?: string };
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

  return (
    <div className="portal-shell dark:bg-background-dark text-[#120e1b] dark:text-white font-sans min-h-screen">
      <div className="flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full portal-topbar border-x-0 border-t-0 px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/20">
                <span className="material-symbols-outlined font-semibold text-xl">
                  handyman
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold leading-none dark:text-white tracking-tight">
                  FixIt Hawassa
                </h1>
                <p className="text-xs font-medium text-primary mt-1">
                  Client Portal
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/worker-hub")}
                className="hidden md:flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary hover:bg-primary-dark text-white transition-all text-sm font-medium shadow-sm shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[18px]">
                  engineering
                </span>
                Switch to Worker
              </button>
              <button
                type="button"
                onClick={handleOpenNotifications}
                aria-label="Open notifications"
                className="relative size-9 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-surface-dark dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-xl">
                  notifications
                </span>
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>
              <button
                onClick={onLogout}
                aria-label="Log out"
                className="size-9 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-surface-dark dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-xl">
                  logout
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-10">
            {/* Hero / Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 portal-panel p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

              <div className="relative z-10 flex items-center gap-5">
                {/* Profile Edit Trigger Icon */}
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="group relative size-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300"
                  aria-label="Edit Profile"
                >
                  <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">
                    account_circle
                  </span>
                  <div className="absolute -bottom-1 -right-1 size-5 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center border border-primary/20 shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[12px] font-bold">
                      edit
                    </span>
                  </div>
                </button>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#120e1b] dark:text-white">
                    Hi, {currentUserName || "there"}! 👋
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    Ready to fix something in{" "}
                    <span className="text-primary font-medium">
                      {currentUserArea || "your area"}
                    </span>{" "}
                    today?
                  </p>
                </div>
              </div>

              <div className="relative z-10 w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  search
                </span>
                <input
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white text-sm transition-all"
                  placeholder="Search for plumbers..."
                  type="text"
                />
              </div>
            </div>

            {/* Service Grid */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold dark:text-white tracking-tight">
                  Services Categories
                </h3>
                <Link
                  to="/search-results"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {(categories.length > 0
                  ? categories
                  : [
                      { name: "Plumbing", icon: "plumbing" },
                      { name: "Electrical", icon: "bolt" },
                      { name: "Carpentry", icon: "carpenter" },
                      { name: "Painting", icon: "format_paint" },
                      { name: "Cleaning", icon: "cleaning_services" },
                      { name: "Masonry", icon: "foundation" },
                    ]
                ).map((svc, index) => {
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
                      key={svc.name}
                      onClick={() => handleServiceClick(svc.name)}
                      className="group flex flex-col items-center gap-3 p-5 rounded-2xl portal-panel hover:shadow-md hover:border-primary/30 transition-all duration-300"
                    >
                      <div
                        className={`size-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        <span className="material-symbols-outlined text-2xl">
                          {svc.icon || "build"}
                        </span>
                      </div>
                      <span className="text-sm font-medium dark:text-white">
                        {svc.name}
                      </span>
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
                    Live request data from your request history
                  </p>
                </div>
                <Link
                  to="/my-requests"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {myRequestsPreview.length ? (
                  myRequestsPreview.map((request) => (
                    <div
                      key={request.id}
                      className="min-w-[280px] portal-panel p-4 flex flex-col gap-3 hover:shadow-md hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-[#120e1b] dark:text-white truncate">
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
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-primary font-medium truncate">
                          {request.area}
                        </span>
                        <span className="text-gray-400">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate("/my-requests")}
                        className="h-9 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-semibold transition-all"
                      >
                        Open My Requests
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="portal-panel p-6 w-full text-center">
                    <p className="text-sm font-semibold text-[#120e1b] dark:text-white">
                      No requests yet
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submit a service request to see your requests here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* My Reports Section */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold dark:text-white tracking-tight">
                My Report Status
              </h3>
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
        </main>
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
