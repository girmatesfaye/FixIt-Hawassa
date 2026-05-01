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
    // If distance is the default 99, we only filter it if maxDistanceKm is less than 99
    // This allows default workers to show up unless the user specifically filters for close ones
    const passDistance = w.distanceKm <= maxDistanceKm;
    const passRating = w.rating >= minRating;
    const passActive = onlyActive ? w.isActive : true;
    return passDistance && passRating && passActive;
  });

  if (!filtered.length) {
    return [];
  }

  const maxReviews = Math.max(...filtered.map((w) => w.reviews), 1);
  const minReviews = Math.min(...filtered.map((w) => w.reviews));
  const maxDistance = Math.max(...filtered.map((w) => w.distanceKm), 1);
  const minDistance = Math.min(...filtered.map((w) => w.distanceKm));

  return filtered
    .map((w) => {
      const categoryMatch = request
        ? w.skills.some((skill) =>
            skill.toLowerCase().includes(request.category.toLowerCase()),
          )
        : false;

      const areaMatch = request && w.area && request.area
        ? w.area.toLowerCase().trim() === request.area.toLowerCase().trim()
        : false;

      // Handle normalization more safely
      const distanceScore = maxDistance === minDistance 
        ? (w.distanceKm < 10 ? 1 : 0.5) // If all same, give boost to those clearly marked as "close"
        : 1 - normalize(w.distanceKm, minDistance, maxDistance);

      const reviewScore = maxReviews === minReviews 
        ? 0.5 
        : normalize(w.reviews, minReviews, maxReviews);

      // Final weighted formula:
      const score =
        (categoryMatch ? 5.0 : 0) +     // Primary: Category (Increased to 5.0)
        (areaMatch ? 3.0 : 0) +         // Secondary: Area (Increased to 3.0)
        (w.rating * 1.0) +              // Quality (Increased weight)
        (distanceScore * 2.0) +         // Proximity
        (w.completionRate * 1.5) +      // Reliability
        (reviewScore * 0.5);            // Popularity

      return {
        ...w,
        score,
        reasons: getRecommendationReasons(w, request),
      };
    })
    .sort((a, b) => b.score - a.score);
};
