"use client";

import React from "react";
import { Check, Code2, Copy, X } from "lucide-react";

export default function StateInspector({
  isOpen,
  onClose,
  currentState,
  currentThreadId,
  copied,
  copyStateJson,
}) {
  if (!isOpen) return null;

  const intentName = currentState?.nlu?.intent?.intent || "greeting";
  const intentConf = Math.round(
    (currentState?.nlu?.intent?.confidence || 0) * 100
  );

  return (
    <section className="w-full lg:w-[420px] flex-shrink-0 flex flex-col h-[calc(100vh-140px)] min-h-[620px] transition-all duration-200 animate-in slide-in-from-right-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden transition-colors duration-200">
        {/* State Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              State Inspector
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-transparent dark:border-emerald-800">
              {intentName} ({intentConf}%)
            </span>
            <button
              onClick={copyStateJson}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Copy JSON state"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* JSON State Viewer */}
        <div className="flex-1 p-4 overflow-auto custom-scrollbar bg-slate-50/70 dark:bg-slate-950/60 font-mono text-xs text-slate-800 dark:text-slate-200">
          <pre className="whitespace-pre leading-relaxed select-text font-mono text-[11px] text-slate-800 dark:text-slate-200">
            {JSON.stringify(currentState, null, 2)}
          </pre>
        </div>

        {/* Bottom Footer Details */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-5">
          <div>
            Thread:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {currentState?.thread_id || currentThreadId}
            </span>
          </div>
          <div>
            Channel:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              rest
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
