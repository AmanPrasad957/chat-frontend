export const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

// Token management helpers
export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("chat_access_token");
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("chat_refresh_token");
}

export function saveTokens(accessToken, refreshToken, user) {
  if (typeof window === "undefined") return;
  if (accessToken) localStorage.setItem("chat_access_token", accessToken);
  if (refreshToken) localStorage.setItem("chat_refresh_token", refreshToken);
  if (user) {
    localStorage.setItem("chat_user", JSON.stringify(user));
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("chat_access_token");
  localStorage.removeItem("chat_refresh_token");
  localStorage.removeItem("chat_user");
}

// Authenticated fetch wrapper with automatic token refresh on 401
export async function authFetch(url, options = {}) {
  const token = getAccessToken();
  const headers = {
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Handle token expiration: try refresh once
  if (res.status === 401 && getRefreshToken()) {
    try {
      const refRes = await fetch(`${BACKEND_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: getRefreshToken() }),
      });
      if (refRes.ok) {
        const refData = await refRes.json();
        saveTokens(refData.access_token, refData.refresh_token);
        headers["Authorization"] = `Bearer ${refData.access_token}`;
        res = await fetch(url, { ...options, headers });
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    }
  }

  return res;
}

// Strip HTML tags and markdown punctuation for fluent natural TTS reading
export function stripHtmlAndMarkdown(rawText) {
  if (!rawText) return "";
  let clean = rawText;
  // Strip HTML tags
  clean = clean.replace(/<[^>]*>/g, " ");
  // Strip code blocks ```code```
  clean = clean.replace(/```[\s\S]*?```/g, " code block omitted ");
  // Strip inline code `code`
  clean = clean.replace(/`([^`]+)`/g, "$1");
  // Strip markdown links [label](url)
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Strip bold/italics/headings/blockquotes
  clean = clean.replace(/[*_~#]/g, "");
  clean = clean.replace(/^>\s+/gm, "");
  // Normalize spaces
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
}
