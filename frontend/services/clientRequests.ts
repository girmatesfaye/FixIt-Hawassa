import { clearSession, getAuthToken } from "./auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

export type ApiRequestStatus =
  | "SEARCHING"
  | "IN_PROGRESS"
  | "PENDING"
  | "COMPLETED";

export interface RequestUserRef {
  _id: string;
  name: string | null;
}

export interface ClientRequestItem {
  id: string;
  clientUserId: RequestUserRef | null;
  lastDeclinedWorkerId?: RequestUserRef | null;
  lastDeclinedAt?: string | null;
  workerMarkedCompleteAt?: string | null;
  clientConfirmedCompleteAt?: string | null;
  category: string;
  description: string;
  area: string;
  landmark: string;
  maintenanceLevel: "New" | "Medium" | "Old";
  hasPhotos: boolean;
  photoUrls: string[];
  status: ApiRequestStatus;
  createdAt: string;
  updatedAt: string;
  assignedWorkerId: RequestUserRef | null;
  hasReview?: boolean;
  hasReport?: boolean;
}

export interface ClientReportItem {
  id: string;
  type: string;
  text: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  adminFeedback: string;
  resolutionAction: "warning" | "none" | "resolved" | "suspend_worker" | null;
  isDangerous: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporterUser: RequestUserRef | null;
  resolvedBy: RequestUserRef | null;
  reportedUser: RequestUserRef | null;
  request: {
    id: string;
    category: string | null;
    area: string | null;
  } | null;
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

export const assignWorkerToRequest = async (
  requestId: string,
  workerId: string,
): Promise<ClientRequestItem> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workerId }),
  });

  if (response.status === 401) {
    clearSession();
    throw new Error("UNAUTHORIZED");
  }

  const result = (await response.json().catch(() => null)) as {
    message?: string;
    request?: ClientRequestItem;
  } | null;

  if (!response.ok || !result?.request) {
    throw new Error(result?.message ?? "ASSIGN_FAILED");
  }

  return result.request;
};

export const respondToWorkerInvite = async (
  requestId: string,
  decision: "accept" | "decline",
): Promise<ClientRequestItem> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(
    `${API_BASE_URL}/requests/${requestId}/worker-response`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ decision }),
    },
  );

  if (response.status === 401) {
    clearSession();
    throw new Error("UNAUTHORIZED");
  }

  const result = (await response.json().catch(() => null)) as {
    message?: string;
    request?: ClientRequestItem;
  } | null;

  if (!response.ok || !result?.request) {
    throw new Error(result?.message ?? "WORKER_RESPONSE_FAILED");
  }

  return result.request;
};

export const markRequestCompleteByWorker = async (
  requestId: string,
): Promise<ClientRequestItem> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(
    `${API_BASE_URL}/requests/${requestId}/worker-complete`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "worker_complete" }),
    },
  );

  if (response.status === 401) {
    clearSession();
    throw new Error("UNAUTHORIZED");
  }

  const rawText = await response.text();
  let result: { message?: string; request?: ClientRequestItem } | null = null;
  let hasJsonBody = false;

  if (rawText) {
    try {
      result = JSON.parse(rawText) as {
        message?: string;
        request?: ClientRequestItem;
      };
      hasJsonBody = true;
    } catch {
      result = null;
    }
  }

  if (!response.ok || !result?.request) {
    throw new Error(
      result?.message ??
        `WORKER_COMPLETE_FAILED (${response.status})${rawText && !hasJsonBody ? `: ${rawText.slice(0, 120)}` : ""}`,
    );
  }

  return result.request;
};

export const confirmRequestCompletion = async (
  requestId: string,
): Promise<ClientRequestItem> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(
    `${API_BASE_URL}/requests/${requestId}/client-confirm-completion`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "client_confirm" }),
    },
  );

  if (response.status === 401) {
    clearSession();
    throw new Error("UNAUTHORIZED");
  }

  const result = (await response.json().catch(() => null)) as {
    message?: string;
    request?: ClientRequestItem;
  } | null;

  if (!response.ok || !result?.request) {
    throw new Error(result?.message ?? "CLIENT_CONFIRM_FAILED");
  }

  return result.request;
};

export const submitWorkerReview = async (payload: {
  workerId: string;
  requestId: string;
  rating: number;
  comment: string;
}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(
    `${API_BASE_URL}/workers/${payload.workerId}/review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requestId: payload.requestId,
        rating: payload.rating,
        comment: payload.comment,
      }),
    },
  );

  if (response.status === 401) {
    clearSession();
    throw new Error("UNAUTHORIZED");
  }

  const result = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  if (!response.ok) {
    throw new Error(result?.error ?? "REVIEW_FAILED");
  }
};

export const submitWorkerReport = async (payload: {
  workerId: string;
  requestId: string;
  type: string;
  text: string;
}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(
    `${API_BASE_URL}/workers/${payload.workerId}/report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requestId: payload.requestId,
        type: payload.type,
        text: payload.text,
      }),
    },
  );

  if (response.status === 401) {
    clearSession();
    throw new Error("UNAUTHORIZED");
  }

  const result = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  if (!response.ok) {
    throw new Error(result?.error ?? "REPORT_FAILED");
  }
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

export const fetchMyReports = async (): Promise<ClientReportItem[]> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(`${API_BASE_URL}/requests/reports`, {
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
    reports?: ClientReportItem[];
  } | null;

  if (!response.ok) {
    throw new Error("LOAD_FAILED");
  }

  return Array.isArray(result?.reports) ? result.reports : [];
};
