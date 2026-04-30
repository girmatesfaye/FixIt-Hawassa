import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import ActionMenu from "../components/ActionMenu";
import toast from "react-hot-toast";
import { RequestStatus } from "../types";
import {
  ApiRequestStatus,
  ClientRequestItem,
  confirmRequestCompletion,
  fetchClientRequests,
  submitWorkerReport,
  submitWorkerReview,
} from "../services/clientRequests";
import { getAuthToken } from "../services/auth";

type RequestCard = {
  id: string;
  apiStatus: ApiRequestStatus;
  title: string;
  category: string;
  status: RequestStatus;
  date: string;
  worker: string | null;
  workerId: string | null;
  lastDeclinedWorker: string | null;
  lastDeclinedAt: string | null;
  avatar?: string;
  cost: string;
  hasMessagesAccess: boolean;
  workerMarkedCompleteAt: string | null;
};

const mapStatus = (status: ApiRequestStatus): RequestStatus => {
  if (status === "IN_PROGRESS") return RequestStatus.IN_PROGRESS;
  if (status === "PENDING") return RequestStatus.PENDING;
  if (status === "COMPLETED") return RequestStatus.COMPLETED;
  return RequestStatus.SEARCHING;
};

const formatDate = (isoDate: string): string => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const toRequestCard = (request: ClientRequestItem): RequestCard => {
  return {
    id: request.id,
    apiStatus: request.status,
    title: `${request.category} Request`,
    category: request.category,
    status: mapStatus(request.status),
    date: formatDate(request.createdAt),
    worker: request.assignedWorkerId ? request.assignedWorkerId.name : null,
    workerId: request.assignedWorkerId ? request.assignedWorkerId._id : null,
    lastDeclinedWorker: request.lastDeclinedWorkerId?.name ?? null,
    lastDeclinedAt: request.lastDeclinedAt ?? null,
    avatar: request.assignedWorkerId
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.assignedWorkerId._id}`
      : undefined,
    cost: "Pending Quotes",
    hasMessagesAccess: Boolean(request.assignedWorkerId),
    workerMarkedCompleteAt: request.workerMarkedCompleteAt ?? null,
  };
};

const MyRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    "http://localhost:4000";
  const [activeTab, setActiveTab] = useState<"Active" | "History">("Active");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [requests, setRequests] = useState<RequestCard[]>([]);
  const [confirmingRequestId, setConfirmingRequestId] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedFeedbackRequest, setSelectedFeedbackRequest] =
    useState<RequestCard | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reportReason, setReportReason] = useState("Overcharging");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reviewedRequestIds, setReviewedRequestIds] = useState<string[]>([]);
  const [reportedRequestIds, setReportedRequestIds] = useState<string[]>([]);
  const [currentUserName, setCurrentUserName] = useState("");

  const loadRequests = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await fetchClientRequests();
      setRequests(data.map(toRequestCard));
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        navigate("/login");
        return;
      }
      setLoadError("Could not load your requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setCurrentUserName("");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("UNAUTHORIZED");
        }

        const result = (await response.json().catch(() => null)) as {
          user?: { name?: string };
        } | null;

        setCurrentUserName(result?.user?.name ?? "");
      } catch {
        setCurrentUserName("");
      }
    };

    void loadCurrentUser();
  }, []);

  const handleConfirmCompletion = async (requestId: string) => {
    setConfirmingRequestId(requestId);
    setLoadError("");

    try {
      await confirmRequestCompletion(requestId);
      await loadRequests();
      toast.success("Job completion confirmed!");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        navigate("/login");
        return;
      }

      const msg =
        error instanceof Error
          ? error.message
          : "Could not confirm completion.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setConfirmingRequestId("");
    }
  };

  const filteredRequests = useMemo(() => {
    if (activeTab === "Active") {
      return requests.filter(
        (request) => request.status !== RequestStatus.COMPLETED,
      );
    }

    return requests.filter(
      (request) => request.status === RequestStatus.COMPLETED,
    );
  }, [activeTab, requests]);

  const openReviewModal = (request: RequestCard) => {
    if (!request.workerId) {
      return;
    }
    setSelectedFeedbackRequest(request);
    setRatingValue(5);
    setReviewComment("");
    setIsReviewModalOpen(true);
  };

  const openReportModal = (request: RequestCard) => {
    if (!request.workerId) {
      return;
    }
    setSelectedFeedbackRequest(request);
    setReportReason("Overcharging");
    setReportDescription("");
    setIsReportModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedFeedbackRequest?.workerId) {
      return;
    }

    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      setLoadError("Please write a review comment before submitting.");
      return;
    }

    setIsSubmittingReview(true);
    setLoadError("");
    try {
      await submitWorkerReview({
        workerId: selectedFeedbackRequest.workerId,
        requestId: selectedFeedbackRequest.id,
        rating: ratingValue,
        comment: trimmedComment,
      });

      setReviewedRequestIds((prev) =>
        prev.includes(selectedFeedbackRequest.id)
          ? prev
          : [...prev, selectedFeedbackRequest.id],
      );
      setIsReviewModalOpen(false);
      setSelectedFeedbackRequest(null);
      setReviewComment("");
      toast.success("Review submitted successfully!");
      await loadRequests();
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        navigate("/login");
        return;
      }

      const msg = error instanceof Error ? error.message : "Could not submit review.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedFeedbackRequest?.workerId) {
      return;
    }

    const trimmedDescription = reportDescription.trim();
    if (!trimmedDescription) {
      setLoadError("Please describe your report before submitting.");
      return;
    }

    setIsSubmittingReport(true);
    setLoadError("");
    try {
      await submitWorkerReport({
        workerId: selectedFeedbackRequest.workerId,
        requestId: selectedFeedbackRequest.id,
        type: reportReason,
        text: trimmedDescription,
      });

      setReportedRequestIds((prev) =>
        prev.includes(selectedFeedbackRequest.id)
          ? prev
          : [...prev, selectedFeedbackRequest.id],
      );
      setIsReportModalOpen(false);
      setSelectedFeedbackRequest(null);
      setReportDescription("");
      toast.success("Report submitted to administration.");
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        navigate("/login");
        return;
      }

      const msg = error instanceof Error ? error.message : "Could not submit report.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <main className="flex-1 max-w-[1000px] mx-auto w-full px-4 py-10">
      <div className="flex flex-col gap-8">

          <div>
            <h1 className="text-3xl font-bold text-[#120e1b] dark:text-white mb-2">
              My Requests
            </h1>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
              Manage and track your service calls
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("Active")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "Active" ? "bg-white dark:bg-surface-dark text-primary shadow-sm" : "text-gray-500 hover:text-primary"}`}
            >
              Active Requests
            </button>
            <button
              onClick={() => setActiveTab("History")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "History" ? "bg-white dark:bg-surface-dark text-primary shadow-sm" : "text-gray-500 hover:text-primary"}`}
            >
              Order History
            </button>
          </div>

          {/* List */}
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 dark:border-gray-700 border-t-primary dark:border-t-primary"></div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Loading requests...
                </p>
              </div>
            ) : loadError ? (
              <div className="py-20 flex flex-col items-center gap-4 text-center">
                <h3 className="text-xl font-bold text-[#120e1b] dark:text-white">
                  Could not load requests
                </h3>
                <p className="text-sm text-gray-500">{loadError}</p>
                <button
                  onClick={() => {
                    void loadRequests();
                  }}
                  className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-5 flex-1">
                      <div
                        className={`size-14 rounded-2xl flex items-center justify-center ${
                          req.category === "Plumbing"
                            ? "bg-blue-50 text-blue-600"
                            : req.category === "Electrical"
                              ? "bg-amber-50 text-amber-600"
                              : req.category === "Painting"
                                ? "bg-purple-50 text-purple-600"
                                : "bg-green-50 text-green-600"
                        } dark:bg-opacity-10`}
                      >
                        <span className="material-symbols-outlined text-3xl">
                          {req.category === "Plumbing"
                            ? "plumbing"
                            : req.category === "Electrical"
                              ? "electric_bolt"
                              : req.category === "Painting"
                                ? "format_paint"
                                : "carpenter"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-bold text-[#120e1b] dark:text-white">
                            {req.title}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              req.status === RequestStatus.IN_PROGRESS
                                ? "bg-blue-100 text-blue-700"
                                : req.status === RequestStatus.SEARCHING
                                  ? "bg-amber-100 text-amber-700"
                                  : req.status === RequestStatus.PENDING
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">
                              calendar_today
                            </span>{" "}
                            {req.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">
                              payments
                            </span>{" "}
                            {req.cost}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 dark:border-gray-800">
                      {req.worker ? (
                        <div className="flex items-center gap-3 mr-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                              {req.status === RequestStatus.PENDING
                                ? "Awaiting Reply"
                                : "Assigned Pro"}
                            </p>
                            <p className="text-sm font-bold text-[#120e1b] dark:text-white">
                              {req.worker}
                            </p>
                          </div>
                          <img
                            src={req.avatar!}
                            className="size-10 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                            alt=""
                          />
                        </div>
                      ) : (
                        <div className="mr-8">
                          {req.lastDeclinedWorker &&
                          req.status === RequestStatus.SEARCHING ? (
                            <div>
                              <p className="text-[10px] font-semibold text-red-600 uppercase tracking-widest flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  warning
                                </span>
                                Last invite declined
                              </p>
                              <p className="text-xs font-semibold text-gray-500 mt-1">
                                {req.lastDeclinedWorker} declined. Find another pro?
                              </p>
                              <Link 
                                to="/search-results" 
                                state={{ category: req.category }}
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                              >
                                View Recommended Pros
                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              </Link>
                            </div>
                          ) : (
                            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] animate-pulse">
                                info
                              </span>
                              Searching for pros
                            </p>
                          )}
                        </div>
                      )}
                      <ActionMenu
                        actions={(() => {
                          const base = [
                            {
                              label: req.hasMessagesAccess
                                ? "Open Chat"
                                : "Track Order",
                              onClick: () =>
                                req.hasMessagesAccess
                                  ? navigate("/messages", {
                                      state: { requestId: req.id },
                                    })
                                  : navigate("/search-results"),
                            },
                          ];

                          if (req.apiStatus === "COMPLETED" && req.workerId) {
                            base.push(
                              {
                                label: reviewedRequestIds.includes(req.id)
                                  ? "Rated"
                                  : "Rate Worker",
                                onClick: () => openReviewModal(req),
                                disabled: reviewedRequestIds.includes(req.id),
                              },
                              {
                                label: reportedRequestIds.includes(req.id)
                                  ? "Reported"
                                  : "Report Worker",
                                onClick: () => openReportModal(req),
                                disabled: reportedRequestIds.includes(req.id),
                              },
                            );
                          }

                          if (
                            req.apiStatus === "IN_PROGRESS" &&
                            req.workerMarkedCompleteAt
                          ) {
                            base.push({
                              label:
                                confirmingRequestId === req.id
                                  ? "Confirming..."
                                  : "Confirm Complete",
                              onClick: () =>
                                void handleConfirmCompletion(req.id),
                              disabled: confirmingRequestId === req.id,
                            });
                          }

                          return base;
                        })()}
                      />
                    </div>
                  </div>
                ))}
                {filteredRequests.length === 0 && (
                  <div className="py-20 flex flex-col items-center gap-4 text-center">
                    <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <span className="material-symbols-outlined text-5xl">
                        history
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#120e1b] dark:text-white">
                        No requests found
                      </h3>
                      <p className="text-sm text-gray-500">
                        You haven't made any requests in this category yet.
                      </p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="mt-4 px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                      Book a Service
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedFeedbackRequest(null);
        }}
        title="Rate Worker"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Share your experience for
            <span className="font-bold text-[#120e1b] dark:text-white">
              {" "}
              {selectedFeedbackRequest?.worker ?? "this worker"}
            </span>
            .
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Rating
            </label>
            <select
              value={ratingValue}
              onChange={(e) => setRatingValue(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} Star{value > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Comment
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              placeholder="How was the quality, communication, and timeliness?"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <button
            onClick={() => {
              void handleSubmitReview();
            }}
            disabled={isSubmittingReview}
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-widest disabled:opacity-60"
          >
            {isSubmittingReview ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedFeedbackRequest(null);
        }}
        title="Report Worker"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tell us what went wrong with
            <span className="font-bold text-[#120e1b] dark:text-white">
              {" "}
              {selectedFeedbackRequest?.worker ?? "this worker"}
            </span>
            .
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Reason
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="Overcharging">Overcharging</option>
              <option value="Poor Quality">Poor Quality</option>
              <option value="Unprofessional Behavior">
                Unprofessional Behavior
              </option>
              <option value="No Show">No Show</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Description
            </label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              rows={4}
              placeholder="Provide details to help admin investigate."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <button
            onClick={() => {
              void handleSubmitReport();
            }}
            disabled={isSubmittingReport}
            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-60"
          >
            {isSubmittingReport ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </Modal>
    </main>
  );
};

export default MyRequestsPage;
