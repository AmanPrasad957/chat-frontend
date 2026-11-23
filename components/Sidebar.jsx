"use client";

import React from "react";
import {
  Database,
  LogIn,
  LogOut,
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

export default function Sidebar({
  activeThreads,
  currentThreadId,
  switchChat,
  createNewChat,
  deleteParticularChat,
  openKnowledgeModal,
  kbDocsCount,
  currentUser,
  handleLogout,
  openAuthModal,
}) {
  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col justify-between py-5 px-4 transition-colors duration-200 md:h-screen md:sticky md:top-0">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 px-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 block leading-tight truncate">
              Gemini AI RAG
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Conversational Agent
            </span>
          </div>
        </div>

        {/* New Chat Primary Button */}
        <button
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 mb-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        {/* Knowledge Base RAG Trigger */}
        <button
          onClick={openKnowledgeModal}
          className="w-full mb-4 flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition font-medium text-xs border border-slate-200/80 dark:border-slate-800 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Knowledge Base</span>
          </div>
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
            {kbDocsCount > 0 ? `${kbDocsCount} Docs` : "RAG"}
          </span>
        </button>

        {/* Active Conversations Section */}
        <div className="flex-1 flex flex-col min-h-0 mb-3">
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Conversations
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {activeThreads.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
            {activeThreads.map((t) => {
              const isActive = t.thread_id === currentThreadId;
              return (
                <div
                  key={t.thread_id}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold border border-emerald-200/80 dark:border-emerald-800/60"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <div
                    className="truncate flex-1 pr-2 flex items-center gap-2"
                    onClick={() => switchChat(t.thread_id)}
                  >
                    <MessageSquare
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    />
                    <span className="truncate">{t.title || t.thread_id}</span>
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
      </div>

      <div>
        {/* Provider & Status Badges */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 px-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium">Backend Engine</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold uppercase text-[10px] border border-transparent dark:border-emerald-800">
              Gemini 2.0
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium">Vector Store</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold uppercase text-[10px] border border-transparent dark:border-blue-800">
              ChromaDB
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>FastAPI Connected</span>
          </div>
        </div>

        {/* User Account / Authentication Card */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 px-2">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs uppercase flex-shrink-0">
                  {(currentUser.full_name || currentUser.email || "U")[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {currentUser.full_name || currentUser.email.split("@")[0]}
                  </p>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded font-medium border border-transparent dark:border-emerald-800">
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
