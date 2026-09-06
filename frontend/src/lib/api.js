const BASE = "/api";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (res.status === 401) {
      throw new ApiError(data?.error || "Your session expired — please log in again.", 401);
    }
    if (res.status === 502 || res.status === 0) {
      throw new ApiError(data?.error || "The server didn't respond. Try again in a moment.", res.status);
    }
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const api = {
  ApiError,
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),

  dashboard: (token) => request("/profile/dashboard", { token }),
  updateProfile: (token, body) => request("/profile", { method: "PUT", body, token }),
  rewind: (token) => request("/profile/rewind", { token }),

  getPlatforms: (token) => request("/platforms", { token }),
  savePlatforms: (token, body) => request("/platforms", { method: "PUT", body, token }),
  syncPlatforms: (token) => request("/sync", { method: "POST", token }),

  getNotes: (token) => request("/notes", { token }),
  createNote: (token, body) => request("/notes", { method: "POST", body, token }),
  updateNote: (token, id, body) => request(`/notes/${id}`, { method: "PUT", body, token }),
  deleteNote: (token, id) => request(`/notes/${id}`, { method: "DELETE", token }),

  getSheets: (token) => request("/sheets", { token }),
  toggleSheetProblem: (token, sheetId, problemId) =>
    request(`/sheets/${sheetId}/${problemId}/toggle`, { method: "PUT", token }),

  getCompanyKit: (token) => request("/company-kit", { token }),
  getCompanyProblems: (token, companyId) => request(`/company-kit/${companyId}`, { token }),
  toggleCompanyProblem: (token, problemId) =>
    request(`/company-kit/${problemId}/toggle`, { method: "PUT", token }),

  getLeaderboard: (token) => request("/discover/leaderboard", { token }),
  getContests: (token) => request("/discover/contests", { token }),
  getAchievements: (token) => request("/discover/achievements", { token }),
  getContestHistory: (token) => request("/contest-history", { token }),

  getSettings: (token) => request("/account/settings", { token }),
  updateSettings: (token, body) => request("/account/settings", { method: "PUT", body, token }),
  getFaqs: (token) => request("/account/help/faqs", { token }),
  sendFeedback: (token, message) => request("/account/help/feedback", { method: "POST", body: { message }, token }),
  deleteAccount: (token) => request("/account", { method: "DELETE", token }),
  exportData: (token) => request("/account/export", { token }),

  analyzeRepo: (token, repoUrl) => request("/analyze-repo", { method: "POST", body: { repoUrl }, token }),

  getPublicProfile: (handle) => request(`/public/${encodeURIComponent(handle)}`),
  compare: (token, you, friend) => request("/compare", { method: "POST", body: { you, friend }, token })
};
