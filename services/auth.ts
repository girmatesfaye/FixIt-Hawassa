export type UserRole = "client" | "worker" | "admin";

export const AUTH_TOKEN_KEY = "fixit_auth_token";
export const AUTH_ROLE_KEY = "fixit_user_role";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

export const getStoredRole = (): UserRole | null => {
  const role = localStorage.getItem(AUTH_ROLE_KEY);
  if (role === "client" || role === "worker" || role === "admin") {
    return role;
  }
  return null;
};

export const getAuthToken = (): string => {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? "";
};

export const saveSession = (token: string, role: UserRole): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_ROLE_KEY, role);
};

export const clearSession = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
};

export const getTokenExpiryMs = (token: string): number | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: number };
    if (typeof payload.exp !== "number") {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string, skewMs = 30_000): boolean => {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) {
    return true;
  }

  return Date.now() + skewMs >= expiryMs;
};

export const refreshAuthSession = async (): Promise<{
  token: string;
  role: UserRole;
} | null> => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = (await response.json().catch(() => null)) as {
    token?: string;
    role?: UserRole;
  } | null;

  if (!response.ok || !result?.token || !result?.role) {
    return null;
  }

  return {
    token: result.token,
    role: result.role,
  };
};
