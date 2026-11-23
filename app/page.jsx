"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BACKEND_BASE,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearSession,
  authFetch,
  stripHtmlAndMarkdown,
} from "../lib/api";

import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import StateInspector from "../components/StateInspector";
import KnowledgeBaseModal from "../components/KnowledgeBaseModal";
import AuthModal from "../components/AuthModal";

export default function AdminChatPage() {
  const [currentThreadId, setCurrentThreadId] = useState("test-user");
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
  const [isStateInspectorOpen, setIsStateInspectorOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

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
  const [uploadToast, setUploadToast] = useState(null);
  const fileInputRef = useRef(null);

  // Theme State (Dark / Light Mode)
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved =
      localStorage.getItem("chat_theme") ||
      (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(saved);
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("chat_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // Text-to-Speech (TTS) Audio States & Helpers
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isAutoTtsEnabled, setIsAutoTtsEnabled] = useState(false);
  const isAutoTtsEnabledRef = useRef(false);
  const speechRateRef = useRef(1.0);

  useEffect(() => {
    isAutoTtsEnabledRef.current = isAutoTtsEnabled;
  }, [isAutoTtsEnabled]);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  // Load TTS preferences from localStorage
  useEffect(() => {
    const savedRate = localStorage.getItem("chat_tts_speed");
    if (savedRate) {
      const parsed = parseFloat(savedRate);
      if (!isNaN(parsed) && parsed > 0) setSpeechRate(parsed);
    }
    const savedAuto = localStorage.getItem("chat_auto_tts");
    if (savedAuto === "true") {
      setIsAutoTtsEnabled(true);
    }
  }, []);

  function toggleAutoTts() {
    const next = !isAutoTtsEnabled;
    setIsAutoTtsEnabled(next);
    localStorage.setItem("chat_auto_tts", next ? "true" : "false");
    if (!next) {
      stopSpeaking();
    }
  }

  function cycleSpeechRate() {
    const rates = [1.0, 1.25, 1.5, 0.75];
    const currentIndex = rates.indexOf(speechRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setSpeechRate(nextRate);
    localStorage.setItem("chat_tts_speed", nextRate.toString());
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  }

  function speakMessage(text, msgId) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    if (speakingMsgId === msgId) {
      stopSpeaking();
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = stripHtmlAndMarkdown(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRateRef.current || 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel") ||
          v.name.includes("Karen") ||
          v.name.includes("Microsoft"))
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setSpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.warn("Speech synthesis error:", e);
      }
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
            { thread_id: "test-user", title: "Order Status & General Support" },
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
    stopSpeaking();
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

    initDefaultChat(threadId);
  }

  function initDefaultChat(id = currentThreadId) {
    const greetingName =
      currentUser?.full_name ||
      (currentUser?.email ? currentUser.email.split("@")[0] : "Admin");
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

  function createNewChat() {
    const newId = "chat-" + Date.now().toString(36);
    setCurrentThreadId(newId);
    setActiveThreads((prev) => [
      { thread_id: newId, title: "New Conversation" },
      ...prev,
    ]);
    initDefaultChat(newId);
  }

  async function deleteParticularChat(threadId, e) {
    if (e) e.stopPropagation();
    stopSpeaking();
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

  async function deleteParticularMessage(msgObj) {
    if (speakingMsgId === msgObj.id) {
      stopSpeaking();
    }
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

  async function resetSession() {
    stopSpeaking();
    try {
      await authFetch(`${BACKEND_BASE}/chat/state/${currentThreadId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to reset session:", err);
    }
    initDefaultChat(currentThreadId);
  }

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

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

      if (isAutoTtsEnabledRef.current && accumulatedText.trim()) {
        speakMessage(accumulatedText, botMsgId);
      }
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

  function copyStateJson() {
    navigator.clipboard.writeText(JSON.stringify(currentState, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function copyMessageText(msgId, text) {
    const clean = (text || "").replace(/<[^>]*>?/gm, "").trim();
    navigator.clipboard.writeText(clean).then(() => {
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 1800);
    });
  }

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

      const confirmationMsg = {
        id: `sys-${Date.now()}`,
        text: `📄 **Document Uploaded:** *${data.filename}* (${data.total_chunks} chunk(s) indexed into ChromaDB vector store). You can now ask questions about this document!`,
        isUser: false,
        index: messages.length,
      };
      setMessages((prev) => [...prev, confirmationMsg]);

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

  const currentThreadObj = activeThreads.find(
    (t) => t.thread_id === currentThreadId
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activeThreads={activeThreads}
        currentThreadId={currentThreadId}
        switchChat={switchChat}
        createNewChat={createNewChat}
        deleteParticularChat={deleteParticularChat}
        openKnowledgeModal={openKnowledgeModal}
        kbDocsCount={kbDocs.length}
        currentUser={currentUser}
        handleLogout={handleLogout}
        openAuthModal={() => {
          setAuthTab("login");
          setAuthError(null);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Chat Interface */}
      <ChatArea
        currentThreadTitle={currentThreadObj?.title || "Chat Interface"}
        currentThreadId={currentThreadId}
        isStateInspectorOpen={isStateInspectorOpen}
        setIsStateInspectorOpen={setIsStateInspectorOpen}
        isAutoTtsEnabled={isAutoTtsEnabled}
        toggleAutoTts={toggleAutoTts}
        speechRate={speechRate}
        cycleSpeechRate={cycleSpeechRate}
        theme={theme}
        toggleTheme={toggleTheme}
        deleteCurrentChat={() => deleteParticularChat(currentThreadId)}
        resetSession={resetSession}
        backendDocsUrl={`${BACKEND_BASE}/docs`}
        chatContainerRef={chatContainerRef}
        messages={messages}
        currentUser={currentUser}
        deleteParticularMessage={deleteParticularMessage}
        copyMessageText={copyMessageText}
        copiedMsgId={copiedMsgId}
        speakMessage={speakMessage}
        speakingMsgId={speakingMsgId}
        isTyping={isTyping}
        handleSend={handleSend}
        inputVal={inputVal}
        setInputVal={setInputVal}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        isUploadingFile={isUploadingFile}
        uploadToast={uploadToast}
        setUploadToast={setUploadToast}
        isListening={isListening}
        toggleSpeechRecognition={toggleSpeechRecognition}
      >
        {/* Developer State Inspector drawer embedded side-by-side */}
        <StateInspector
          isOpen={isStateInspectorOpen}
          onClose={() => setIsStateInspectorOpen(false)}
          currentState={currentState}
          currentThreadId={currentThreadId}
          copied={copied}
          copyStateJson={copyStateJson}
        />
      </ChatArea>

      {/* ChromaDB Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKbOpen}
        onClose={() => setIsKbOpen(false)}
        kbDocs={kbDocs}
        kbLoading={kbLoading}
        kbTitle={kbTitle}
        setKbTitle={setKbTitle}
        kbCat={kbCat}
        setKbCat={setKbCat}
        kbText={kbText}
        setKbText={setKbText}
        handleAddKnowledge={handleAddKnowledge}
        deleteKnowledgeDoc={deleteKnowledgeDoc}
        handleFileUpload={handleFileUpload}
        isUploadingFile={isUploadingFile}
      />

      {/* Authentication & User Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authTab={authTab}
        setAuthTab={setAuthTab}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authFullName={authFullName}
        setAuthFullName={setAuthFullName}
        authError={authError}
        setAuthError={setAuthError}
        authLoading={authLoading}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
      />
    </div>
  );
}
