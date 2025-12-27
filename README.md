# ⭕ MyCircle

MyCircle is a **hyperlocal exchange** platform for neighbors to post and discover:

- **Jobs** (short tasks)
- **Services** (help nearby)
- **Sell / Rent** (items & spaces)

It’s built around a simple idea: **make local collaboration as easy as a scroll**.

---

## 🧭 Monorepo Layout
```text
MyCircle/
└── Paras/
    └── MyCircle/
        ├── MyCircleServer/       # Backend API (Node.js + Express)
        ├── MyCircleClient/       # Web Frontend (React + Vite)
        └── MyCircleMobileBare/   # Mobile App (React Native CLI)
```

---

## 🧩 Tech Stack
- **Web**
  - React 19, Vite, Tailwind CSS, Framer Motion
- **Mobile**
  - React Native (CLI), NativeWind, Reanimated
- **Backend**
  - Node.js, Express, MongoDB/Mongoose, Socket.io
- **Integrations**
  - Cloudinary (images), Google OAuth, Gemini (AI moderation)

---

## ✨ Highlights
- **Marketplace feed** for jobs/services/sell/rent
- **Contact request flow** to reduce spam
- **Real-time updates** (Socket.io)
- **Post analytics** (views/likes/shares)
- **AI moderation** for safer content

---

## � Quick Start (Local Dev)

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Cloudinary credentials (for uploads)

For **Android (React Native CLI)**:
- Android Studio + Android SDK
- A device/emulator configured

### Install dependencies
```bash
git clone https://github.com/PARASMANI-KHUNTE/MyCircle.git
cd MyCircle

(cd Paras/MyCircle/MyCircleServer && npm install)
(cd Paras/MyCircle/MyCircleClient && npm install)
(cd Paras/MyCircle/MyCircleMobileBare && npm install)
```

### Run backend + web
- **Server**
  - `cd Paras/MyCircle/MyCircleServer && npm run dev`
- **Web**
  - `cd Paras/MyCircle/MyCircleClient && npm run dev`

### Run mobile (MyCircleMobileBare)
- **Start Metro**
  - `cd Paras/MyCircle/MyCircleMobileBare && npm start`
- **Android**
  - `cd Paras/MyCircle/MyCircleMobileBare && npm run android`

---

## 🎨 Design
Dark-first, glassy UI with vibrant accents—built for a **fast, modern feed**.

---

## 📄 License
ISC
