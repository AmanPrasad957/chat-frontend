export const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

// --- Token & LocalStorage Utilities ---
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

// --- Authenticated Fetch Wrapper with Auto-Refresh ---
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

// --- Text Formatting / Cleaning Helper for TTS ---
export function stripHtmlAndMarkdown(rawText) {
  if (!rawText) return "";
  let clean = rawText;
  clean = clean.replace(/<[^>]*>/g, " ");
  clean = clean.replace(/```[\s\S]*?```/g, " code block omitted ");
  clean = clean.replace(/`([^`]+)`/g, "$1");
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  clean = clean.replace(/[*_~#]/g, "");
  clean = clean.replace(/^>\s+/gm, "");
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
}

// ==========================================
// BACKEND API CLIENT CALLS
// ==========================================

// --- Auth APIs ---
export const authApi = {
  async getCurrentUser() {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const res = await fetch(`${BACKEND_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("Could not fetch current user:", err);
    }
    return null;
  },

  async login(email, password) {
    const res = await fetch(`${BACKEND_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Authentication failed. Please check your credentials.");
    }
    return data;
  },

  async register(email, password, fullName) {
    const res = await fetch(`${BACKEND_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Registration failed.");
    }
    return data;
  },

  async logout(refreshToken) {
    if (!refreshToken) return;
    try {
      await fetch(`${BACKEND_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (err) {
      console.warn("Logout error:", err);
    }
  },
};

// --- Chat & Thread APIs ---
export const chatApi = {
  async getThreads() {
    try {
      const res = await authFetch(`${BACKEND_BASE}/chat/threads`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.threads || [];
      }
    } catch (err) {
      console.warn("Could not fetch threads from backend:", err);
    }
    return [];
  },

  async getChatState(threadId) {
    try {
      const res = await authFetch(`${BACKEND_BASE}/chat/state/${threadId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("Error fetching chat state:", err);
    }
    return null;
  },

  async deleteThread(threadId) {
    try {
      return await authFetch(`${BACKEND_BASE}/chat/threads/${threadId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to delete chat on backend:", err);
    }
  },

  async deleteMessage(threadId, messageIndex) {
    try {
      return await authFetch(
        `${BACKEND_BASE}/chat/${threadId}/message/${messageIndex}`,
        { method: "DELETE" }
      );
    } catch (err) {
      console.warn("Failed to delete message on backend:", err);
    }
  },

  async resetSession(threadId) {
    try {
      return await authFetch(`${BACKEND_BASE}/chat/state/${threadId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to reset session:", err);
    }
  },

  async streamChat(payload) {
    const res = await authFetch(`${BACKEND_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res;
  },
};

// --- ChromaDB Knowledge Base (RAG) APIs ---
export const knowledgeApi = {
  async getDocuments() {
    try {
      const res = await fetch(`${BACKEND_BASE}/knowledge`);
      if (res.ok) {
        const data = await res.json();
        return data.documents || [];
      }
    } catch (err) {
      console.warn("Failed to load ChromaDB docs:", err);
    }
    return [];
  },

  async addDocument(payload) {
    const res = await fetch(`${BACKEND_BASE}/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to add document.");
    }
    return data;
  },

  async deleteDocument(docId) {
    const res = await fetch(`${BACKEND_BASE}/knowledge/${docId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete document.");
    }
    return res;
  },

  async uploadFile(formData) {
    const res = await authFetch(`${BACKEND_BASE}/knowledge/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to upload document.");
    }
    return data;
  },
};
