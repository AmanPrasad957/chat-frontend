"use client";

import React, { useRef, useState } from "react";
import { Database, Loader2, Trash2, UploadCloud, X } from "lucide-react";

export default function KnowledgeBaseModal({
  isOpen,
  onClose,
  kbDocs,
  kbLoading,
  kbTitle,
  setKbTitle,
  kbCat,
  setKbCat,
  kbText,
  setKbText,
  handleAddKnowledge,
  deleteKnowledgeDoc,
  handleFileUpload,
  isUploadingFile,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const kbFileInputRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ChromaDB Vector Store
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Knowledge Base &amp; Retrieval-Augmented Generation (RAG)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/60">
              {kbDocs.length} documents
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
                ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30"
                : "border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
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
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                {isUploadingFile ? (
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {isUploadingFile
                  ? "Extracting & indexing document into ChromaDB..."
                  : "Drag & drop document here or click to browse"}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Supports <b>PDF, TXT, Markdown (.md), CSV, JSON</b> (up to 15MB)
              </p>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              or enter text manually
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Add Document Form */}
          <form
            onSubmit={handleAddKnowledge}
            className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3"
          >
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Add Document to Vector Store
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={kbTitle}
                onChange={(e) => setKbTitle(e.target.value)}
                placeholder="Title (e.g. VIP Warranty)"
                className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={kbCat}
                onChange={(e) => setKbCat(e.target.value)}
                placeholder="Category (e.g. warranty)"
                className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
            <textarea
              rows={2}
              value={kbText}
              onChange={(e) => setKbText(e.target.value)}
              placeholder="Document content to embed into ChromaDB..."
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
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
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Indexed Documents
            </span>
            {kbLoading ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                Loading ChromaDB documents...
              </div>
            ) : kbDocs.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                No documents in ChromaDB collection yet.
              </div>
            ) : (
              <div className="space-y-2">
                {kbDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {doc.metadata?.title || doc.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold uppercase">
                          {doc.metadata?.category || "general"}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {doc.metadata?.source || ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {doc.text}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteKnowledgeDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
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
  );
}
