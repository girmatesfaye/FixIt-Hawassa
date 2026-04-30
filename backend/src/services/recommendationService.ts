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
      const categoryMatch = request
        ? w.skills.some((skill) =>
            skill.toLowerCase().includes(request.category.toLowerCase()),
          )
        : false;

      const areaMatch = request && w.area && request.area
        ? w.area.toLowerCase() === request.area.toLowerCase()
        : false;

      const distanceScore =
        1 - normalize(w.distanceKm, minDistance, maxDistance);
      const reviewScore = normalize(w.reviews, minReviews, maxReviews);

      // New weighted formula:
      // Category match is now a massive boost (+3.0)
      // Area match is a significant boost (+1.5)
      const score =
        (categoryMatch ? 3.0 : 0) +     // Primary factor: Can they do the job?
        (areaMatch ? 1.5 : 0) +         // Secondary factor: Are they in the neighborhood?
        (w.rating * 0.4) +              // Quality factor
        (distanceScore * 1.5) +         // Proximity factor
        (w.completionRate * 1.0) +      // Reliability factor
        (reviewScore * 0.5);            // Popularity factor

      return {
        ...w,
        score,
        reasons: getRecommendationReasons(w, request),
      };
    })
    .sort((a, b) => b.score - a.score);
};
