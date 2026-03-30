import { WorkerRecommendation, RequestDraft } from "../types";

const normalize = (value: number, min: number, max: number): number => {
  if (max === min) {
    return 1;
  }
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
  maxDistanceKm: number,
  minRating: number,
  onlyActive: boolean,
): Array<WorkerRecommendation & { score: number; reasons: string[] }> => {
  const filtered = workers.filter((w) => {
    const passDistance = w.distanceKm <= maxDistanceKm;
    const passRating = w.rating >= minRating;
    const passActive = onlyActive ? w.isActive : true;
    return passDistance && passRating && passActive;
  });

  if (!filtered.length) {
    return [];
  }

  const maxReviews = Math.max(...filtered.map((w) => w.reviews));
  const minReviews = Math.min(...filtered.map((w) => w.reviews));
  const maxDistance = Math.max(...filtered.map((w) => w.distanceKm));
  const minDistance = Math.min(...filtered.map((w) => w.distanceKm));

  return filtered
    .map((w) => {
      const categoryBoost = request
        ? w.skills.some((skill) =>
            skill.toLowerCase().includes(request.category.toLowerCase()),
          )
          ? 1
          : 0
        : 0;

      const distanceScore =
        1 - normalize(w.distanceKm, minDistance, maxDistance);
      const reviewScore = normalize(w.reviews, minReviews, maxReviews);

      const score =
        w.rating * 0.35 +
        distanceScore * 5 * 0.25 +
        w.completionRate * 5 * 0.2 +
        (1 - Math.min(w.responseMinutes, 30) / 30) * 5 * 0.1 +
        reviewScore * 5 * 0.1 +
        categoryBoost * 0.5;

      return {
        ...w,
        score,
        reasons: getRecommendationReasons(w, request),
      };
    })
    .sort((a, b) => b.score - a.score);
};
