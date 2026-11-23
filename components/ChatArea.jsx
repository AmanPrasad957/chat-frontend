"use client";

import React from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  Moon,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

export default function ChatArea({
  // Header Props
  currentThreadTitle,
  currentThreadId,
  isStateInspectorOpen,
  setIsStateInspectorOpen,
  isAutoTtsEnabled,
  toggleAutoTts,
  speechRate,
  cycleSpeechRate,
  theme,
  toggleTheme,
  deleteCurrentChat,
  resetSession,
  backendDocsUrl,

  // Conversation Stream Props
  chatContainerRef,
  messages,
  currentUser,
  deleteParticularMessage,
  copyMessageText,
  copiedMsgId,
  speakMessage,
  speakingMsgId,
  isTyping,

  // Quick Chips & Input Props
  handleSend,
  inputVal,
  setInputVal,
  fileInputRef,
  handleFileUpload,
  isUploadingFile,
  uploadToast,
  setUploadToast,
  isListening,
  toggleSpeechRecognition,
  children,
}) {
  return (
    <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
      {/* Top Header */}
      <header className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate max-w-md">
              {currentThreadTitle || "Chat Interface"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Gemini 2.0 Flash
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-mono">
            Thread: {currentThreadId}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* State Inspector Toggle Button */}
          <button
            onClick={() => setIsStateInspectorOpen(!isStateInspectorOpen)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
              isStateInspectorOpen
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
            title="Toggle State Inspector drawer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>
              {isStateInspectorOpen ? "Hide Inspector" : "{ } Inspect State"}
            </span>
          </button>

          {/* Auto-Speak / Hands-Free Voice Button */}
          <button
            onClick={toggleAutoTts}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
              isAutoTtsEnabled
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
            title={
              isAutoTtsEnabled
                ? "Auto-Speak enabled: bot speaks responses automatically (click to turn OFF)"
                : "Auto-Speak disabled: click to automatically read out bot responses"
            }
          >
            <Headphones
              className={`w-3.5 h-3.5 ${
                isAutoTtsEnabled
                  ? "text-emerald-600 dark:text-emerald-400 animate-pulse"
                  : "text-slate-400"
              }`}
            />
            <span>Auto-Speak: {isAutoTtsEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Voice Speed Cycle Button */}
          <button
            onClick={cycleSpeechRate}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold shadow-xs transition flex items-center gap-1 cursor-pointer"
            title="Click to cycle voice playback speed (1x, 1.25x, 1.5x, 0.75x)"
          >
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{speechRate}x</span>
          </button>

          {/* Sleek Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span className="capitalize">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>

          {/* Delete Current Chat Button */}
          <button
            onClick={deleteCurrentChat}
            className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Delete this particular chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete Chat</span>
          </button>

          {/* Reset Chat Button */}
          <button
            onClick={resetSession}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Reset this conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <a
            href={backendDocsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 border border-transparent dark:border-slate-700"
          >
            <span>Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Middle Chat Interface Section & Drawers */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 items-start">
        <section className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[620px] overflow-hidden transition-colors duration-200">
        {/* Conversation Stream */}
        <div
          ref={chatContainerRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto w-full space-y-5">
            {messages.map((m) => (
              <div key={m.id} className="w-full">
                {m.isUser ? (
                  /* User Message Bubble */
                  <div className="flex items-start justify-end gap-3 max-w-[85%] ml-auto group">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition self-center">
                      <button
                        onClick={() => deleteParticularMessage(m)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Delete this message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col items-end">
                      <div
                        className="bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed shadow-sm selection:bg-emerald-700"
                        dangerouslySetInnerHTML={{ __html: m.text }}
                      />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 flex-shrink-0 uppercase shadow-xs">
                      {(currentUser?.full_name || currentUser?.email || "U")[0]}
                    </div>
                  </div>
                ) : (
                  /* Assistant Message Bubble */
                  <div className="flex items-start justify-start gap-3 max-w-[88%] mr-auto group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Gemini Assistant
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded font-mono font-medium">
                          AI
                        </span>
                      </div>
                      <div
                        className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed shadow-xs"
                        dangerouslySetInnerHTML={{ __html: m.text }}
                      />
                      {/* Actions: Copy, Listen, Delete */}
                      <div className="flex items-center gap-2 mt-1.5 opacity-70 group-hover:opacity-100 transition text-slate-400 dark:text-slate-500 pl-1">
                        <button
                          onClick={() => copyMessageText(m.id, m.text)}
                          className="hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer flex items-center gap-1 text-[11px]"
                          title="Copy message"
                        >
                          {copiedMsgId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Copied!
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <span className="text-slate-300 dark:text-slate-700">
                          &bull;
                        </span>

                        <button
                          onClick={() => speakMessage(m.text, m.id)}
                          className={`transition cursor-pointer flex items-center gap-1 text-[11px] ${
                            speakingMsgId === m.id
                              ? "text-emerald-600 dark:text-emerald-400 font-medium animate-pulse"
                              : "hover:text-emerald-600 dark:hover:text-emerald-400"
                          }`}
                          title={
                            speakingMsgId === m.id
                              ? "Stop reading aloud"
                              : "Read aloud (Text-to-Speech)"
                          }
                        >
                          {speakingMsgId === m.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        <span className="text-slate-300 dark:text-slate-700">
                          &bull;
                        </span>

                        <button
                          onClick={() => deleteParticularMessage(m)}
                          className="hover:text-red-500 transition cursor-pointer flex items-center gap-1 text-[11px]"
                          title="Delete this message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm w-fit">
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Test Chips */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Quick Prompts:
          </span>
          <button
            onClick={() =>
              handleSend("Summarize the key information from our uploaded knowledge base documents.")
            }
            className="text-xs bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 px-2.5 py-1 rounded-full transition font-medium cursor-pointer"
          >
            📄 &quot;Summarize documents&quot;
          </button>
          <button
            onClick={() =>
              handleSend("What topics and documents are currently indexed in the knowledge base?")
            }
            className="text-xs bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 px-2.5 py-1 rounded-full transition font-medium cursor-pointer"
          >
            🔍 &quot;Search knowledge base&quot;
          </button>
          <button
            onClick={() =>
              handleSend("Explain how Retrieval-Augmented Generation (RAG) and vector databases work together.")
            }
            className="text-xs bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 px-2.5 py-1 rounded-full transition font-medium cursor-pointer"
          >
            💡 &quot;Explain RAG &amp; Vector Search&quot;
          </button>
          <button
            onClick={() =>
              handleSend("Write a clean Python function that performs semantic search using vector embeddings.")
            }
            className="text-xs bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 px-2.5 py-1 rounded-full transition font-medium cursor-pointer"
          >
            💻 &quot;Write Python code&quot;
          </button>
        </div>

        {/* Chat Input Form with Voice Dictation & Document Upload */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <div className="max-w-3xl mx-auto w-full">
            {/* Document Upload Status Toast */}
            {uploadToast && (
              <div
                className={`mb-3 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition animate-in fade-in duration-150 ${
                  uploadToast.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                    : uploadToast.type === "loading"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                    : "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {uploadToast.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  ) : uploadToast.type === "loading" ? (
                    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                  <span className="font-medium">{uploadToast.message}</span>
                </div>
                {uploadToast.type !== "loading" && (
                  <button
                    type="button"
                    onClick={() => setUploadToast(null)}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer"
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
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-650 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition cursor-pointer flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                title="Upload Document (PDF, TXT, CSV, MD, JSON) for RAG"
              >
                {isUploadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
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
                      : "Type your message or click the mic to speak..."
                  }
                  className={`w-full bg-white dark:bg-slate-850 border text-sm rounded-xl pl-4 pr-11 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition ${
                    isListening
                      ? "border-rose-400 ring-2 ring-rose-100 dark:ring-rose-950 placeholder-rose-400"
                      : "border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60"
                  }`}
                />
                {/* Microphone dictation button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`absolute right-2 p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                    isListening
                      ? "bg-rose-500 text-white shadow-sm shadow-rose-200 animate-pulse"
                      : "text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
              <div className="mt-2.5 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium px-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>
                  Microphone active &bull; Listening to your voice... Speak
                  clearly
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
        {children}
      </div>
    </main>
  );
}
