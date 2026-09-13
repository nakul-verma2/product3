import axios from "axios";
import { demoApi, isDemoMode } from "./demo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Public client: never attaches Authorization so the status page works logged-out.
export const publicClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function normalizeError(error) {
  const status = error?.response?.status;
  const serverMessage =
    error?.response?.data?.message || error?.response?.data?.error;
  if (status === 429)
    return {
      message: serverMessage || "Rate limited. Please wait a moment and retry.",
      status,
    };
  if (status >= 500)
    return {
      message: serverMessage || "Server error. Please retry in a bit.",
      status,
    };
  return { message: serverMessage || error?.message || "Request failed.", status };
}

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      const isPublic = path.startsWith("/status-page") || path === "/login";
      if (!isPublic) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Interceptor runs outside the React tree, so a router push is unavailable here.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
    return Promise.reject(normalizeError(error));
  }
);

publicClient.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(normalizeError(error))
);

const unwrap = (p) => p.then((r) => r.data);

const baseApi = {
  login: (email, password) =>
    unwrap(apiClient.post("/auth/login", { email, password })),

  register: (email, password) =>
    unwrap(apiClient.post("/auth/register", { email, password })),

  listWebsites: async () => {
    const data = await unwrap(apiClient.get("/websites/list"));
    return data.websites || [];
  },

  getWebsite: async (id) => {
    const websites = await baseApi.listWebsites();

    return websites.find(
      (website) => website._id === id
    ) || null;
  },

  getLogs: async (
    id,
    { days = 7, page = 1, limit = 200 } = {}
  ) => {
    const data = await unwrap(
      apiClient.get(`/websites/${id}/logs`, {
        params: { days, page, limit },
      })
    );

    return data.logs || [];
  },

  addWebsite: async (name, url) => {
    const data = await unwrap(
      apiClient.post("/websites/add", { name, url })
    );

    return data.website;
  },

  deleteWebsite: (id) =>
    unwrap(apiClient.delete(`/websites/${id}`)),

  togglePause: (id) =>
    unwrap(apiClient.patch(`/websites/${id}/pause`)),

  getSummary: () =>
    unwrap(apiClient.get("/dashboard/summary")),

  listBusinessApps: async () => {
    const data = await unwrap(
      apiClient.get("/monitor/business-app/list")
    );

    return data.apps || data.businessApps || [];
  },

  addBusinessApp: ({ name, url, type }) =>
    unwrap(
      apiClient.post("/monitor/business-app/add", {
        name,
        url,
        type,
      })
    ),

  deleteBusinessApp: (id) =>
    unwrap(
      apiClient.delete(`/monitor/business-app/${id}`)
    ),

  generateAudit: (period = "12months") =>
    unwrap(
      apiClient.get("/audit/report/generate", {
        params: { period },
        timeout: 60000,
      })
    ),

  listAudits: async () => {
    const data = await unwrap(
      apiClient.get("/audit/reports")
    );

    return data.reports || [];
  },

  getAlertSettings: async () => {
    const data = await unwrap(
      apiClient.get("/alert/settings")
    );

    return data.settings || {};
  },

  updateAlertSettings: async (payload) => {
    const data = await unwrap(
      apiClient.put("/alert/settings", payload)
    );

    return data.settings || {};
  },

  testAlert: async () => {
    return unwrap(
      apiClient.post("/alert/test")
    );
  },

  getPublicStatus: async (userId) => {
    const data = await unwrap(
      publicClient.get(`/status/${userId}`)
    );

    return {
      userId,
      overall: data.status?.overall || "operational",
      services: data.websites || [],
    };
  },

  getIncidents: async (websiteId) => {
    const data = await unwrap(
      apiClient.get("/incidents/list")
    );

    const incidents = data.incidents || [];

    if (!websiteId) {
      return incidents;
    }

    return incidents.filter(
      (incident) => incident.websiteId === websiteId
    );
  },
};

// Demo mode (no backend): route every call to the in-memory sample store.
// Same method names and shapes, so pages behave identically when live.
export const api = new Proxy(baseApi, {
  get(target, prop) {
    const fn = target[prop];
    if (typeof fn !== "function" || !isDemoMode()) return fn;
    return (...args) => demoApi[prop](...args);
  },
});

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function getApiOrigin() {
  return API_BASE.replace(/\/api\/?$/, "");
}

export function resolvePdfUrl(pdfUrl) {
  if (!pdfUrl) return "";
  if (/^https?:\/\//i.test(pdfUrl)) return pdfUrl;
  const path = pdfUrl.startsWith("/") ? pdfUrl : `/${pdfUrl}`;
  return `${getApiOrigin()}${path}`;
}
