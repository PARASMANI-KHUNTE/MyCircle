# MyCircle Project Feature Overview

## 🚀 Project Status: Alpha v0.5
**MyCircle** is a hyperlocal exchange platform designed to connect neighbors for jobs, services, selling, and renting. The application focuses on trust, ease of use, and a modern, premium user experience.

---

## 📱 Mobile Application (React Native + Expo)
*New! Fully functional mobile experience targeting iOS and Android.*

### 1. **Native Experience**
- **Bottom Tab Navigation**: Seamless switching between Feed, Create, Requests, My Posts, and Profile.
- **Image Picker Integration**: Native access to device gallery for uploading post images.
- **Direct Calling & WhatsApp**: One-tap actions to contact approved connections.

### 2. **Mobile Exclusive Flows**
- **Touch-Optimized UI**: Larger tap targets, swipeable lists, and native-feel animations.
- **Mobile Auth**: Secure storage-based session management.
- **Status Dashboard**: Manage post availability on the go.

---

## 💻 Frontend Features (Web Client)

### 1. **Authentication & Onboarding**
- **User Registration/Login**: Secure email/password authentication (JWT-based).
- **Persistent Session**: value-added state management via `AuthContext`.
- **Protected Routes**: Middleware to guard authorized pages.

### 2. **Core Marketplace (Feed)**
- **Dynamic Feed**: Real-time fetching of active posts.
- **Advanced Filtering**: Filter by category (`Job`, `Service`, `Sell`, `Rent`).
- **Search Functionality**: Live text search for titles and descriptions.
- **Responsive Layout**: Masonry-style grid adapted for mobile and desktop.

### 3. **Post Management (Dashboard)**
- **Create Post**: Rich text editor for title, description, price, location, and category.
- **Image Upload**: Seamless integration for uploading post visuals.
- **My Posts Dashboard**:
    - **View Modes**: Toggle between Grid and List views.
    - **Status Management**: Mark posts as `Active`, `Inactive`, or `Sold`.
    - **Analytics Overlay**: View detailed stats (Total Views, Likes, Shares, Days Active) per post.
    - **Quick Actions**: Relist, Delete, or Disable posts directly from the card.

### 4. **Post Details & Interaction**
- **Detailed View**: Large hero images, full description, and location data.
- **Social Features**:
    - **Like System**: Heart active posts.
    - **Share**: Copy link to clipboard with count tracking.
- **Contact System**: Formal "Request Contact" flow instead of open DM spam.
- **Related Posts**: Smart suggestions based on category and location.

### 5. **User Profile & Reputation**
- **Profile View**:
    - **Bio & Skills**: Display user expertise and introduction.
    - **Stats Card**: Visual metrics for `Total Posts`, `Active Posts`, `Rating`, and `Contacts Received`.
- **Edit Profile**: comprehensive form to update avatar, bio, location, and skills (tag-based).
- **Identity**: Avatar generation (DiceBear) if no image uploaded.

### 6. **Engagement Center**
- **Requests Management**: Track incoming and outgoing contact requests.
- **Notifications Page**: Central hub for system alerts and interactions.

---

## 🛠️ Backend Features (Server)

### 1. **API Architecture**
- **RESTful Endpoints**: Structured `api/posts`, `api/user`, `api/contact`.
- **Middleware**: Custom `auth` middleware for role-based access.

### 2. **Data Models (MongoDB)**
- **User**: Extended schema with `preferences`, `stats`, and `skills`.
- **Post**: Robust life-cycle status (`active`, `inactive`, `sold`, `archived`) and analytics counters (`views`, `shares`).
- **ContactRequest**: Schema to manage connection states (`pending`, `accepted`, `rejected`).

### 3. **Advanced Logic**
- **Analytics Engine**: Real-time calculation of post engagement and age.
- **Smart Relations**: Algorithm to fetch related posts based on context.
- **Status Sync**: Automated handling of `isActive` boolean based on granular status strings.
- **Security**:
    - Password Hashing (Bcrypt).
    - AI Content Safety Checks (Gemini Integration for post moderation).

### 4. **Infrastructure**
- **Image Storage**: Cloudinary integration for optimized asset delivery.
- **Database**: MongoDB Atlas for scalable documents.

---

## 🎨 Design System
- **Visuals**: Glassmorphism ease-in effects, gradients, and dark-mode first aesthetic.
- **Components**: Reusable UI kit (`Button`, `Input`, `PostCard`, `StatsCard`, `PostStatusBadge`).
- **Animations**: `Framer Motion` (Web) and `Reanimated` (Mobile) integration.
- **Icons**: Consistent usage of `Lucide React` iconography across platforms.

---

## 🔜 Upcoming / Roadmap
- [ ] Real-time Chat Integration (Socket.io).
- [ ] Map View for "Near Me" discovery.
- [ ] Review & Rating System.
- [ ] Push Notifications (Expo).
