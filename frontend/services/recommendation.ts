import { RequestDraft, WorkerRecommendation } from "../types";
import { clearSession, getAuthToken } from "./auth";

export const LAST_REQUEST_KEY = "fixit:lastRequestDraft";
export const LAST_CREATED_REQUEST_ID_KEY = "fixit:lastCreatedRequestId";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

export const fetchTopWorkers = async (filters?: {
  minRating?: number;
  onlyActive?: boolean;
  limit?: number;
}): Promise<WorkerRecommendation[]> => {
  const params = new URLSearchParams({
    minRating: String(filters?.minRating ?? 0),
    onlyActive: String(filters?.onlyActive ?? false),
    page: "1",
    limit: String(filters?.limit ?? 12),
  });

  const response = await fetch(
    `${API_BASE_URL}/recommendations/rank?${params.toString()}`,
  );
  const result = (await response.json().catch(() => null)) as {
    recommendations?: WorkerRecommendation[];
  } | null;

  if (!response.ok || !Array.isArray(result?.recommendations)) {
    throw new Error("RECOMMENDATION_LOAD_FAILED");
  }

  return result.recommendations;
};

const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 1;
  return (value - min) / (max - min);
};

export const getRecommendationReasons = (
  worker: WorkerRecommendation,
  request: RequestDraft | null,
): string[] => {
  const reasons: string[] = [];

  if (request && worker.area.toLowerCase() === request.area.toLowerCase()) {
    reasons.push("Same area");
  }

  if (worker.rating >= 4.8) {
    reasons.push("Top rated");
  }

  if (worker.responseMinutes <= 8) {
    reasons.push("Fast response");
  }

  if (
    request &&
    worker.skills.some((s) =>
      s.toLowerCase().includes(request.category.toLowerCase()),
    )
  ) {
    reasons.push("Category match");
  }

  return reasons.slice(0, 3);
};

export const rankWorkers = (
  workers: WorkerRecommendation[],
  request: RequestDraft | null,
  minRating: number,
  onlyActive: boolean,
): WorkerRecommendation[] => {
  const filtered = workers.filter((worker) => {
    const passRating = worker.rating >= minRating;
    const passActive = onlyActive ? worker.isActive : true;
    return passRating && passActive;
  });

  if (!filtered.length) {
    return [];
  }

  const maxReviews = Math.max(...filtered.map((w) => w.reviews));
  const minReviews = Math.min(...filtered.map((w) => w.reviews));

  return [...filtered].sort((a, b) => {
    const categoryBoostA = request
      ? a.skills.some((skill) =>
          skill.toLowerCase().includes(request.category.toLowerCase()),
        )
        ? 1
        : 0
      : 0;
    const categoryBoostB = request
      ? b.skills.some((skill) =>
          skill.toLowerCase().includes(request.category.toLowerCase()),
        )
        ? 1
        : 0
      : 0;

    const reviewScoreA = normalize(a.reviews, minReviews, maxReviews);
    const reviewScoreB = normalize(b.reviews, minReviews, maxReviews);

    const scoreA =
      a.rating * 0.35 +
      a.completionRate * 5 * 0.2 +
      (1 - Math.min(a.responseMinutes, 30) / 30) * 5 * 0.1 +
      reviewScoreA * 5 * 0.1 +
      categoryBoostA * 0.5;

    const scoreB =
      b.rating * 0.35 +
      b.completionRate * 5 * 0.2 +
      (1 - Math.min(b.responseMinutes, 30) / 30) * 5 * 0.1 +
      reviewScoreB * 5 * 0.1 +
      categoryBoostB * 0.5;

    return scoreB - scoreA;
  });
};

export const fetchRecommendations = async (
  requestId: string,
  filters: {
    minRating: number;
    onlyActive: boolean;
    page: number;
    limit: number;
  },
): Promise<{
  recommendations: WorkerRecommendation[];
  source: string;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  snapshotCreatedAt?: string;
}> => {
  const params = new URLSearchParams({
    minRating: String(filters.minRating),
    onlyActive: String(filters.onlyActive),
    page: String(filters.page),
    limit: String(filters.limit),
  });

  const token = getAuthToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(
    `${API_BASE_URL}/recommendations/request/${requestId}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status === 401) {
    clearSession();
    throw new Error("UNAUTHORIZED");
  }

  const result = (await response.json().catch(() => null)) as {
    recommendations?: WorkerRecommendation[];
    source?: string;
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    snapshotCreatedAt?: string;
  } | null;

  if (!response.ok || !Array.isArray(result?.recommendations)) {
    throw new Error("RECOMMENDATION_LOAD_FAILED");
  }

  return {
    recommendations: result.recommendations,
    source: result.source ?? "unknown",
    total: typeof result.total === "number" ? result.total : 0,
    page: typeof result.page === "number" ? result.page : filters.page,
    limit: typeof result.limit === "number" ? result.limit : filters.limit,
    hasMore: Boolean(result.hasMore),
    snapshotCreatedAt:
      typeof result.snapshotCreatedAt === "string"
        ? result.snapshotCreatedAt
        : undefined,
  };
};
