import axios from "axios";

// Use the build-time environment variable when available. When it's
// not provided (e.g. during a misconfigured deployment), fall back to
// the production backend URL so Vercel production builds still work.
const RAW_BACKEND = process.env.REACT_APP_BACKEND_URL || "https://gyan-rise-0101.onrender.com";
const BACKEND_URL = RAW_BACKEND.replace(/\/$/, "");
export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

/** Resolve a possibly-relative API image URL to an absolute URL. */
export function resolveImage(url) {
  if (!url) return url;
  if (url.startsWith("/api/")) return (BACKEND_URL ? BACKEND_URL : "") + url;
  return url;
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lms_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export function setToken(token) {
  if (token) localStorage.setItem("lms_token", token);
  else localStorage.removeItem("lms_token");
}

export function getToken() {
  return localStorage.getItem("lms_token");
}

export function sendAdminNotification(payload) {
  return api.post("/notifications/send", payload);
}

export function getNotificationHistory() {
  return api.get("/notifications/history");
}

export function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

// YouTube URL → embed URL
// Robustly extracts a video ID from common YouTube URL shapes:
//   - https://www.youtube.com/watch?v=ID
//   - https://www.youtube.com/live/ID
//   - https://youtu.be/ID
//   - https://www.youtube.com/embed/ID
//   - https://www.youtube.com/shorts/ID
//   - https://m.youtube.com/...   (mobile)
// Returns the original URL unchanged if it isn't recognizable (so non-YT URLs still play).
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

function extractYouTubeId(rawUrl) {
  if (!rawUrl) return "";
  if (YT_ID.test(rawUrl)) return rawUrl;

  let u;
  try {
    const normalized = rawUrl.includes("://") ? rawUrl : `https://${rawUrl}`;
    u = new URL(normalized);
  } catch {
    return "";
  }

  const host = u.hostname.toLowerCase();
  if (!host.includes("youtu") && !host.includes("youtube")) return "";

  if (host === "youtu.be" || host.endsWith(".youtu.be")) {
    const id = u.pathname.split("/").filter(Boolean)[0] || "";
    return YT_ID.test(id) ? id : "";
  }

  const v = u.searchParams.get("v");
  if (v && YT_ID.test(v)) return v;

  const parts = u.pathname.split("/").filter(Boolean);
  for (let i = 0; i < parts.length - 1; i++) {
    if (["live", "embed", "shorts", "v"].includes(parts[i])) {
      const candidate = parts[i + 1];
      if (YT_ID.test(candidate)) return candidate;
    }
  }

  const guess = parts.find((p) => YT_ID.test(p));
  return guess || "";
}

function normalizeOrigin(origin) {
  if (!origin) return "";
  try {
    return new URL(origin).origin;
  } catch {
    return "";
  }
}

export function toYouTubeEmbed(url, origin) {
  if (!url) return "";
  const id = extractYouTubeId(url);
  if (!id) return url;

  const resolvedOrigin = normalizeOrigin(origin || (typeof window !== "undefined" ? window.location.origin : ""));
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });

  if (resolvedOrigin) {
    params.set("origin", resolvedOrigin);
  }

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
