import "./globals.css";

export const metadata = {
  title: "Admin Panel - Chat Interface",
  description: "Next.js AI Chat Interface with Google Gemini and ChromaDB RAG",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased select-none md:select-auto">
        {children}
      </body>
    </html>
  );
}
