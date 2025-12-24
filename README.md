# ⭕ MyCircle: Hyperlocal Task & Exchange Platform

**MyCircle** is a hyperlocal exchange platform designed to connect neighbors for short-term jobs, services, and item exchanges. It is **exchange-centric**, focusing on community coordination via WhatsApp and phone.

---

## 🏗️ Project Structure
```text
MyCircle/
└── Paras/
    └── MyCircle/
        ├── MyCircleClient/       # Web Frontend (React 19 + Vite)
        │   ├── src/             # Frontend components, assets, and logic
        │   └── tailwind.config  # Glassmorphism design tokens
        ├── MyCircleMobilebare/       # Mobile App (React Native + NativeWind)
        │   ├── app/             
        │   └── src/             # Native components and shared logic
        ├── MyCircleServer/       # Backend API (Node.js + Express)
        │   ├── src/             # Mongoose models, controllers, and routes
        │   └── server.js        # Server entry point
        ├── docs/                # Technical documentation
        └── project_features.md  # Detailed alpha v0.5 feature overview
```

---

## 🛠️ Technology Stack
- **Web**: React 19, Vite, Tailwind CSS, Framer Motion, Three.js
- **Mobile**: Expo (ReactNative), Expo Router, NativeWind, Reanimated
- **Backend**: Node.js, Express, MongoDB/Mongoose, Socket.io
- **Integrations**: Google Gemini (AI Moderation), Cloudinary (Images), Google OAuth

---

## ✨ Core Features
- **Dynamic Marketplace**: Browse and search for Jobs, Services, Sales, or Rentals.
- **Request Coordination**: Formal contact request flow to prevent spam.
- **Post Analytics**: Real-time tracking of views, likes, and shares.
- **Identity & Reputation**: User profiles with skills and activity metrics.
- **AI Moderation**: Automatic content safety checks via Google Gemini.

---

## 🚦 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas & Cloudinary Credentials

### Installation

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/PARASMANI-KHUNTE/MyCircle.git
    cd MyCircle
    # Install dependencies in each folder
    (cd Paras/MyCircle/MyCircleServer && npm install)
    (cd Paras/MyCircle/MyCircleClient && npm install)
    (cd Paras/MyCircle/MyCircleMobile && npm install)
    ```

2.  **Run Development Servers**:
    - **Server**: `cd Paras/MyCircle/MyCircleServer && npm run dev`
    - **Web**: `cd Paras/MyCircle/MyCircleClient && npm run dev`
    - **Mobile**: `cd Paras/MyCircle/MyCircleMobile && npx expo start`

---

## 🎨 Design Philosophy
A **Dark-First Glassmorphic** aesthetic using soft blurs and vibrant gradients for a premium, modern feel.

---

## 📄 License
Licensed under the ISC License.
