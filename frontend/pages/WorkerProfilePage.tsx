import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import Modal from "../components/Modal";
import { getAuthToken } from "../services/auth";
import {
  assignWorkerToRequest,
  submitWorkerReport,
  submitWorkerReview,
} from "../services/clientRequests";

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

  const fetchWorker = async () => {
    try {
      if (!id) return;
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
        const profileAvatar = toPublicAssetUrl(profile?.avatar ?? "");

        setWorker({
          id: workerData.id,
          name: workerData.name,
          title: profile?.title || profile?.skills?.[0] || "",
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
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.clientId?._id || "A"}`,
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
        alert(
          "Open this profile from your completed request to submit feedback.",
        );
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
      fetchWorker();
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        navigate("/login");
        return;
      }

      alert(error instanceof Error ? error.message : "Failed to submit review");
    }
  };

  const submitReport = async () => {
    try {
      if (!existingRequestId || !id) {
        alert(
          "Open this profile from your completed request to submit a report.",
        );
        return;
      }

      await submitWorkerReport({
        workerId: id,
        requestId: existingRequestId,
        type: reportReason,
        text: reportDescription,
      });

      setIsReportModalOpen(false);
      setReportDescription("");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        navigate("/login");
        return;
      }

      alert(error instanceof Error ? error.message : "Failed to submit report");
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
        alert("Invitation sent. You can track it in My Requests.");
        navigate("/my-requests");
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
        alert("Invitation sent. You can track it in My Requests.");
        navigate("/my-requests");
      } else {
        alert("Failed to submit request");
      }
    } catch (e) {
      console.error(e);
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
    <div className="min-h-screen bg-[#f8fafd] dark:bg-background-dark font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="size-9 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined font-bold">
                  handyman
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight dark:text-white">
                FixIt Hawassa
              </h2>
            </Link>
          </div>

          <div className="flex-grow max-w-md hidden md:block">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search workers..."
                className="w-full h-10 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/login"
              className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-all shadow-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="flex-grow flex flex-col gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div className="relative shrink-0">
                <div className="size-40 rounded-full border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden">
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
                  <div className="inline-flex items-center gap-3 ml-2">
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

            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-6">
                About Me
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                {worker.about}
              </p>
            </div>

            {/* Portfolio Section */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white">
                  Proof of Work
                </h3>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  {portfolioItems.length} Projects
                </span>
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

            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
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
          <div className="w-full lg:w-[360px] flex flex-col gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 sticky top-24">
              <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-6">
                Contact {worker.name.split(" ")[0]}
              </h3>

              <div className="flex flex-col gap-3 mb-6">
                <button
                  onClick={() => setIsContactOpen(!isContactOpen)}
                  className={`h-14 w-full flex items-center justify-between px-6 rounded-xl font-bold uppercase tracking-widest transition-all ${
                    isContactOpen
                      ? "bg-gray-100 dark:bg-gray-800 text-primary"
                      : "bg-primary hover:bg-primary-dark text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">
                      {isContactOpen ? "contact_mail" : "person_add"}
                    </span>
                    Contact Worker
                  </div>
                  <span
                    className={`material-symbols-outlined transition-transform duration-300 ${isContactOpen ? "rotate-180" : ""}`}
                  >
                    expand_more
                  </span>
                </button>

                <div
                  className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ${
                    isContactOpen
                      ? "max-h-[300px] opacity-100 mt-2"
                      : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  <a
                    href={worker.phone ? `tel:${worker.phone}` : "#"}
                    className="group relative h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-500/25 active:scale-95 overflow-hidden text-sm"
                  >
                    <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="material-symbols-outlined relative z-10 text-[20px]">
                      call
                    </span>
                    <span className="relative z-10">
                      {worker.phone
                        ? `Call ${worker.phone}`
                        : "Phone not available"}
                    </span>
                  </a>
                  <button
                    onClick={hireDirectly}
                    disabled={isHiring}
                    className="group relative h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/25 active:scale-95 overflow-hidden text-sm"
                  >
                    <span className="material-symbols-outlined relative z-10 text-[20px]">
                      work
                    </span>
                    <span className="relative z-10">
                      {isHiring ? "Sending..." : "Send Work Request"}
                    </span>
                  </button>

                  {worker.telegramUsername ? (
                    <a
                      href={toTelegramUrl(worker.telegramUsername)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative h-14 bg-[#26a5e4] hover:bg-[#1e8ec5] text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#26a5e4]/25 active:scale-95 overflow-hidden text-sm"
                    >
                      <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                      <span className="material-symbols-outlined relative z-10 text-[20px]">
                        send
                      </span>
                      <span className="relative z-10">Telegram Message</span>
                    </a>
                  ) : null}

                  {worker.tiktokProfile ? (
                    <a
                      href={worker.tiktokProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative h-14 bg-[#111827] hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-black/25 active:scale-95 overflow-hidden text-sm"
                    >
                      <span className="material-symbols-outlined relative z-10 text-[20px]">
                        smart_display
                      </span>
                      <span className="relative z-10">View TikTok</span>
                    </a>
                  ) : null}
                </div>
              </div>

              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full h-14 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 hover:border-amber-500 dark:hover:border-amber-500 text-[#120e1b] dark:text-white hover:text-amber-500 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors active:scale-95 flex items-center justify-center gap-2 mb-6"
              >
                <span className="material-symbols-outlined text-[18px]">
                  star
                </span>
                Write a Review
              </button>

              {!existingRequestId ? (
                <p className="text-[11px] text-amber-600 font-semibold mb-4">
                  Open this worker from your completed request to submit review
                  or report.
                </p>
              ) : null}

              <div className="flex justify-center">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    flag
                  </span>
                  Report Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedGalleryIdx !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300"
          onClick={() => setSelectedGalleryIdx(null)}
        >
          <button className="absolute top-6 right-6 text-white hover:text-primary transition-colors z-[70]">
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>

          <div
            className="relative w-full max-w-5xl h-full flex items-center justify-center p-4 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={prevImage}
              className="absolute left-4 md:left-8 size-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all z-[70]"
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
              className="absolute right-4 md:right-8 size-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all z-[70]"
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
          © 2024 FixIt Hawassa.
        </p>
      </footer>
    </div>
  );
};

export default WorkerProfilePage;
