import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClientReportItem,
  ClientRequestItem,
  fetchClientRequests,
  fetchMyReports,
  markRequestCompleteByWorker,
  respondToWorkerInvite,
} from "../services/clientRequests";
import { getUploadedImageUrl } from "../services/upload";
import { getMyWorkerProfile, updateMyWorkerProfile } from "../services/worker";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";
const UNREAD_MARKER_PREFIX = "fixit_last_seen_messages_";

interface WorkerHubPageProps {
  onLogout: () => void;
}

const WorkerHubPage: React.FC<WorkerHubPageProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [workerTitle, setWorkerTitle] = useState("");
  const [bio, setBio] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [tiktokProfile, setTiktokProfile] = useState("");
  const [avatar, setAvatar] = useState("");
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [requests, setRequests] = useState<ClientRequestItem[]>([]);
  const [workerReports, setWorkerReports] = useState<ClientReportItem[]>([]);
  const [requestActionId, setRequestActionId] = useState("");
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ClientReportItem | null>(
    null,
  );
  const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myUserId, setMyUserId] = useState("");

  const profileAvatar =
    getUploadedImageUrl(avatar) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(workerName || "Worker")}`;

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        const [profile, workerRequests, workerReportsData] = await Promise.all([
          getMyWorkerProfile(),
          fetchClientRequests(),
          fetchMyReports(),
        ]);
        const workerProfile = profile.profile ?? {
          title: "",
          bio: "",
          area: "Hawassa",
          skills: [],
          isActive: true,
          telegramUsername: "",
          tiktokProfile: "",
          avatar: "",
          portfolio: [],
        };
        const nextSkills = Array.isArray(workerProfile.skills)
          ? workerProfile.skills
          : [];
        const nextPortfolio = Array.isArray(workerProfile.portfolio)
          ? workerProfile.portfolio
          : [];

        setWorkerName(profile.name || "");
        setWorkerTitle(
          workerProfile.title ||
            (nextSkills[0] ? `${nextSkills[0]} Specialist` : ""),
        );
        setBio(workerProfile.bio || "");
        setArea(workerProfile.area || "");
        setPhone(profile.phone || "");
        setTelegramUsername(workerProfile.telegramUsername || "");
        setTiktokProfile(workerProfile.tiktokProfile || "");
        setAvatar(profile.avatar || workerProfile.avatar || "");
        setPortfolio(nextPortfolio);
        setSkills(nextSkills);
        setIsAvailable(workerProfile.isActive ?? true);
        setIsProfileComplete(
          Boolean(
            workerProfile.bio &&
            nextSkills.length > 0 &&
            workerProfile.avatar &&
            nextPortfolio.length > 0,
          ),
        );
        setRequests(workerRequests);
        setWorkerReports(workerReportsData);
        setRating(Number((workerProfile as any).rating ?? 0));
        setReviewCount(Number((workerProfile as any).reviews ?? 0));
        setMyUserId(profile.id || "");
      } catch (error) {
        console.error("Failed to load worker data", error);
        setRequestError("Could not load invitations right now.");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkerData();
  }, []);

  useEffect(() => {
    if (!myUserId || !requests.length) {
      setUnreadCount(0);
      return;
    }

    const requestsWithChat = requests.filter((request) =>
      Boolean(request.assignedWorkerId),
    );

    if (!requestsWithChat.length) {
      setUnreadCount(0);
      return;
    }

    const refreshUnreadCount = async () => {
      const token = localStorage.getItem("fixit_auth_token");
      if (!token) return;

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

            if (!response.ok) return 0;

            const result = (await response.json()) as {
              messages?: Array<{ senderId?: string; createdAt?: string }>;
            };
            const messages = result.messages || [];

            return messages.filter((m) => {
              if (!m.createdAt || !m.senderId || m.senderId === myUserId)
                return false;
              if (!lastSeenAt) return true;
              return (
                new Date(m.createdAt).getTime() > new Date(lastSeenAt).getTime()
              );
            }).length;
          }),
        );

        setUnreadCount(unreadTotals.reduce((sum, count) => sum + count, 0));
      } catch (err) {
        console.error("Failed to fetch unread messages for worker", err);
      }
    };

    refreshUnreadCount();
    const intervalId = window.setInterval(refreshUnreadCount, 5000);
    return () => window.clearInterval(intervalId);
  }, [requests, myUserId]);

  const handleOpenMessages = () => {
    const requestsWithChat = requests.filter((request) =>
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

  const pendingInvites = requests.filter(
    (request) => request.status === "PENDING",
  );
  const activeJobs = requests.filter(
    (request) => request.status === "IN_PROGRESS",
  );
  const recentReportUpdates = workerReports.slice(0, 4);

  const handleWorkerDecision = async (
    requestId: string,
    decision: "accept" | "decline",
  ) => {
    setRequestActionId(requestId);
    setRequestError("");

    try {
      const updatedRequest = await respondToWorkerInvite(requestId, decision);
      setRequests((current) => {
        if (decision === "decline") {
          return current.filter((request) => request.id !== requestId);
        }

        return current.map((request) =>
          request.id === requestId ? updatedRequest : request,
        );
      });
      toast.success(
        decision === "accept"
          ? "Invitation accepted! Job moved to Active Jobs."
          : "Invitation declined. The client has been notified to look for other recommended pros.",
      );
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        navigate("/login");
        return;
      }

      const msg =
        error instanceof Error
          ? error.message
          : "Could not update this invitation.";
      setRequestError(msg);
      toast.error(msg);
    } finally {
      setRequestActionId("");
    }
  };

  const handleMarkCompleted = async (requestId: string) => {
    setRequestActionId(requestId);
    setRequestError("");

    try {
      const updatedRequest = await markRequestCompleteByWorker(requestId);
      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? updatedRequest : request,
        ),
      );
      toast.success("Job marked as completed! Waiting for client confirmation.");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        onLogout();
        navigate("/login");
        return;
      }

      const msg =
        error instanceof Error
          ? error.message.includes("WORKER_COMPLETE_FAILED (404)")
            ? "Completion endpoint not found. Restart backend."
            : error.message
          : "Could not mark this job as completed.";
      setRequestError(msg);
      toast.error(msg);
    } finally {
      setRequestActionId("");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#120e1b] dark:text-white">
                Shop Presence
              </h1>
              <p className="text-xs sm:text-sm font-bold text-gray-500">
                How clients see you in Hawassa.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenMessages}
                className="relative h-11 px-4 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 hover:shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-primary">mail</span>
                <span className="hidden sm:inline">Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[9px] font-bold items-center justify-center">
                      {unreadCount}
                    </span>
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/worker/edit-profile")}
                className="h-11 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-primary/20 flex-1 sm:flex-none"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6 sm:p-10 flex flex-col gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            {/* Availability Toggle */}
            <div
              className={`rounded-3xl p-4 sm:p-6 border-2 transition-all flex items-center justify-between gap-3 shadow-sm ${
                isAvailable
                  ? "bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900"
                  : "bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-gray-800"
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className={`size-10 sm:size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    isAvailable
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl sm:text-2xl">
                    sensors
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold tracking-tight dark:text-white truncate">
                    {isAvailable
                      ? "You are visible to clients"
                      : "Your profile is hidden"}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 mt-0.5 line-clamp-2">
                    {isAvailable
                      ? "Clients can call or message you for physical work."
                      : "Turn this on to appear in Hawassa search results."}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const nextAvailable = !isAvailable;
                  setIsAvailable(nextAvailable);
                  try {
                    await updateMyWorkerProfile({ isActive: nextAvailable });
                    toast.success(
                      nextAvailable ? "You are now visible!" : "Profile hidden.",
                    );
                  } catch (error) {
                    console.error("Failed to update availability", error);
                    setIsAvailable(isAvailable);
                    toast.error("Could not update availability.");
                  }
                }}
                className={`w-14 h-7 rounded-full relative transition-colors shadow-inner shrink-0 ${isAvailable ? "bg-green-500" : "bg-gray-300 dark:bg-gray-800"}`}
              >
                <div
                  className={`absolute top-1 size-5 bg-white rounded-full shadow-lg transition-all ${isAvailable ? "left-8" : "left-1"}`}
                />
              </button>
            </div>

            {/* Worker Reputation (Moved to top) */}
            <div className="portal-panel rounded-3xl p-4 sm:p-6 flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Worker Reputation
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold tracking-tight dark:text-white">
                    {rating.toFixed(1)}
                  </span>
                  <span className="material-symbols-outlined text-amber-400 text-2xl fill-current">
                    star
                  </span>
                </div>
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-1">
                  {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="size-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
            </div>
          </div>

          {!isProfileComplete && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="size-12 sm:size-14 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600 shrink-0">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl">
                    add_a_photo
                  </span>
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-extrabold tracking-tight text-amber-900 dark:text-amber-100">
                    Boost your profile visibility
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-amber-700 mt-1">
                    Complete your profile to be recommended to more clients in Hawassa.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/worker/edit-profile")}
                className="h-10 sm:h-11 px-6 sm:px-8 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 w-full sm:w-auto shrink-0"
              >
                Upload Photos
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="portal-panel rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight dark:text-white">
                    Pending Invitations
                  </h3>
                  <p className="text-sm font-bold text-gray-500">
                    Accept a client request to start the job.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest">
                  {pendingInvites.length} pending
                </span>
              </div>

              {requestError ? (
                <p className="mb-4 text-sm font-semibold text-red-600">
                  {requestError}
                </p>
              ) : null}

              {loading ? (
                <p className="text-sm font-semibold text-gray-500">
                  Loading invitations...
                </p>
              ) : pendingInvites.length ? (
                <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                  {pendingInvites.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/20 p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-extrabold text-[#120e1b] dark:text-white">
                            {request.category}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="size-5 rounded-full overflow-hidden border border-gray-100">
                              <img
                                src={getUploadedImageUrl((request.clientUserId as any)?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(request.clientUserId?.name || "Client")}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">
                              {request.clientUserId?.name ?? "Client"}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-widest">
                          Pending
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                        {request.description}
                      </p>
                      {request.photoUrls.length ? (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {request.photoUrls.slice(0, 3).map((photoUrl) => (
                            <img
                              key={photoUrl}
                              src={getUploadedImageUrl(photoUrl)}
                              alt="Service request"
                              className="size-12 rounded-lg object-cover border border-gray-100 dark:border-gray-700"
                            />
                          ))}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-400">
                        <span>{request.area}</span>
                        <span>•</span>
                        <span>{request.maintenanceLevel}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            void handleWorkerDecision(request.id, "accept");
                          }}
                          disabled={requestActionId === request.id}
                          className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary-dark text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
                        >
                          {requestActionId === request.id
                            ? "Saving..."
                            : "Accept"}
                        </button>
                        <button
                          onClick={() => {
                            void handleWorkerDecision(request.id, "decline");
                          }}
                          disabled={requestActionId === request.id}
                          className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
                  <p className="text-sm font-bold text-[#120e1b] dark:text-white">
                    No pending invitations
                  </p>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    New client invites will appear here.
                  </p>
                </div>
              )}
            </div>

            <div className="portal-panel rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight dark:text-white">
                    Active Jobs
                  </h3>
                  <p className="text-sm font-bold text-gray-500">
                    Jobs you already accepted.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-widest">
                  {activeJobs.length} active
                </span>
              </div>

              {loading ? (
                <p className="text-sm font-semibold text-gray-500">
                  Loading jobs...
                </p>
              ) : activeJobs.length ? (
                <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeJobs.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/20 p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-extrabold text-[#120e1b] dark:text-white">
                            {request.category}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="size-5 rounded-full overflow-hidden border border-gray-100">
                              <img
                                src={getUploadedImageUrl((request.clientUserId as any)?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(request.clientUserId?.name || "Client")}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">
                              {request.clientUserId?.name ?? "Client"}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold uppercase tracking-widest">
                          In Progress
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                        {request.description}
                      </p>
                      {request.photoUrls.length ? (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {request.photoUrls.slice(0, 3).map((photoUrl) => (
                            <img
                              key={photoUrl}
                              src={getUploadedImageUrl(photoUrl)}
                              alt="Service request"
                              className="size-12 rounded-lg object-cover border border-gray-100 dark:border-gray-700"
                            />
                          ))}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-400">
                        <span>{request.area}</span>
                        <span>•</span>
                        <span>{request.maintenanceLevel}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate("/messages", {
                              state: { requestId: request.id },
                            })
                          }
                          className="flex-1 h-9 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Open Chat
                        </button>
                        <button
                          onClick={() => {
                            void handleMarkCompleted(request.id);
                          }}
                          disabled={
                            requestActionId === request.id ||
                            Boolean(request.workerMarkedCompleteAt)
                          }
                          className="flex-1 h-9 rounded-lg bg-green-100 hover:bg-green-600 text-green-700 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {request.workerMarkedCompleteAt
                            ? "Awaiting Confirm"
                            : requestActionId === request.id
                              ? "Saving..."
                              : "Mark Done"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
                  <p className="text-sm font-bold text-[#120e1b] dark:text-white">
                    No active jobs
                  </p>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    Accepted work will move here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Overview */}
              <div className="portal-panel rounded-3xl p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8 mb-8">
                  <div className="size-20 sm:size-24 rounded-3xl overflow-hidden shadow-lg border-2 border-white dark:border-gray-700 shrink-0">
                    <img
                      src={profileAvatar}
                      alt={workerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight dark:text-white">
                        {workerName}
                      </h2>
                      <span className="material-symbols-outlined text-primary fill-current text-[24px]">
                        verified
                      </span>
                    </div>
                    <p className="text-sm font-bold text-primary mb-4">
                      {workerTitle}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-widest text-gray-500 rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-gray-500">
                      <span className="px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-800">
                        {area}
                      </span>
                      {phone ? (
                        <span className="px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-800">
                          {phone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    My Bio
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    "{bio}"
                  </p>
                </div>
              </div>

              {/* Physical Service Gallery - The Proof */}
              <div className="portal-panel rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-extrabold tracking-tight dark:text-white">
                    Service Gallery
                  </h3>
                  <button
                    onClick={() => navigate("/worker/edit-profile")}
                    className="text-sm font-bold text-primary"
                  >
                    Update Gallery
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolio.map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="aspect-square rounded-3xl overflow-hidden bg-gray-100 group relative"
                    >
                      <img
                        src={getUploadedImageUrl(imageUrl)}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ))}
                  <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-300 gap-2 hover:bg-gray-50 cursor-pointer transition-colors">
                    {portfolio.length ? (
                      <span className="material-symbols-outlined text-4xl">
                        add
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl">
                          add_a_photo
                        </span>
                        <p className="px-4 text-center text-xs font-semibold">
                          Add your work photos
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Report Status Updates (Moved up or kept here) */}

              <div className="portal-panel rounded-3xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-extrabold tracking-tight dark:text-white">
                    Report Status Updates
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {workerReports.length} total
                  </span>
                </div>

                {recentReportUpdates.length ? (
                  <div className="space-y-3">
                    {recentReportUpdates.map((report) => (
                      <div
                        key={report.id}
                        className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/60 dark:bg-gray-900/30 flex flex-col gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-xs font-bold text-[#120e1b] dark:text-white uppercase tracking-wider">
                              {report.type}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                report.status === "resolved"
                                  ? "bg-green-100 text-green-700"
                                  : report.status === "investigating"
                                    ? "bg-blue-100 text-blue-700"
                                    : report.status === "dismissed"
                                      ? "bg-gray-200 text-gray-700"
                                      : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                            {report.adminFeedback?.trim()
                              ? report.adminFeedback
                              : "No admin note yet."}
                          </p>
                          <p className="text-[10px] font-semibold text-gray-400 mt-2">
                            {report.resolvedAt
                              ? `Updated ${new Date(report.resolvedAt).toLocaleString()}`
                              : `Submitted ${new Date(report.createdAt).toLocaleString()}`}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setIsReportDetailModalOpen(true);
                          }}
                          className="w-full h-8 bg-white dark:bg-gray-800 hover:bg-primary text-gray-700 dark:text-gray-300 hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-4 text-center">
                    <p className="text-xs font-semibold text-gray-500">
                      No reports linked to your account yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Direct Contact Options */}
              <div className="portal-panel rounded-3xl p-8">
                <h4 className="text-lg font-extrabold tracking-tight mb-6 flex items-center gap-2 dark:text-white text-[#120e1b]">
                  <span className="material-symbols-outlined text-green-500 text-[24px]">
                    contact_phone
                  </span>
                  My Contact Info
                </h4>
                <div className="space-y-4">
                  <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Phone
                    </p>
                    <p className="text-base font-bold tracking-tight dark:text-white text-[#120e1b]">
                      {phone || "Add your phone number"}
                    </p>
                  </div>
                  <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Telegram
                    </p>
                    <p className="text-base font-bold tracking-tight dark:text-white text-[#120e1b]">
                      {telegramUsername
                        ? `@${telegramUsername.replace(/^@+/, "")}`
                        : "Add your Telegram username"}
                    </p>
                  </div>
                  <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      TikTok
                    </p>
                    <p className="text-base font-bold tracking-tight break-all dark:text-white text-[#120e1b]">
                      {tiktokProfile || "Add your TikTok profile link"}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-6 leading-relaxed italic">
                  Clients in Hawassa will use these to contact you directly for
                  physical jobs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                  {selectedReport.status}
                </span>
              </div>
              <h4 className="text-lg font-semibold dark:text-white tracking-tight">
                {selectedReport.type}
              </h4>
              <p className="text-sm text-primary font-medium">
                Submitted by {selectedReport.reporterUser?.name ?? "Client"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Client Description
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{selectedReport.text}"
                </p>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-1.5">
                  Admin Resolution
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                  {selectedReport.adminFeedback?.trim() || "No admin note yet."}
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
  </div>
);
};

export default WorkerHubPage;
