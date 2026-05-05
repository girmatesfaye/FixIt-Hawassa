export type UserRole = "client" | "worker" | "admin";

export interface RequestDraft {
  category: string;
  description: string;
  area: string;
  landmark: string;
  maintenanceLevel: "New" | "Medium" | "Old";
  hasPhotos: boolean;
  photoUrls?: string[];
  createdAt: string;
}

export interface WorkerRecommendation {
  id: string | number;
  name: string;
  location: string;
  area: string;
  rating: number;
  reviews: number;
  isActive: boolean;
  completionRate: number;
  responseMinutes: number;
  skills: string[];
  avatar: string;
}
