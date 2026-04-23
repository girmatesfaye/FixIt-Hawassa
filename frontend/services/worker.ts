import { clearSession, getAuthToken } from "./auth";
import { uploadImage as uploadSharedImage } from "./upload";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

export interface MyWorkerProfile {
  id: string;
  name: string;
  phone: string;
  profile: {
    title: string;
    bio: string;
    area: string;
    skills: string[];
    isActive: boolean;
    telegramUsername: string;
    tiktokProfile: string;
    avatar: string;
    portfolio: string[];
  };
}

export const getMyWorkerProfile = async (): Promise<MyWorkerProfile> => {
  const token = getAuthToken();
  if (!token) throw new Error("UNAUTHORIZED");

  const response = await fetch(`${API_BASE_URL}/workers/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401 || response.status === 403) {
    if (response.status === 401) clearSession();
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error("FAILED_TO_LOAD_PROFILE");
  }

  const result = await response.json();
  return result.worker;
};

export const updateMyWorkerProfile = async (data: {
  name?: string;
  phone?: string;
  area?: string;
  telegramUsername?: string;
  tiktokProfile?: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  portfolio?: string[];
}): Promise<MyWorkerProfile> => {
  const token = getAuthToken();
  if (!token) throw new Error("UNAUTHORIZED");

  const response = await fetch(`${API_BASE_URL}/workers/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401 || response.status === 403) {
    if (response.status === 401) clearSession();
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error("FAILED_TO_UPDATE_PROFILE");
  }

  const result = await response.json();
  return result.worker;
};

export const uploadImage = async (file: File): Promise<string> => {
  const token = getAuthToken();
  if (!token) throw new Error("UNAUTHORIZED");
  return uploadSharedImage(file);
};
