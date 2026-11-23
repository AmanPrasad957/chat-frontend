"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  AlertCircle,
  Box,
  BrainCircuit,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MessageSquare,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sliders,
  Terminal,
  Trash2,
  UploadCloud,
  User,
  X,
} from "lucide-react";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function AdminChatPage() {
  const [currentThreadId, setCurrentThreadId] = useState("test-user");
  const [username] = useState("Admin");
  const [activeThreads, setActiveThreads] = useState([
    { thread_id: "test-user", title: "Order Status & General Support" },
  ]);

  const [messages, setMessages] = useState([
    { id: "init-1", text: "Hi Admin", isUser: false, index: 0 },
    { id: "init-2", text: "What can i do for you ?", isUser: false, index: 1 },
  ]);

  const [currentState, setCurrentState] = useState({
    thread_id: "test-user",
    user_message: {
      thread_id: "test-user",
      text: "",
      channel: "rest",
      context: {},
    },
    bot_message: [
      { text: "Hi Admin" },
      { text: "What can i do for you ?" },
    ],
    nlu: {
      entities: {},
      intent: {
        intent: "greeting",
        confidence: 0.985,
      },
    },
    context: {
      result: {},
      username: "Admin",
    },
  });

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Authentication & User Account States
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // "login" | "register"
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const recognitionRef = useRef(null);
  const baseInputRef = useRef("");

  // ChromaDB Knowledge Base Modal States
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [kbDocs, setKbDocs] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbTitle, setKbTitle] = useState("");
  const [kbCat, setKbCat] = useState("");
  const [kbText, setKbText] = useState("");

  // Document Upload States
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadToast, setUploadToast] = useState(null); // { type: 'success' | 'error' | 'loading', message: string }
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const kbFileInputRef = useRef(null);

  const chatContainerRef = useRef(null);

  // Auto-scroll chat container to bottom on message or typing change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Token management helpers
  function getAccessToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("chat_access_token");
  }

  function getRefreshToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("chat_refresh_token");
  }

  function saveTokens(accessToken, refreshToken, user) {
    if (typeof window === "undefined") return;
    if (accessToken) localStorage.setItem("chat_access_token", accessToken);
    if (refreshToken) localStorage.setItem("chat_refresh_token", refreshToken);
    if (user) {
      localStorage.setItem("chat_user", JSON.stringify(user));
      setCurrentUser(user);
    }
  }

  function clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("chat_access_token");
    localStorage.removeItem("chat_refresh_token");
    localStorage.removeItem("chat_user");
    setCurrentUser(null);
  }

  // Authenticated fetch wrapper with automatic token refresh on 401
  async function authFetch(url, options = {}) {
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

  // Restore authenticated session on mount and load active threads
  useEffect(() => {
    const storedUser = localStorage.getItem("chat_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {}
    }

    const token = getAccessToken();
    if (token) {
      fetch(`${BACKEND_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((userData) => {
          if (userData) {
            setCurrentUser(userData);
            localStorage.setItem("chat_user", JSON.stringify(userData));
          }
          fetchThreads();
        })
        .catch(() => {
          fetchThreads();
        });
    } else {
      fetchThreads();
    }
  }, []);

  async function fetchThreads() {
    try {
      const res = await authFetch(`${BACKEND_BASE}/chat/threads`);
      if (res.ok) {
        const data = await res.json();
        const threads = Array.isArray(data) ? data : data.threads || [];
        if (threads.length > 0) {
          const formatted = threads.map((t) => ({
            thread_id: t.thread_id,
            title: t.title || t.thread_id,
          }));
          setActiveThreads(formatted);
        } else {
          setActiveThreads([
            { thread_id: "test-user", title: "Order Status & General Support" }
          ]);
        }
      }
    } catch (err) {
      console.warn("Could not fetch threads from backend:", err);
    }
  }

  // Handle user login
  async function handleLogin(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch(`${BACKEND_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed. Please check your credentials.");
      }

      saveTokens(data.access_token, data.refresh_token, data.user);
      setIsAuthModalOpen(false);
      setAuthPassword("");
      await fetchThreads();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  // Handle user registration
  async function handleRegister(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch(`${BACKEND_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          full_name: authFullName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      // Auto login after registration
      const loginRes = await fetch(`${BACKEND_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        saveTokens(loginData.access_token, loginData.refresh_token, loginData.user);
        setIsAuthModalOpen(false);
        setAuthPassword("");
        await fetchThreads();
      } else {
        setAuthTab("login");
        setAuthError("Account created successfully! Please sign in.");
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  // Handle user logout
  async function handleLogout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await fetch(`${BACKEND_BASE}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (err) {
        console.warn("Logout error:", err);
      }
    }
    clearSession();
    await fetchThreads();
  }

  // Switch conversation thread
  async function switchChat(threadId) {
    setCurrentThreadId(threadId);
    try {
      const res = await authFetch(`${BACKEND_BASE}/chat/state/${threadId}`);
      if (res.ok) {
        const state = await res.json();
        const history = state.history || [];
        if (history.length > 0) {
          const reconstructed = [];
          history.forEach((turn, idx) => {
            if (turn.user) {
              reconstructed.push({
                id: `msg-u-${idx}`,
                text: turn.user,
                isUser: true,
                index: idx,
              });
            }
            if (turn.bot) {
              const bMsgs = Array.isArray(turn.bot) ? turn.bot : [turn.bot];
              bMsgs.forEach((bm, bIdx) => {
                reconstructed.push({
                  id: `msg-b-${idx}-${bIdx}`,
                  text: bm,
                  isUser: false,
                  index: idx,
                });
              });
            }
          });
          setMessages(reconstructed);

          const lastTurn = history[history.length - 1];
          setCurrentState({
            thread_id: threadId,
            user_message: {
              thread_id: threadId,
              text: lastTurn?.user || "",
              channel: "rest",
              context: state.context || {},
            },
            bot_message: Array.isArray(lastTurn?.bot)
              ? lastTurn.bot.map((t) => ({ text: t }))
              : [{ text: String(lastTurn?.bot || "") }],
            nlu: {
              entities: {},
              intent: { intent: "loaded_conversation", confidence: 1.0 },
            },
            context: state.context || {},
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Error switching chat:", e);
    }

    // Default empty thread
    initDefaultChat(threadId);
  }

  function initDefaultChat(id = currentThreadId) {
    const greetingName = currentUser?.full_name || (currentUser?.email ? currentUser.email.split("@")[0] : "Admin");
    setMessages([
      { id: `init-1-${id}`, text: `Hi ${greetingName}`, isUser: false, index: 0 },
      { id: `init-2-${id}`, text: "What can i do for you ?", isUser: false, index: 1 },
    ]);
    setCurrentState({
      thread_id: id,
      user_message: {
        thread_id: id,
        text: "",
        channel: "rest",
        context: {},
      },
      bot_message: [
        { text: `Hi ${greetingName}` },
        { text: "What can i do for you ?" },
      ],
      nlu: {
        entities: {},
        intent: {
          intent: "greeting",
          confidence: 0.985,
        },
      },
      context: {
        result: {},
        username: greetingName,
      },
    });
  }

  // Create brand new conversation
  function createNewChat() {
    const newId = "chat-" + Date.now().toString(36);
    setCurrentThreadId(newId);
    setActiveThreads((prev) => [
      { thread_id: newId, title: "New Conversation" },
      ...prev,
    ]);
    initDefaultChat(newId);
  }

  // Delete an entire chat conversation
  async function deleteParticularChat(threadId, e) {
    if (e) e.stopPropagation();
    try {
      await authFetch(`${BACKEND_BASE}/chat/threads/${threadId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to delete chat on backend:", err);
    }

    const updated = activeThreads.filter((t) => t.thread_id !== threadId);
    setActiveThreads(updated);

    if (currentThreadId === threadId) {
      if (updated.length > 0) {
        switchChat(updated[0].thread_id);
      } else {
        createNewChat();
      }
    }
  }

  // Delete an individual message
  async function deleteParticularMessage(msgObj) {
    if (msgObj.index !== null && msgObj.index !== undefined) {
      try {
        await authFetch(
          `${BACKEND_BASE}/chat/${currentThreadId}/message/${msgObj.index}`,
          { method: "DELETE" }
        );
      } catch (err) {
        console.warn("Failed to delete message on backend:", err);
      }
    }
    setMessages((prev) => prev.filter((m) => m.id !== msgObj.id));
  }

  // Reset current session
  async function resetSession() {
    try {
      await authFetch(`${BACKEND_BASE}/chat/state/${currentThreadId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to reset session:", err);
    }
    initDefaultChat(currentThreadId);
  }

  // Clean up speech recognition on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Toggle Voice Input via native Web Speech API
  function toggleSpeechRecognition() {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop speech recognition:", e);
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      alert(
        "Voice dictation (Web Speech API) is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Safari."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      baseInputRef.current = inputVal ? inputVal.trim() + " " : "";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputVal(baseInputRef.current + transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          alert("Microphone permission was denied. Please allow microphone access in your browser settings.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Error starting speech recognition:", err);
      setIsListening(false);
    }
  }

  // Send message to chatbot API
  async function handleSend(textToSend) {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    const text = (textToSend || inputVal).trim();
    if (!text) return;
    setInputVal("");

    const newMsgIndex = messages.length;
    const userMsg = {
      id: `user-${Date.now()}`,
      text: text,
      isUser: true,
      index: newMsgIndex,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Update title in sidebar if new thread
    setActiveThreads((prev) =>
      prev.map((t) => {
        if (
          t.thread_id === currentThreadId &&
          (!t.title || t.title === "New Conversation")
        ) {
          return {
            ...t,
            title: text.length > 25 ? text.substring(0, 25) + "..." : text,
          };
        }
        return t;
      })
    );

    const userDisplayName =
      currentUser?.full_name ||
      (currentUser?.email ? currentUser.email.split("@")[0] : "Admin");

    const payload = {
      text: text,
      thread_id: currentThreadId,
      channel: "rest",
      context: { username: userDisplayName },
    };

    const botMsgId = `bot-${Date.now()}`;
    let accumulatedText = "";

    try {
      const res = await authFetch(`${BACKEND_BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Add bot message bubble for streaming tokens
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          text: "",
          isUser: false,
          index: newMsgIndex + 1,
        },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          const trimmed = block.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, "");
          if (!jsonStr) continue;

          try {
            const ev = JSON.parse(jsonStr);
            if (ev.type === "token") {
              accumulatedText += ev.delta || "";
              setIsTyping(false);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, text: accumulatedText } : m
                )
              );
            } else if (ev.type === "done") {
              setIsTyping(false);
              setCurrentState(ev);
            }
          } catch (e) {
            console.warn("Error parsing SSE block:", e);
          }
        }
      }

      setIsTyping(false);
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== botMsgId || m.text.trim().length > 0),
        {
          id: `err-${Date.now()}`,
          text: `<span class="text-red-500 font-medium">Error: Could not reach chatbot API (${err.message})</span>`,
          isUser: false,
          index: newMsgIndex + 1,
        },
      ]);
    }
  }

  // Copy state JSON to clipboard
  function copyStateJson() {
    navigator.clipboard.writeText(JSON.stringify(currentState, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  // ChromaDB Knowledge Base Modal methods
  async function openKnowledgeModal() {
    setIsKbOpen(true);
    await loadKnowledgeDocuments();
  }

  async function loadKnowledgeDocuments() {
    setKbLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/knowledge`);
      if (res.ok) {
        const data = await res.json();
        setKbDocs(data.documents || []);
      }
    } catch (err) {
      console.warn("Failed to load ChromaDB docs:", err);
    } finally {
      setKbLoading(false);
    }
  }

  async function handleAddKnowledge(e) {
    e.preventDefault();
    if (!kbText.trim()) return;

    const payload = {
      text: kbText.trim(),
      title: kbTitle.trim() || "User Document",
      category: kbCat.trim() || "custom",
      source: "admin_ui_upload",
    };

    try {
      const res = await fetch(`${BACKEND_BASE}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setKbTitle("");
        setKbCat("");
        setKbText("");
        await loadKnowledgeDocuments();
      }
    } catch (err) {
      alert("Error adding document: " + err.message);
    }
  }

  async function deleteKnowledgeDoc(docId) {
    if (!confirm("Delete this document from ChromaDB vector store?")) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/knowledge/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadKnowledgeDocuments();
      }
    } catch (err) {
      alert("Failed to delete document: " + err.message);
    }
  }

  // Handle Document Upload (PDF, TXT, CSV, MD, JSON) into ChromaDB
  async function handleFileUpload(file) {
    if (!file) return;

    const supportedExts = [".pdf", ".txt", ".md", ".csv", ".json"];
    const fileExt = "." + file.name.split(".").pop().toLowerCase();
    if (!supportedExts.includes(fileExt)) {
      setUploadToast({
        type: "error",
        message: `Unsupported file type (${fileExt}). Please upload .pdf, .txt, .md, .csv, or .json.`,
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadToast({
        type: "error",
        message: "File exceeds 15MB maximum size limit.",
      });
      return;
    }

    setIsUploadingFile(true);
    setUploadToast({
      type: "loading",
      message: `Uploading & indexing "${file.name}" into ChromaDB...`,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "user_documents");

      const res = await authFetch(`${BACKEND_BASE}/knowledge/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to upload document.");
      }

      setUploadToast({
        type: "success",
        message: `Indexed "${data.filename}" (${data.total_chunks} chunks stored in ChromaDB)!`,
      });

      // Append confirmation system message to the chat
      const confirmationMsg = {
        id: `sys-${Date.now()}`,
        text: `📄 **Document Uploaded:** *${data.filename}* (${data.total_chunks} chunk(s) indexed into ChromaDB vector store). You can now ask questions about this document!`,
        isUser: false,
        index: messages.length,
      };
      setMessages((prev) => [...prev, confirmationMsg]);

      // If KB modal is open or loaded, refresh document list
      loadKnowledgeDocuments();

      setTimeout(() => {
        setUploadToast(null);
      }, 5000);
    } catch (err) {
      setUploadToast({
        type: "error",
        message: err.message || "Failed to process document upload.",
      });
    } finally {
      setIsUploadingFile(false);
    }
  }

  const intentName = currentState?.nlu?.intent?.intent || "greeting";
  const intentConf = Math.round(
    (currentState?.nlu?.intent?.confidence || 0) * 100
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased bg-[#f8fafc] text-slate-800">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col justify-between py-6 px-4">
        <div>
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 px-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xl font-bold tracking-tight text-emerald-800">
              Admin Panel
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 mb-6">
            <a
              href="#intents"
              className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm"
            >
              <BrainCircuit className="w-5 h-5 text-emerald-600" />
              Intents
            </a>
            <a
              href="#entities"
              className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm"
            >
              <Box className="w-5 h-5 text-emerald-600" />
              Entities
            </a>
            <a
              href="#chat"
              className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold text-sm shadow-sm"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Chat
            </a>
            <a
              href="#logs"
              className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm"
            >
              <Terminal className="w-5 h-5 text-emerald-600" />
              Logs
            </a>
          </nav>

          {/* Active Conversations Section with Delete Controls */}
          <div className="mb-6">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-emerald-700/80 uppercase">
                Active Chats
              </span>
              <button
                onClick={createNewChat}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                title="Create a new chat conversation"
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar px-1">
              {activeThreads.map((t) => {
                const isActive = t.thread_id === currentThreadId;
                return (
                  <div
                    key={t.thread_id}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                      isActive
                        ? "bg-emerald-100/70 text-emerald-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className="truncate flex-1 pr-1.5"
                      onClick={() => switchChat(t.thread_id)}
                    >
                      {t.title || t.thread_id}
                    </div>
                    <button
                      onClick={(e) => deleteParticularChat(t.thread_id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                      title="Delete this chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings Section */}
          <div className="px-3 mb-2 text-xs font-semibold tracking-wider text-emerald-700/80 uppercase">
            Settings
          </div>
          <nav className="space-y-1">
            <a
              href="#ml"
              className="flex items-center gap-3.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm"
            >
              <Sliders className="w-5 h-5 text-emerald-600" />
              ML Settings
            </a>

            <button
              onClick={openKnowledgeModal}
              className="w-full text-left flex items-center gap-3.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm cursor-pointer"
            >
              <Database className="w-5 h-5 text-emerald-600" />
              Data Management
              <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                RAG
              </span>
            </button>

            <a
              href="#integrations"
              className="flex items-center gap-3.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm"
            >
              <Layers className="w-5 h-5 text-emerald-600" />
              Integrations
            </a>
          </nav>
        </div>

        {/* Provider & Status Badges */}
        <div className="pt-4 border-t border-slate-100 px-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Backend Engine</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold uppercase text-[10px]">
              Google Gemini
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Vector Store</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold uppercase text-[10px]">
              ChromaDB
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live at :8000</span>
          </div>
        </div>

        {/* User Account / Authentication Card */}
        <div className="pt-3 border-t border-slate-100 px-3">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs uppercase flex-shrink-0">
                  {(currentUser.full_name || currentUser.email || "U")[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {currentUser.full_name || currentUser.email.split("@")[0]}
                  </p>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded font-medium">
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthError(null);
                setIsAuthModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>

      {/* ================= MAIN WORKSPACE AREA ================= */}
      <main className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto">
        {/* Top Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Chat Interface
              </h1>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-medium">
                {currentThreadId}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Test your chatbot&apos;s responses in real-time
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Delete Current Chat Button */}
            <button
              onClick={() => deleteParticularChat(currentThreadId)}
              className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50/80 hover:bg-red-100 text-red-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Delete this particular chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Chat
            </button>

            {/* Reset Chat Button */}
            <button
              onClick={resetSession}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Reset this conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Session
            </button>

            <a
              href={`${BACKEND_BASE}/docs`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <span>Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Two Column Grid: Left Chat Panel & Right State Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* ================= MIDDLE CHAT INTERFACE ================= */}
          <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-[700px] overflow-hidden">
            {/* Conversation Stream */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`message-group relative flex items-center gap-2 max-w-[85%] ${
                    m.isUser ? "justify-end ml-auto" : "justify-start"
                  }`}
                >
                  {m.isUser && (
                    <button
                      onClick={() => deleteParticularMessage(m)}
                      className="msg-delete-btn opacity-0 transition p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 cursor-pointer"
                      title="Delete this message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div
                    className={
                      m.isUser
                        ? "bg-blue-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed shadow-sm"
                        : "bg-slate-100 text-slate-800 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm leading-relaxed shadow-sm"
                    }
                    dangerouslySetInnerHTML={{ __html: m.text }}
                  />

                  {!m.isUser && (
                    <button
                      onClick={() => deleteParticularMessage(m)}
                      className="msg-delete-btn opacity-0 transition p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 cursor-pointer"
                      title="Delete this message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm w-fit">
                  <div
                    className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              )}
            </div>

            {/* Quick Test Chips */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Prompts:
              </span>
              <button
                onClick={() =>
                  handleSend("can you help to find the status of my order")
                }
                className="text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-full transition font-medium cursor-pointer"
              >
                📦 &quot;find the status of my order&quot;
              </button>
              <button
                onClick={() => handleSend("it's ORD987124")}
                className="text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-full transition font-medium cursor-pointer"
              >
                🔑 &quot;it&apos;s ORD987124&quot;
              </button>
              <button
                onClick={() =>
                  handleSend(
                    "What is your return policy and refund window?"
                  )
                }
                className="text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-full transition font-medium cursor-pointer"
              >
                📚 &quot;Return Policy&quot;
              </button>
              <button
                onClick={() =>
                  handleSend("How long does standard shipping take?")
                }
                className="text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-full transition font-medium cursor-pointer"
              >
                🚚 &quot;Shipping Timeline&quot;
              </button>
            </div>

            {/* Chat Input Form with Voice Dictation & Document Upload */}
            <div className="p-4 bg-white border-t border-slate-200">
              {/* Document Upload Status Toast */}
              {uploadToast && (
                <div
                  className={`mb-3 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition animate-in fade-in duration-150 ${
                    uploadToast.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : uploadToast.type === "loading"
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {uploadToast.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : uploadToast.type === "loading" ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className="font-medium">{uploadToast.message}</span>
                  </div>
                  {uploadToast.type !== "loading" && (
                    <button
                      type="button"
                      onClick={() => setUploadToast(null)}
                      className="p-1 hover:bg-black/5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2.5"
              >
                {/* Paperclip Document Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="p-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 hover:text-emerald-700 rounded-xl transition cursor-pointer flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                  title="Upload Document (PDF, TXT, CSV, MD, JSON) for RAG"
                >
                  {isUploadingFile ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.txt,.md,.csv,.json"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />

                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={
                      isListening
                        ? "Listening... Speak into your microphone"
                        : "Type your message or click the mic to speak"
                    }
                    className={`w-full bg-white border text-sm rounded-xl pl-4 pr-11 py-3 text-slate-800 placeholder-slate-400 outline-none transition ${
                      isListening
                        ? "border-rose-400 ring-2 ring-rose-100 placeholder-rose-400"
                        : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    }`}
                  />
                  {/* Microphone dictation button */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`absolute right-2 p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                      isListening
                        ? "bg-rose-500 text-white shadow-sm shadow-rose-200 animate-pulse"
                        : "text-slate-400 hover:text-emerald-700 hover:bg-slate-100"
                    }`}
                    title={
                      isListening
                        ? "Listening... Click to stop voice dictation"
                        : "Voice Input (Speech-to-Text)"
                    }
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer flex-shrink-0"
                >
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Real-time Listening Status Indicator */}
              {isListening && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-rose-600 font-medium px-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Microphone active &bull; Listening to your voice... Speak clearly</span>
                </div>
              )}
            </div>
          </section>

          {/* ================= RIGHT COLUMN: CURRENT STATE ================= */}
          <section className="lg:col-span-5 flex flex-col h-[700px]">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex-1 flex flex-col overflow-hidden">
              {/* State Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Current State
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    intent: {intentName} ({intentConf}%)
                  </span>
                  <button
                    onClick={copyStateJson}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
                    title="Copy JSON state"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* JSON State Viewer */}
              <div className="flex-1 p-5 overflow-auto custom-scrollbar bg-slate-50/70 font-mono text-xs text-slate-800">
                <pre className="whitespace-pre leading-relaxed select-text font-mono text-[12px] text-slate-800">
                  {JSON.stringify(currentState, null, 2)}
                </pre>
              </div>

              {/* Bottom Footer Details */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-5">
                <div>
                  Thread:{" "}
                  <span className="font-semibold text-slate-700">
                    {currentState?.thread_id || currentThreadId}
                  </span>
                </div>
                <div>
                  Channel:{" "}
                  <span className="font-semibold text-slate-700">rest</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ================= CHROMADB KNOWLEDGE BASE MODAL ================= */}
      {isKbOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ChromaDB Vector Store
                  </h3>
                  <p className="text-xs text-slate-500">
                    Knowledge Base &amp; Retrieval-Augmented Generation (RAG)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  {kbDocs.length} documents
                </span>
                <button
                  onClick={() => setIsKbOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {/* Drag & Drop File Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => kbFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/60"
                    : "border-slate-300 hover:border-emerald-400 bg-slate-50/70 hover:bg-emerald-50/20"
                }`}
              >
                <input
                  type="file"
                  ref={kbFileInputRef}
                  accept=".pdf,.txt,.md,.csv,.json"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    {isUploadingFile ? (
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {isUploadingFile
                      ? "Extracting & indexing document into ChromaDB..."
                      : "Drag & drop document here or click to browse"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports <b>PDF, TXT, Markdown (.md), CSV, JSON</b> (up to 15MB)
                  </p>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  or enter text manually
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Add Document Form */}
              <form
                onSubmit={handleAddKnowledge}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
              >
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Add Document to Vector Store
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={kbTitle}
                    onChange={(e) => setKbTitle(e.target.value)}
                    placeholder="Title (e.g. VIP Warranty)"
                    className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={kbCat}
                    onChange={(e) => setKbCat(e.target.value)}
                    placeholder="Category (e.g. warranty)"
                    className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
                <textarea
                  rows={2}
                  value={kbText}
                  onChange={(e) => setKbText(e.target.value)}
                  placeholder="Document content to embed into ChromaDB..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
                ></textarea>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    Index into ChromaDB
                  </button>
                </div>
              </form>

              {/* Document List */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Indexed Documents
                </span>
                {kbLoading ? (
                  <div className="text-xs text-slate-500 py-4 text-center">
                    Loading ChromaDB documents...
                  </div>
                ) : kbDocs.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    No documents in ChromaDB collection yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {kbDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-800">
                              {doc.metadata?.title || doc.id}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold uppercase">
                              {doc.metadata?.category || "general"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {doc.metadata?.source || ""}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {doc.text}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteKnowledgeDoc(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= USER AUTHENTICATION MODAL ================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {authTab === "login" ? "Welcome Back" : "Create Account"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {authTab === "login"
                      ? "Sign in to access your saved chat threads"
                      : "Register with email to persist conversation history"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => {
                  setAuthTab("login");
                  setAuthError(null);
                }}
                className={`flex-1 py-3 text-xs font-bold transition text-center cursor-pointer border-b-2 ${
                  authTab === "login"
                    ? "border-emerald-600 text-emerald-800 bg-emerald-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthTab("register");
                  setAuthError(null);
                }}
                className={`flex-1 py-3 text-xs font-bold transition text-center cursor-pointer border-b-2 ${
                  authTab === "register"
                    ? "border-emerald-600 text-emerald-800 bg-emerald-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Register
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={authTab === "login" ? handleLogin : handleRegister} className="space-y-4">
                {authTab === "register" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name (Optional)
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type="text"
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
                    />
                  </div>
                  {authTab === "register" && (
                    <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {authLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>
                    {authTab === "login"
                      ? authLoading ? "Signing in..." : "Sign In"
                      : authLoading ? "Creating account..." : "Create Account"}
                  </span>
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab(authTab === "login" ? "register" : "login");
                    setAuthError(null);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                >
                  {authTab === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
