import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import Modal from "../components/Modal";
import { getAuthToken } from "../services/auth";
import toast from "react-hot-toast";
import {
  assignWorkerToRequest,
  submitWorkerReport,
  submitWorkerReview,
} from "../services/clientRequests";
import { getUploadedImageUrl } from "../services/upload";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

type WorkerApiResponse = {
  worker?: {
    id?: string;
    name?: string;
    phone?: string;
    profile?: {
      title?: string;
      bio?: string;
      area?: string;
      skills?: string[];
      isActive?: boolean;
      avatar?: string;
      portfolio?: string[];
      rating?: number;
      reviews?: number;
      telegramUsername?: string;
      tiktokProfile?: string;
    };
    reviews?: Array<{
      _id?: string;
      clientId?: {
        _id?: string;
        fullName?: string;
      };
      createdAt?: string;
      rating?: number;
      comment?: string;
    }>;
  };
};

type WorkerViewModel = {
  id: string;
  name: string;
  title: string;
  skills: string[];
  rating: number;
  reviews: number;
  location: string;
  isAvailable: boolean;
  avatar: string;
  about: string;
  serviceId: string;
  phone: string;
  telegramUsername: string;
  tiktokProfile: string;
  portfolio: string[];
};

const toPublicAssetUrl = (value: string): string => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
};

const toTelegramUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const username = trimmed.replace(/^@+/, "");
  return `https://t.me/${username}`;
};

const WorkerProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number | null>(
    null,
  );

  const [ratingValue, setRatingValue] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reportReason, setReportReason] = useState("Overcharging");
  const [reportDescription, setReportDescription] = useState("");
  const [isHiring, setIsHiring] = useState(false);

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<WorkerViewModel | null>(null);
  const [recentReviews, setRecentReviews] = useState<
    Array<{
      id: string;
      name: string;
      avatar: string;
      date: string;
      rating: number;
      comment: string;
    }>
  >([]);
  const existingRequestId =
    (location.state as { requestId?: string } | null)?.requestId ?? "";

  const [clientRequests, setClientRequests] = useState<any[]>([]);
  
  // Engagement levels - Improved to find the MOST RELEVANT request
  const currentEngagement = React.useMemo(() => {
    // 1. If we came from a specific request, that's our source of truth
    if (existingRequestId) {
      return clientRequests.find(r => r.id === existingRequestId || r._id === existingRequestId);
    }
    
    // 2. Otherwise, find the LATEST request with this worker
    const workerRequests = clientRequests
      .filter(r => String(r.assignedWorkerId?._id || r.assignedWorkerId) === String(id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
    return workerRequests[0]; // Latest one
  }, [clientRequests, id, existingRequestId]);
  
  const isEngagementAccepted = currentEngagement && 
    (currentEngagement.status === "IN_PROGRESS" || currentEngagement.status === "COMPLETED");
    
  const isEngagementCompleted = currentEngagement && 
    currentEngagement.status === "COMPLETED";

  const fetchWorker = async () => {
    try {
      if (!id) return;
      
      // Also fetch client's own requests to check for engagement
      const token = getAuthToken();
      if (token) {
        fetch(`${API_BASE_URL}/requests/mine`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.requests)) {
            setClientRequests(data.requests);
          }
        })
        .catch(() => {});
      }

      const res = await fetch(`${API_BASE_URL}/workers/${id}`);
      if (res.ok) {
        const data = (await res.json()) as WorkerApiResponse;
        const workerData = data.worker;
        if (!workerData?.id || !workerData.name) {
          setWorker(null);
          return;
        }

        const profile = workerData.profile;
        const resolvedReviews = Array.isArray(workerData.reviews)
          ? workerData.reviews
          : [];

        const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${workerData.id}`;
        const profileAvatar = toPublicAssetUrl(workerData.avatar || profile?.avatar || "");

        setWorker({
          id: workerData.id,
          name: workerData.name,
          title: profile?.title || profile?.skills?.[0] || "",
          skills: Array.isArray(profile?.skills)
            ? profile.skills.filter(Boolean)
            : [],
          rating: Number(profile?.rating ?? 0),
          reviews: Number(profile?.reviews ?? resolvedReviews.length),
          location: profile?.area?.trim() || "Hawassa",
          isAvailable: profile?.isActive ?? true,
          avatar: profileAvatar || fallbackAvatar,
          about: profile?.bio || "No bio has been added yet.",
          serviceId: `#FH-${workerData.id.slice(-4).toUpperCase()}`,
          phone: workerData.phone || "",
          telegramUsername: profile?.telegramUsername || "",
          tiktokProfile: profile?.tiktokProfile || "",
          portfolio: (profile?.portfolio ?? []).map((item) =>
            toPublicAssetUrl(item),
          ),
        });
        setRecentReviews(
          resolvedReviews.map((r) => ({
            id: r._id || `${workerData.id}-${r.createdAt || Math.random()}`,
            name: r.clientId?.fullName || "Client",
            avatar: getUploadedImageUrl(r.clientId?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.clientId?.fullName || "A")}`,
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
            rating: Number(r.rating ?? 0),
            comment: r.comment || "",
          })),
        );
      }
    } catch (e) {
      console.error("Failed to load worker profile", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorker();
  }, [id]);

  const portfolioItems = (worker?.portfolio ?? []).map((url, index) => ({
    id: index + 1,
    url,
    title: `Project ${index + 1}`,
  }));

  const submitReview = async () => {
    try {
      if (!existingRequestId || !id) {
        toast.error("Open this profile from your completed request to submit feedback.");
        return;
      }

      await submitWorkerReview({
        workerId: id,
        requestId: existingRequestId,
        rating: ratingValue,
        comment: reviewComment,
      });

      setIsReviewModalOpen(false);
      setReviewComment("");
      toast.success("Review submitted! Thank you.");
      fetchWorker();
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        navigate("/login");
        return;
      }

      toast.error(error instanceof Error ? error.message : "Failed to submit review");
    }
  };

  const submitReport = async () => {
    try {
      // Validate based on engagement
      const needsJobToReport = ["Overcharging", "Poor Quality of Work", "No-show / Delay"].includes(reportReason);
      
      if (needsJobToReport && !currentEngagement) {
        toast.error(`You can only report for "${reportReason}" if you have an active or completed request with this worker.`);
        return;
      }

      if (!id) return;

      await submitWorkerReport({
        workerId: id,
        requestId: currentEngagement?.id || currentEngagement?._id || "PROFILE_REPORT",
        type: reportReason,
        text: reportDescription,
      });

      setIsReportModalOpen(false);
      setReportDescription("");
      toast.success("Report submitted and will be reviewed.");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        navigate("/login");
        return;
      }

      toast.error(error instanceof Error ? error.message : "Failed to submit report");
    }
  };

  const hireDirectly = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }
      setIsHiring(true);

      if (existingRequestId && id) {
        await assignWorkerToRequest(existingRequestId, id);
        toast.success("Invitation sent! Tracking enabled.");
        fetchWorker(); // Refresh engagement status
        navigate("/bookings");
        return;
      }

      const requestDraft = {
        category: worker?.title || "Direct Hire",
        description: `Direct request to hire ${worker?.name}.`,
        area: "Hawassa",
        landmark: "Provided in chat",
        maintenanceLevel: "Medium",
        hasPhotos: false,
        createdAt: new Date().toISOString(),
        assignedWorkerId: id,
      };

      const res = await fetch(`${API_BASE_URL}/requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestDraft),
      });
      if (res.ok) {
        toast.success("Invitation sent! Tracking enabled.");
        fetchWorker(); // Refresh engagement status
        navigate("/bookings");
      } else {
        toast.error("Failed to submit request.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong.");
    } finally {
      setIsHiring(false);
    }
  };

  const nextImage = () => {
    if (selectedGalleryIdx !== null) {
      setSelectedGalleryIdx((selectedGalleryIdx + 1) % portfolioItems.length);
    }
  };

  const prevImage = () => {
    if (selectedGalleryIdx !== null) {
      setSelectedGalleryIdx(
        (selectedGalleryIdx - 1 + portfolioItems.length) %
          portfolioItems.length,
      );
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!worker) return <div>Worker not found.</div>;

  return (
    <div className="w-full">


      {/* Main Content */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Left Column */}
          <div className="flex-grow flex flex-col gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8">
              <div className="relative shrink-0">
                <div className="size-28 sm:size-40 rounded-full border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden">
                  <img
                    src={worker.avatar}
                    alt={worker.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={`absolute bottom-2 right-2 size-6 border-4 border-white dark:border-surface-dark rounded-full ${worker.isAvailable ? "bg-green-500" : "bg-gray-400"}`}
                ></div>
              </div>
              <div className="flex flex-col items-center sm:items-start gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#120e1b] dark:text-white">
                      {worker.name}
                    </h1>
                  </div>
                  <div className="inline-flex items-center gap-3 sm:ml-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      {worker.isAvailable ? "Available" : "Unavailable"}
                    </span>
                    <button
                      disabled
                      className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${worker.isAvailable ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"}`}
                    >
                      <div
                        className={`bg-white size-5 rounded-full shadow-md transform transition-transform ${worker.isAvailable ? "translate-x-5" : "translate-x-0"}`}
                      ></div>
                    </button>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-500 dark:text-gray-400">
                  {worker.title}
                </p>
                {worker.skills.length ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {worker.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-500/20">
                    <span className="material-symbols-outlined text-amber-500 text-[18px] fill-current">
                      star
                    </span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400 ml-1">
                      {worker.rating.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-amber-600/70 dark:text-amber-400/70 ml-1">
                      ({worker.reviews} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                    <span className="material-symbols-outlined text-[18px]">
                      location_on
                    </span>
                    <span className="text-sm font-semibold">
                      {worker.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-6">
                About Me
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                {worker.about}
              </p>
            </div>

            {/* Portfolio Section */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
                <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white">
                  Proof of Work
                </h3>
                <div className="flex items-center gap-4">
                  {worker.tiktokProfile && (
                    <a
                      href={worker.tiktokProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-bold text-[#120e1b] dark:text-white hover:text-primary transition-colors border border-gray-100 dark:border-gray-700"
                    >
                      <span className="material-symbols-outlined text-[18px]">smart_display</span>
                      TikTok Portfolio
                    </a>
                  )}
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    {portfolioItems.length} Projects
                  </span>
                </div>
              </div>
              {portfolioItems.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolioItems.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedGalleryIdx(idx)}
                      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="material-symbols-outlined text-white text-3xl">
                          visibility
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This worker has not uploaded portfolio images yet.
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-8">
                Recent Reviews
              </h3>
              <div className="flex flex-col gap-6">
                {recentReviews.length ? (
                  recentReviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-50 dark:border-gray-800 pb-6 last:border-0 last:pb-0"
                    >
                      <p className="text-sm font-bold text-[#120e1b] dark:text-white mb-1">
                        {review.name}
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
                        {review.date}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                        "{review.comment}"
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No reviews yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 lg:sticky lg:top-24">
              <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-6">
                Contact {worker.name.split(" ")[0]}
              </h3>

              <div className="flex flex-col gap-3 mb-6">
                {!isEngagementAccepted ? (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm font-bold text-[#120e1b] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                        Secure Booking
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                        To protect your privacy and ensure safety, we hide contact details until a formal request is made and accepted.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Step 1 */}
                      <div className="flex gap-4">
                        <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${currentEngagement?.status === "PENDING" ? "bg-green-500 text-white" : "bg-primary text-white"}`}>
                          {currentEngagement?.status === "PENDING" ? "✓" : "1"}
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className={`text-xs font-bold ${currentEngagement?.status === "PENDING" ? "text-green-600 dark:text-green-400" : "text-[#120e1b] dark:text-white"}`}>
                            Send Invitation
                          </p>
                          <p className="text-[10px] font-medium text-gray-400">Describe your needs and invite {worker.name.split(" ")[0]}.</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-4">
                        <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${currentEngagement?.status === "PENDING" ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}>
                          2
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className={`text-xs font-bold ${currentEngagement?.status === "PENDING" ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}`}>
                            Worker Acceptance
                          </p>
                          <p className="text-[10px] font-medium text-gray-400">
                            {currentEngagement?.status === "PENDING" 
                              ? "Waiting for response..." 
                              : "Once accepted, contact details reveal automatically."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {currentEngagement?.status === "PENDING" ? (
                      <div className="flex flex-col gap-3">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 flex gap-2">
                          <span className="material-symbols-outlined text-amber-500 text-[18px]">info</span>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-tight">
                            Invitation is active! We'll notify you once they accept.
                          </p>
                        </div>
                        <button
                          disabled
                          className="h-12 w-full bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                          Waiting for Worker
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={hireDirectly}
                        disabled={isHiring}
                        className="h-14 w-full bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        <span className="material-symbols-outlined">person_add</span>
                        {isHiring ? "Sending..." : "Send Work Request"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-6 border border-green-100 dark:border-green-900/30 flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-sm font-bold text-green-700 dark:text-green-400">Contact Unlocked</h4>
                        <p className="text-[10px] font-bold text-green-600/70 dark:text-green-400/70 uppercase tracking-widest">Request Accepted</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <a
                        href={worker.phone ? `tel:${worker.phone}` : "#"}
                        className="h-12 bg-white dark:bg-gray-800 border-2 border-green-500/20 hover:border-green-500 text-green-600 dark:text-green-400 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-green-500 hover:text-white active:scale-95 text-xs shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                        {worker.phone || "Phone Hidden"}
                      </a>

                      {worker.telegramUsername && (
                        <a
                          href={toTelegramUrl(worker.telegramUsername)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-12 bg-[#26a5e4] hover:bg-[#1e8ec5] text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 text-xs shadow-md shadow-[#26a5e4]/20"
                        >
                          <span className="material-symbols-outlined text-[18px]">send</span>
                          Telegram Message
                        </a>
                      )}

                      <button
                        onClick={() => navigate("/messages", { state: { requestId: currentEngagement?._id || currentEngagement?.id } })}
                        className="h-12 w-full bg-primary text-white hover:bg-primary-dark rounded-xl font-bold flex items-center justify-center gap-3 transition-all text-xs shadow-md shadow-primary/20"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        Open FixIt Chat
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (!isEngagementCompleted) {
                      toast.error("You can only review a worker after a job is COMPLETED.");
                      return;
                    }
                    setIsReviewModalOpen(true);
                  }}
                  className={`w-full h-14 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isEngagementCompleted
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                      : "bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    star
                  </span>
                  Write a Review
                </button>
                
                <button
                  onClick={() => {
                    if (!isEngagementCompleted) {
                      toast.error("You can only report an issue after the job is COMPLETED.");
                      return;
                    }
                    setIsReportModalOpen(true);
                  }}
                  className={`w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                    isEngagementCompleted
                      ? "bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 hover:border-red-500 text-gray-500 hover:text-red-500"
                      : "bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">flag</span>
                  Report a Problem
                </button>

                {!isEngagementCompleted && (
                  <p className="text-[10px] text-center text-gray-400 font-medium px-4">
                    {currentEngagement 
                      ? "Reviewing & reporting will unlock once the job is marked as completed."
                      : "Reviewing & reporting are locked until a service request is marked as completed."}
                  </p>
                )}
              </div>
            </div>

            {/* Trust Footer */}
            <div className="p-6 bg-gray-50/50 dark:bg-gray-900/10 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-gray-400 text-lg">verified</span>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                  Every job booked through FixIt Hawassa is protected by our professional service guidelines. 
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>


      {/* Lightbox Modal */}
      {selectedGalleryIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300"
          onClick={() => setSelectedGalleryIdx(null)}
        >
          <button className="absolute top-6 right-6 text-white hover:text-primary transition-colors z-[110]">
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>

          <div
            className="relative w-full max-w-5xl h-full flex items-center justify-center p-4 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={prevImage}
              className="absolute left-4 md:left-8 size-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all z-[110]"
            >
              <span className="material-symbols-outlined text-3xl">
                chevron_left
              </span>
            </button>

            <div className="flex flex-col items-center gap-6 max-h-full max-w-full">
              <img
                src={portfolioItems[selectedGalleryIdx].url}
                alt={portfolioItems[selectedGalleryIdx].title}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              />
              <div className="text-center">
                <h4 className="text-white text-2xl font-bold tracking-tight mb-2">
                  {portfolioItems[selectedGalleryIdx].title}
                </h4>
                <p className="text-white/60 text-sm font-semibold uppercase tracking-widest">
                  Project {selectedGalleryIdx + 1} of {portfolioItems.length}
                </p>
              </div>
            </div>

            <button
              onClick={nextImage}
              className="absolute right-4 md:right-8 size-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all z-[110]"
            >
              <span className="material-symbols-outlined text-3xl">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Rate This Worker"
      >
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-4">
              How was your experience with {worker.name}?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className="transition-transform active:scale-125"
                >
                  <span
                    className={`material-symbols-outlined text-4xl ${star <= ratingValue ? "text-amber-400 fill-current" : "text-gray-200"}`}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Your Comments
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Tell others about the physical work done, punctuality, and quality..."
              className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-amber-500 text-sm resize-none dark:text-white"
            />
          </div>

          <button
            onClick={submitReview}
            className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all active:scale-95"
          >
            Submit Review
          </button>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Profile"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="size-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
              <img
                src={worker.avatar}
                alt={worker.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-bold text-[#120e1b] dark:text-white truncate">
                {worker.name}
              </h4>
              <p className="text-[10px] font-medium text-primary uppercase tracking-widest">
                {worker.title}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-red-500 text-sm font-medium dark:text-white appearance-none"
              >
                <option>Overcharging</option>
                <option>Unprofessional Behavior</option>
                <option>Poor Quality of Work</option>
                <option>No-show / Delay</option>
                <option>Inaccurate Profile</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Description
              </label>
              <textarea
                placeholder="What happened?"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full h-28 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-red-500 text-sm resize-none dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={submitReport}
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              Submit Report
            </button>
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="w-full h-10 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex gap-2">
            <span className="material-symbols-outlined text-red-500 text-[18px]">
              info
            </span>
            <p className="text-[10px] text-red-700 dark:text-red-400 font-semibold leading-tight">
              Reports are reviewed by admins. False reporting may lead to
              account suspension.
            </p>
          </div>
        </div>
      </Modal>

      <footer className="bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 py-10 mt-12 text-center">
        <p className="text-sm text-gray-400 font-medium">
          © 2026 FixIt Hawassa.
        </p>
      </footer>
    </div>
  );
};

export default WorkerProfilePage;
