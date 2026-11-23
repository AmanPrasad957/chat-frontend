import "./globals.css";

export const metadata = {
  title: "Admin Panel - Chat Interface",
  description: "Next.js AI Chat Interface with Google Gemini and ChromaDB RAG",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased select-none md:select-auto transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
