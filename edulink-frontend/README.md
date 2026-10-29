# 🎓 EduLink Frontend (Next.js 14)

Client web application for **EduLink — SRMIST Academic Resource Hub & Doubts Forum**.

> For comprehensive project architecture, database schemas, and full-stack setup instructions, see the **[Root README](../README.md)**.

---

## ⚡ Quick Start

```bash
# From repository root
npm run dev:frontend

# Or from within this directory
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the client application.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (SRM Dark Theme `#141314` with `#FF553E` accents)
- **Authentication & Database**: Supabase Client & Auth Helpers
- **Icons**: Lucide React
- **Calendar**: FullCalendar
- **Image Processing**: Client-side progressive canvas avatar compressor (<50 KB)

## 🔧 Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_API_URL="http://localhost:8000"
```
