import {
  AUTH_ROLE_KEY,
  AUTH_TOKEN_KEY,
  clearSession,
  getAuthToken,
  getStoredRole,
  getTokenExpiryMs,
  isTokenExpired,
  refreshAuthSession,
  saveSession,
} from "../auth";

const createJwt = (expSeconds: number): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ exp: expSeconds }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${payload}.signature`;
};

describe("auth service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves and clears session data", () => {
    saveSession("token123", "worker");

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe("token123");
    expect(localStorage.getItem(AUTH_ROLE_KEY)).toBe("worker");
    expect(getAuthToken()).toBe("token123");
    expect(getStoredRole()).toBe("worker");

    clearSession();

    expect(getAuthToken()).toBe("");
    expect(getStoredRole()).toBeNull();
  });

  it("extracts token expiry and expiration status", () => {
    const futureExp = Math.floor((Date.now() + 60_000) / 1000);
    const token = createJwt(futureExp);

    expect(getTokenExpiryMs(token)).toBe(futureExp * 1000);
    expect(isTokenExpired(token, 0)).toBe(false);

    const pastToken = createJwt(Math.floor((Date.now() - 60_000) / 1000));
    expect(isTokenExpired(pastToken, 0)).toBe(true);
  });

  it("refreshes session token via API", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "old-token");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ token: "new-token", role: "client" }),
    } as Response);

    const refreshed = await refreshAuthSession();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refreshed).toEqual({ token: "new-token", role: "client" });
  });
});
