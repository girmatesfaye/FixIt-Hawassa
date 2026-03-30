import { RequestDraft, WorkerRecommendation } from "../types";

export const LAST_REQUEST_KEY = "fixit:lastRequestDraft";

export const MOCK_WORKERS: WorkerRecommendation[] = [
  {
    id: 1,
    name: "Abebe Kebede",
    location: "Hawassa, Piassa",
    area: "Piassa",
    rating: 4.8,
    reviews: 142,
    isActive: true,
    distanceKm: 1.2,
    completionRate: 0.96,
    responseMinutes: 6,
    skills: ["Plumbing", "Pipe Repair", "Leak Fix"],
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&h=300&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Tigist Bekele",
    location: "Hawassa, Tabor",
    area: "Tabor",
    rating: 4.9,
    reviews: 89,
    isActive: true,
    distanceKm: 3.4,
    completionRate: 0.93,
    responseMinutes: 9,
    skills: ["Plumbing", "Installation", "Bathroom Fix"],
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&h=300&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Dawit Alemu",
    location: "Hawassa, Millennium",
    area: "Millennium",
    rating: 4.5,
    reviews: 56,
    isActive: true,
    distanceKm: 5.2,
    completionRate: 0.89,
    responseMinutes: 12,
    skills: ["General Repair", "Plumbing", "Emergency Service"],
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&h=300&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Meron Hailu",
    location: "Hawassa, Gudumale",
    area: "Gudumale",
    rating: 4.7,
    reviews: 63,
    isActive: false,
    distanceKm: 7.9,
    completionRate: 0.9,
    responseMinutes: 14,
    skills: ["Plumbing", "Water Heater", "Maintenance"],
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=300&h=300&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Samuel Tadesse",
    location: "Hawassa, Piassa",
    area: "Piassa",
    rating: 4.6,
    reviews: 74,
    isActive: true,
    distanceKm: 2.5,
    completionRate: 0.91,
    responseMinutes: 7,
    skills: ["Electrical", "Plumbing", "Home Repair"],
    avatar:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=300&h=300&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "Yonas Bekele",
    location: "Hawassa, Tabor",
    area: "Tabor",
    rating: 4.4,
    reviews: 48,
    isActive: true,
    distanceKm: 6.1,
    completionRate: 0.87,
    responseMinutes: 16,
    skills: ["Carpentry", "Plumbing", "Fittings"],
    avatar:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=300&h=300&auto=format&fit=crop",
  },
];

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
  maxDistanceKm: number,
  minRating: number,
  onlyActive: boolean,
): WorkerRecommendation[] => {
  const filtered = workers.filter((worker) => {
    const passDistance = worker.distanceKm <= maxDistanceKm;
    const passRating = worker.rating >= minRating;
    const passActive = onlyActive ? worker.isActive : true;
    return passDistance && passRating && passActive;
  });

  if (!filtered.length) {
    return [];
  }

  const maxReviews = Math.max(...filtered.map((w) => w.reviews));
  const minReviews = Math.min(...filtered.map((w) => w.reviews));
  const maxDistance = Math.max(...filtered.map((w) => w.distanceKm));
  const minDistance = Math.min(...filtered.map((w) => w.distanceKm));

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

    const distanceScoreA =
      1 - normalize(a.distanceKm, minDistance, maxDistance);
    const distanceScoreB =
      1 - normalize(b.distanceKm, minDistance, maxDistance);

    const reviewScoreA = normalize(a.reviews, minReviews, maxReviews);
    const reviewScoreB = normalize(b.reviews, minReviews, maxReviews);

    const scoreA =
      a.rating * 0.35 +
      distanceScoreA * 5 * 0.25 +
      a.completionRate * 5 * 0.2 +
      (1 - Math.min(a.responseMinutes, 30) / 30) * 5 * 0.1 +
      reviewScoreA * 5 * 0.1 +
      categoryBoostA * 0.5;

    const scoreB =
      b.rating * 0.35 +
      distanceScoreB * 5 * 0.25 +
      b.completionRate * 5 * 0.2 +
      (1 - Math.min(b.responseMinutes, 30) / 30) * 5 * 0.1 +
      reviewScoreB * 5 * 0.1 +
      categoryBoostB * 0.5;

    return scoreB - scoreA;
  });
};
