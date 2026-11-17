# AI Chat Frontend (`chat-frontend`)

Modern **Next.js** AI Chat Interface and Admin Panel with real-time state inspection and ChromaDB vector RAG controls.

---

## 🚀 Features

- **Admin Panel & Chat Interface**: Multi-thread conversation sidebar, active chats management, and hover-to-delete message bubbles.
- **Current State Inspector**: Live JSON inspector displaying intent classification, confidence scores, and entities with copy-to-clipboard support.
- **ChromaDB Vector Store Modal**: Modal to view indexed knowledge documents, add new documents, and delete documents.
- **Quick Test Prompts**: One-click prompt chips for order status, warranty, and shipping.
- **Next.js App Router**: Built with Next.js 14, React 18, Tailwind CSS, and Lucide Icons.

---

## 🛠️ Quickstart Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend Proxy (Optional)
By default, requests to `/chat` and `/knowledge` are proxied to `http://127.0.0.1:8000` via `next.config.mjs`. You can also configure:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the interface.

---

## 📦 Build for Production

```bash
npm run build
npm run start
```
