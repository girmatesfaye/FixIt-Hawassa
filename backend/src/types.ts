export type UserRole = "client" | "worker" | "admin";

export interface RequestDraft {
  category: string;
  description: string;
  area: string;
  landmark: string;
  maintenanceLevel: "New" | "Medium" | "Old";
  hasPhotos: boolean;
  createdAt: string;
}

export interface WorkerRecommendation {
  id: number;
  name: string;
  location: string;
  area: string;
  rating: number;
  reviews: number;
  isActive: boolean;
  distanceKm: number;
  completionRate: number;
  responseMinutes: number;
  skills: string[];
  avatar: string;
}
