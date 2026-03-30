import { WorkerRecommendation } from "../types";

export type RecommendationFilters = {
  maxDistanceKm: number;
  minRating: number;
  onlyActive: boolean;
};

export type RecommendationSnapshot = {
  requestId: string;
  filters: RecommendationFilters;
  recommendations: Array<
    WorkerRecommendation & { score: number; reasons: string[] }
  >;
  createdAt: string;
  source: "mock" | "mongodb";
};

const buildKey = (
  requestId: string,
  filters: RecommendationFilters,
): string => {
  return [
    requestId,
    String(filters.maxDistanceKm),
    filters.minRating.toFixed(2),
    filters.onlyActive ? "1" : "0",
  ].join("|");
};

const snapshotStore = new Map<string, RecommendationSnapshot>();

export const getRecommendationSnapshot = (
  requestId: string,
  filters: RecommendationFilters,
): RecommendationSnapshot | null => {
  const key = buildKey(requestId, filters);
  return snapshotStore.get(key) ?? null;
};

export const setRecommendationSnapshot = (
  snapshot: RecommendationSnapshot,
): RecommendationSnapshot => {
  const key = buildKey(snapshot.requestId, snapshot.filters);
  snapshotStore.set(key, snapshot);
  return snapshot;
};
