import { clearSession, getAuthToken } from "./auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

export type ApiRequestStatus =
  | "SEARCHING"
  | "IN_PROGRESS"
  | "PENDING"
  | "COMPLETED";

export interface ClientRequestItem {
  id: string;
  clientUserId: string;
  category: string;
  description: string;
  area: string;
  landmark: string;
  maintenanceLevel: "New" | "Medium" | "Old";
  hasPhotos: boolean;
  status: ApiRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export const fetchClientRequests = async (): Promise<ClientRequestItem[]> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(`${API_BASE_URL}/requests/mine`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearSession();
    throw new Error("UNAUTHORIZED");
  }

  const result = (await response.json().catch(() => null)) as {
    requests?: ClientRequestItem[];
  } | null;

  if (!response.ok) {
    throw new Error("LOAD_FAILED");
  }

  return Array.isArray(result?.requests) ? result.requests : [];
};

export const fetchTopPros = async () => {
  const response = await fetch(`${API_BASE_URL}/recommendations/rank`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(null),
  });

  const result = (await response.json().catch(() => null)) as {
    recommendations?: Array<{
      id: string | number;
      name: string;
      location: string;
      area: string;
      rating: number;
      reviews: number;
      avatar: string;
    }>;
  } | null;

  if (!response.ok || !Array.isArray(result?.recommendations)) {
    throw new Error("LOAD_FAILED");
  }

  return result.recommendations.slice(0, 5);
};
