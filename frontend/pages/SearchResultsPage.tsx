import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { RequestDraft, WorkerRecommendation } from "../types";
import {
  fetchRecommendations,
  getRecommendationReasons,
  LAST_CREATED_REQUEST_ID_KEY,
  LAST_REQUEST_KEY,
} from "../services/recommendation";

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const PAGE_SIZE = 12;
  const [distance, setDistance] = useState(5);
  const [minRating, setMinRating] = useState(4.4);
  const [onlyActive, setOnlyActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [workers, setWorkers] = useState<WorkerRecommendation[]>([]);
  const [recommendationSource, setRecommendationSource] = useState("");
  const [snapshotCreatedAt, setSnapshotCreatedAt] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const requestDraft = useMemo((): RequestDraft | null => {
    const fromState = (location.state as { requestDraft?: RequestDraft } | null)
      ?.requestDraft;
    if (fromState) {
      return fromState;
    }

    const savedDraft = localStorage.getItem(LAST_REQUEST_KEY);
    if (!savedDraft) {
      return null;
    }

    try {
      return JSON.parse(savedDraft) as RequestDraft;
    } catch {
      return null;
    }
  }, [location.state]);

  const requestId =
    ((location.state as { requestId?: string } | null)?.requestId as
      | string
      | undefined) ??
    localStorage.getItem(LAST_CREATED_REQUEST_ID_KEY) ??
    "";

  useEffect(() => {
    if (!requestDraft || !requestId) {
      setWorkers([]);
      setIsLoading(false);
      setLoadError(
        "Create a service request first to see personalized recommendations.",
      );
      return;
    }

    setIsLoading(true);
    setLoadError("");

    fetchRecommendations(requestId, {
      maxDistanceKm: distance,
      minRating,
      onlyActive,
      page: 1,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        setWorkers(result.recommendations);
        setRecommendationSource(result.source);
        setSnapshotCreatedAt(result.snapshotCreatedAt ?? "");
        setCurrentPage(result.page);
        setTotalWorkers(result.total);
        setHasMore(result.hasMore);
      })
      .catch((error) => {
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          navigate("/login");
          return;
        }

        setWorkers([]);
        setLoadError("Could not load recommendations. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [distance, minRating, onlyActive, requestDraft, requestId]);

  const handleLoadMore = () => {
    if (!requestId || isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    fetchRecommendations(requestId, {
      maxDistanceKm: distance,
      minRating,
      onlyActive,
      page: currentPage + 1,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        setWorkers((previous) => [...previous, ...result.recommendations]);
        setCurrentPage(result.page);
        setTotalWorkers(result.total);
        setHasMore(result.hasMore);
      })
      .catch((error) => {
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          navigate("/login");
          return;
        }
        setLoadError("Could not load more recommendations.");
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] dark:bg-background-dark font-sans flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md dark:bg-surface-dark/90 border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="size-9 bg-primary rounded-lg flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined font-semibold text-xl">
                handyman
              </span>
            </div>
            <h2 className="text-base font-bold tracking-tight dark:text-white hidden sm:block">
              FixIt Hawassa
            </h2>
          </Link>

          <div className="flex-grow max-w-xl">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary text-[20px]">
                search
              </span>
              <input
                type="text"
                defaultValue={`${requestDraft?.category ?? "Plumbing"} in ${requestDraft?.area ?? "Hawassa"}`}
                className="w-full h-10 pl-10 pr-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => navigate("/request-service")}
              className="hidden sm:flex px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:bg-primary-dark transition-all"
            >
              New Request
            </button>
            <div className="size-9 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&h=100&auto=format&fit=crop"
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1440px] mx-auto w-full p-6 gap-8">
        {/* Sidebar Filters */}
        <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-8">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold tracking-tight text-[#120e1b] dark:text-white">
                Filters
              </h2>
              <button className="text-xs font-medium text-primary hover:underline">
                Reset
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sort By
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {["Recommended", "Top Rated", "Near Me"].map((opt) => (
                    <button
                      key={opt}
                      className={`h-9 px-3 text-left rounded-lg text-sm font-medium transition-all ${opt === "Recommended" ? "bg-primary text-white shadow-sm" : "bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary"}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Max Distance
                  </label>
                  <span className="text-sm font-medium text-primary">
                    {distance}km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={distance}
                  onChange={(e) => setDistance(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Min Rating
                  </label>
                  <span className="text-sm font-medium text-primary">
                    {minRating.toFixed(1)}+
                  </span>
                </div>
                <input
                  type="range"
                  min="3.5"
                  max="5"
                  step="0.1"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                  className="accent-primary"
                />
                Only show available workers
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#120e1b] dark:text-white tracking-tight">
              Hand-picked Pros
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Verified professionals available for physical work near you.
            </p>
            {requestDraft ? (
              <p className="text-xs text-primary font-semibold">
                Request #{requestId || "-"}: {requestDraft.category} •{" "}
                {requestDraft.area} • {requestDraft.maintenanceLevel}
              </p>
            ) : (
              <p className="text-xs text-amber-600 font-semibold">
                No saved request context found. Create a request to continue.
              </p>
            )}
            {recommendationSource ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Source: {recommendationSource}
              </p>
            ) : null}
            {snapshotCreatedAt ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Snapshot: {new Date(snapshotCreatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 dark:border-gray-700 border-t-primary dark:border-t-primary"></div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Loading verified pros...
              </p>
            </div>
          ) : loadError ? (
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-10 border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-lg font-semibold text-[#120e1b] dark:text-white">
                Recommendation unavailable
              </p>
              <p className="text-sm text-gray-500 mt-2">{loadError}</p>
              <button
                onClick={() => navigate("/request-service")}
                className="mt-4 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold"
              >
                Create Request
              </button>
            </div>
          ) : (
            <>
              {/* Simplified Workers Grid */}
              {workers.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-4 hover:shadow-md hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="relative">
                          <img
                            src={worker.avatar}
                            className="size-20 rounded-2xl object-cover shadow-sm border-2 border-white dark:border-gray-700"
                            alt={worker.name}
                          />
                          <div className="absolute -bottom-1 -right-1 size-6 bg-green-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-surface-dark shadow-sm">
                            <span className="material-symbols-outlined text-[12px] font-bold">
                              verified
                            </span>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <h3 className="text-base font-semibold text-[#120e1b] dark:text-white truncate">
                            {worker.name}
                          </h3>
                          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="material-symbols-outlined text-primary text-[14px]">
                              location_on
                            </span>
                            {worker.location}
                          </div>
                          <p className="text-[11px] text-gray-400">
                            {worker.distanceKm.toFixed(1)} km away
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                          <span className="material-symbols-outlined text-amber-400 text-sm fill-current">
                            star
                          </span>
                          <span className="text-sm font-medium text-[#120e1b] dark:text-white">
                            {worker.rating} ({worker.reviews})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {getRecommendationReasons(worker, requestDraft).map(
                            (reason) => (
                              <span
                                key={`${worker.id}-${reason}`}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                              >
                                {reason}
                              </span>
                            ),
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-center w-full">
                        <button
                          onClick={() => navigate(`/worker/${worker.id}`)}
                          className="w-full h-10 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-10 border border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-lg font-semibold text-[#120e1b] dark:text-white">
                    No workers match your filters
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try increasing max distance or lowering minimum rating.
                  </p>
                </div>
              )}

              {/* Simplified Load More */}
              <div className="flex flex-col items-center gap-3 py-8">
                {hasMore ? (
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:border-primary shadow-sm transition-all md:w-auto w-full disabled:opacity-60"
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </button>
                ) : null}
                <p className="text-xs text-gray-400">
                  Showing {workers.length} of {totalWorkers} recommended pros
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;
