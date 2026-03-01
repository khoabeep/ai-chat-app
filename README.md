# ✨ Knowledge Hub – AI Chat Bot

> **Trợ lý AI thông minh, powered by Google Gemini 2.5**

[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5-4285F4?logo=google&logoColor=white)](https://aistudio.google.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://knowledge-hub-ten-topaz.vercel.app)

---

## 🌐 Demo

🔗 **[knowledge-hub-ten-topaz.vercel.app](https://knowledge-hub-ten-topaz.vercel.app)**

---

## 🎯 Giới thiệu

**Knowledge Hub** là ứng dụng chat AI full-stack dành cho sinh viên và người học, cho phép:

- 💬 Trò chuyện streaming real-time với AI (Gemini 2.5 Flash / Pro)
- 🎓 Điều chỉnh độ sâu kiến thức: **Newbie / Intermediate / Expert**
- 🖼️ Phân tích hình ảnh và đọc nội dung file đính kèm
- ⚔️ Tranh luận đa chiều với **Debate Mode**
- 📊 Render sơ đồ **Mermaid** tự động từ câu trả lời AI

---

## 🛠️ Tech Stack

| Lớp | Công nghệ | Version |
|-----|-----------|---------|
| **Framework** | Next.js (App Router) | 15.3.6 |
| **Language** | TypeScript | 5 |
| **UI** | React | 19 |
| **Styling** | CSS Modules (Vanilla CSS) | — |
| **AI SDK** | @google/genai | 1.0.0 |
| **AI Models** | Gemini 2.5 Flash / Pro, 2.0 Flash | — |
| **Auth** | Firebase Authentication | — |
| **Storage** | LocalStorage (chat history) | — |
| **Deployment** | Vercel | — |

---

## ✨ Tính năng

### 💬 Chat & UI
- **Streaming response** – Câu trả lời hiện dần theo thời gian thực (SSE)
- **Multi-conversation** – Quản lý nhiều cuộc hội thoại, lưu `localStorage`
- **Typing indicator** – Hiện dấu ba chấm khi AI đang trả lời
- **Dark / Light mode** – Chuyển theme mượt mà
- **Mobile responsive** – Sidebar overlay, safe-area cho mọi màn hình

### 🤖 AI
- **Model selection** – Gemini 2.5 Flash / 2.5 Pro / 2.0 Flash
- **Expertise levels** – Newbie / Intermediate / Expert
- **Temperature control** – Điều chỉnh độ sáng tạo (0.1 – 1.0)
- **Debate Mode** – AI đóng 2 vai đối lập (🟢 Ủng hộ / 🔴 Phản biện / ⚖️ Tổng kết)
- **Vietnamese system prompt** – Tích hợp sẵn, trả lời tiếng Việt mặc định
- **Mermaid diagrams** – Tự động render sơ đồ từ code block \`\`\`mermaid

### 📎 Đầu vào
- **File attachment** – Upload ảnh và file văn bản (TXT, MD, CSV)
- **Voice input** – Nhập bằng giọng nói (Web Speech API)
- **Preset prompts** – Gợi ý nhanh theo chủ đề (Học tập / Code / Dịch thuật / Sáng tạo)
- **Character counter** – Giới hạn 4000 ký tự với hiển thị đếm

### 🔒 Bảo mật & Hiệu năng
- **API key server-side** – Key không bao giờ lộ ra phía client
- **Input throttle** – Chống spam gửi liên tục (800ms)
- **Error handling** – Phân loại lỗi chi tiết: Network / Quota / Auth / Server
- **Force-dynamic routes** – API routes không bị cache tĩnh khi build

---

## 🏗️ Kiến trúc

```
knowledge-hub/
├── app/
│   ├── api/
│   │   ├── auth/        # Firebase auth cookie
│   │   ├── chat/        # Gemini SSE streaming proxy
│   │   ├── debug/       # Kiểm tra API key & models
│   │   ├── graph/       # Knowledge graph data
│   │   ├── register/    # Đăng ký tài khoản
│   │   └── upload/      # Xử lý file upload
│   ├── login/           # Trang đăng nhập
│   ├── register/        # Trang đăng ký
│   ├── page.tsx         # Main chat UI
│   ├── page.module.css  # Chat styles
│   ├── globals.css      # Theme variables & reset
│   └── layout.tsx       # Root layout + metadata
├── components/
│   ├── Mermaid.tsx      # Mermaid diagram renderer
│   └── KnowledgeGraph.tsx
├── lib/
│   ├── firebase.ts      # Firebase config
│   ├── rag.ts           # RAG + TF-IDF utilities
│   └── data.ts          # Knowledge base data
└── middleware.ts        # Next.js Middleware
```

**Luồng dữ liệu:**
```
Client (page.tsx)
  → POST /api/chat
    → Gemini API (SSE Streaming)
    → ReadableStream → Client
      → Real-time UI update (React state)
```

---

## 🚀 Chạy local

```bash
# 1. Clone và cài dependencies
git clone https://github.com/khoabeep/ai-chat-app
cd knowledge-hub
npm install

# 2. Tạo file .env.local
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# 3. Chạy dev server
npm run dev
# → http://localhost:3000
```

> ⚠️ **Lưu ý bảo mật:** Không bao giờ commit file `.env.local` lên git. File này đã được thêm vào `.gitignore`.

---

## ☁️ Deploy lên Vercel

```bash
# Cài Vercel CLI
npm i -g vercel

# Link và deploy
vercel link
vercel env add GEMINI_API_KEY production
vercel --prod
```

Hoặc kết nối GitHub repo trực tiếp qua [vercel.com/new](https://vercel.com/new) → thêm `GEMINI_API_KEY` trong **Settings → Environment Variables**.

---

## 📋 Roadmap

- [x] Mobile responsive (sidebar overlay, safe-area)
- [x] Streaming response (SSE)
- [x] Dark / Light mode
- [x] Chat history (localStorage)
- [x] Voice input
- [x] File / image analysis
- [x] Model selection (2.5 Flash / Pro / 2.0 Flash)
- [x] Temperature control
- [x] Preset prompts
- [x] Error handling chi tiết
- [x] Input throttle + maxLength
- [x] Typing indicator
- [x] Mermaid diagram rendering
- [x] Debate Mode
- [x] Vercel deployment
- [ ] Firebase Auth – Login / Register hoàn chỉnh
- [ ] Usage limit theo user
- [ ] Xuất chat ra PDF / Markdown
- [ ] RAG với tài liệu người dùng tải lên

---

## 👤 Tác giả

**Nguyễn Vũ Đăng Khoa** — Sinh viên đại học, đam mê AI & Web Development

[![GitHub](https://img.shields.io/badge/GitHub-khoabeep-181717?logo=github)](https://github.com/khoabeep)
