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
  minRating: number,
  onlyActive: boolean,
): Array<WorkerRecommendation & { score: number; reasons: string[] }> => {
  const filtered = workers.filter((w) => {
    const passRating = w.rating >= minRating;
    const passActive = onlyActive ? w.isActive : true;
    
    if (!passRating || !passActive) {
      console.log(`[ranking] Worker ${w.name} filtered out. Rating(${w.rating} >= ${minRating}): ${passRating}, Active(${w.isActive}): ${passActive}`);
    }
    
    return passRating && passActive;
  });

  if (!filtered.length) {
    return [];
  }

  const maxReviews = Math.max(...filtered.map((w) => w.reviews), 1);
  const minReviews = Math.min(...filtered.map((w) => w.reviews));

  return filtered
    .map((w) => {
      const categoryMatch = request
        ? w.skills.some((skill) => {
            const s = skill.toLowerCase().trim();
            const c = request.category.toLowerCase().trim();
            const isMatch = s.includes(c) || c.includes(s);
            if (isMatch) {
              console.log(`[ranking] MATCH FOUND: Worker ${w.name} Skill "${s}" matches Category "${c}"`);
            } else {
              // Only log non-matches if we are debugging a specific worker
              // console.log(`[ranking] No match: Worker ${w.name} Skill "${s}" vs Category "${c}"`);
            }
            return isMatch;
          })
        : false;
        
      if (!categoryMatch && request) {
         console.log(`[ranking] NO CATEGORY MATCH for ${w.name}. RequestCat: "${request.category.toLowerCase().trim()}", WorkerSkills: [${w.skills.map(s => `"${s.toLowerCase().trim()}"`).join(", ")}]`);
      }

      const areaMatch = request && w.area && request.area
        ? w.area.toLowerCase().trim() === request.area.toLowerCase().trim()
        : false;

      const reviewScore = maxReviews === minReviews 
        ? 0.5 
        : normalize(w.reviews, minReviews, maxReviews);

      // Final weighted formula:
      const score =
        (categoryMatch ? 5.0 : 0) +     // Primary: Category (Increased to 5.0)
        (areaMatch ? 3.0 : 0) +         // Secondary: Area (Increased to 3.0)
        (w.rating * 1.0) +              // Quality (Increased weight)
        (w.completionRate * 1.5) +      // Reliability
        (reviewScore * 0.5);            // Popularity

      console.log(`[ranking] Worker: ${w.name}, CatMatch: ${categoryMatch}, AreaMatch: ${areaMatch}, Score: ${score.toFixed(2)}`);

      return {
        ...w,
        score,
        reasons: getRecommendationReasons(w, request),
      };
    })
    .sort((a, b) => b.score - a.score);
};
