# MyCircle - Hyperlocal Exchange Platform Documentation

## 🚀 Project Status: Alpha

We have successfully implemented the MVP (Minimum Viable Product) for both the Web Client and the Mobile Application. The platform creates a seamless experience for users to post jobs, services, and items for sale or rent within their local community.

---

## 📱 Mobile Application (React Native + Expo)

We have built a fully functional mobile application mirroring the web platform's capabilities, optimized for iOS and Android.

### Key Features Implemented:
*   **Authentication**:
    *   Secure Login and Registration screens.
    *   JWT-based authentication with `expo-secure-store` for token management.
    *   Dedicated `AuthContext` for app-wide session handling.
*   **Tabs & Navigation**:
    *   Smooth bottom-tab navigation using **Expo Router**.
    *   Sections: **Explore (Feed)**, **Create**, **Requests**, **My Posts**, **Profile**.
*   **Feed (Explore)**:
    *   Dynamic feed displaying posts with infinite scroll feel.
    *   **Post Cards**: Rich UI showing images, price, location, and key actions (Contact, Share).
*   **Create Post**:
    *   Form to post jobs, items, or services.
    *   **Image Picker** integration: Users can upload photos directly from their device gallery.
*   **My Posts Dashboard**:
    *   Manage your listings with status filters (Active, Sold, Inactive).
    *   Quick actions to **Mark as Sold**, **Disable**, or **Delete** posts.
*   **Requests & Contacts**:
    *   **Privacy-First Approach**: Contact details are hidden until a request is approved.
    *   **Requests Tab**:
        *   **Received**: Approve or Reject incoming queries.
        *   **Sent**: Track your requests. If approved, call or WhatsApp directly from the app.
*   **Profile & Insights**:
    *   User profile view with avatars and bio.
    *   **Stats**: View total posts, requests received, and user rating.

---

## 💻 Web Client (React + Vite)

The web platform serves as the comprehensive desktop/mobile web interface.

### Key Features Implemented:
*   **Core Experience**:
    *   Responsive design using **Tailwind CSS**.
    *   Landing page with Hero section and Call-to-Actions.
*   **Advanced Dashboarding**:
    *   Detailed views for managing personal posts.
    *   Analytics overlay on post cards (Views, Clicks).
*   **Profile Management**:
    *   Edit Profile with skills, location, and bio.
    *   Visual stats display.
*   **Search & Filtering**:
    *   Robust search functionality to find specific services or items.
    *   Category filtering (Jobs, Services, For Sale, For Rent).

---

## 🛠 Backend Infrastructure (Node.js + Express)

A robust API powers both clients, ensuring data consistency and security.

*   **API Architecture**: RESTful API design.
*   **Database**: MongoDB with Mongoose schemas (Users, Posts, Contacts).
*   **Security**:
    *   BCrypt password hashing.
    *   JWT middleware for protected routes.
*   **Features**:
    *   **Post Logic**: CRUD operations, status toggling, and complex filtering.
    *   **Contact Logic**: Finite State Machine for requests (Pending -> Approved/Rejected).
    *   **User Logic**: Profile management and statistical aggregation.

---

## 📈 Recent Milestones

*   ✅ **Mobile App Launch**: Successfully initialized and deployed the React Native project with Expo.
*   ✅ **Feature Parity**: Achieved 1:1 feature parity between Web and Mobile.
*   ✅ **Privacy Controls**: Implemented the "Request to Contact" workflow on all platforms.
*   ✅ **Design System**: Established a consistent visual identity using Tailwind (Web) and NativeWind (Mobile).

## 🔮 Next Steps

*   **Notifications**: Implementing push notifications for new requests.
*   **Map View**: Visualizing posts on an interactive map.
*   **Chat System**: In-app messaging for approved contacts.
*   **AI Integration**: Enhanced recommendations and content moderation using Gemini.
