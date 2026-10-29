# System Design & Architecture

This document describes the complete system design, architecture, technology stack, and workflows for the **Hyperlocal Task & Exchange Platform**.

---

## 1. System Overview

The platform enables users to post short-term jobs, offer services, sell items, or rent items within a local area. It is **exchange-centric, not money-centric**, allowing users to coordinate freely via phone or WhatsApp after approval.

The system is designed to be:
- Lightweight and fast to build
- Safe by design
- Scalable for future growth
- Suitable for real-world, informal use cases

---

## 2. Technology Stack

### Frontend
- **Web Application**: MERN (React.js)
- **Mobile Application**: React Native

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **API Style**: REST APIs

### Database
- **MongoDB**
  - Primary database for structured data

### Image & Media Storage
- **Cloudinary**
  - Stores item images, service images, and profile photos

### Authentication
- **Google Authentication (OAuth 2.0)**
  - Secure login and identity verification

### AI & Intelligence
- **Gemini API**
  - Content moderation
  - Scam detection
  - Smart category assistance

---

## 3. High-Level Architecture

```
[ React Web ]        [ React Native App ]
       |                      |
       | HTTPS + JWT          |
       |                      |
       v                      v
           [ Node.js + Express API ]
                    |
     ----------------------------------------
     |        |         |        |          |
 [ Auth ] [ Posts ] [ Contact ] [ Safety ] [ AI ]
     |        |         |        |          |
     ----------------------------------------
                    |
                [ MongoDB ]
                    |
         ---------------------------
         |                         |
   [ Cloudinary ]           [ Google Services ]
   (Images)                 (Auth, Gemini)
```

The system follows a **modular monolith** architecture for simplicity and rapid development.

---

## 4. Core Backend Modules

### 4.1 Authentication Module
- Handles Google OAuth login
- Issues JWT tokens
- Manages sessions
- Prevents fake or duplicate accounts

---

### 4.2 Post Management Module

Responsibilities:
- Create, edit, and close posts
- Enforce category-based behavior
- Manage post visibility

Post Categories:
- Job / Task
- Service Offer
- Sell Item
- Rent Item

All categories use a **single unified post model**.

---

### 4.3 Contact Request & Approval Module (Chat-Free MVP)

Instead of in-app chat, the platform uses controlled contact sharing.

Responsibilities:
- Handle contact requests
- Allow post creator to approve or reject
- Share phone number or WhatsApp link only after approval

Key Principle:
> Contact details are never public and are shared only with explicit permission.

---

### 4.4 Safety & Moderation Module

Responsibilities:
- Detect abusive or harmful content
- Track user violations
- Apply strike-based restrictions
- Process user reports

Moderation uses both automated checks and human reporting.

---

### 4.5 AI Intelligence Module (Gemini API)

Gemini is used for:
- Abuse and toxicity detection
- Scam pattern detection
- Smart category suggestions

AI acts as a **preventive and advisory layer**, not an enforcement authority.

---

## 5. Data Design & Storage

### MongoDB Collections
- Users
- Posts
- Contact Requests / Applications
- Reports
- Violation Logs

### Cloudinary Usage
- Stores all images and media
- Returns secure URLs
- URLs are stored as references in MongoDB

This keeps the database lightweight and scalable.

---

## 6. Core Workflows

### 6.1 User Login Flow

```
User → Google Login → Backend Verification → JWT Issued → Access Granted
```

---

### 6.2 Post Creation Flow

```
User → Create Post → Backend Validation → MongoDB Save → Post Live
```

---

### 6.3 Contact Request Flow (Key Feature)

```
Interested User → Request Contact
                 ↓
          Post Creator Reviews
                 ↓
     Approve / Reject Contact Request
                 ↓
   Phone / WhatsApp Shared Securely
```

---

### 6.4 Safety Moderation Flow

```
User Input → Gemini Moderation → Safe?
             ↓              ↓
          Allow           Block + Warn
```

---

## 7. Security Design Principles

- No public phone numbers
- Approval-based contact sharing
- Rate-limited contact requests
- JWT-based authentication
- Minimal data exposure

---

## 8. Scalability Considerations

- Modular backend allows easy future separation
- Cloudinary CDN reduces backend load
- MongoDB indexed by location and category
- AI calls handled asynchronously

---

## 9. Future Enhancements

- Full in-app chat system
- AI-powered chat moderation
- Payment integration
- Ratings & reviews
- Identity verification (KYC)
- Real-time communication using WebSockets

---

## 10. Summary

This system design focuses on real-world usability, safety, and flexibility. By combining MERN and React Native with MongoDB, Cloudinary, Google Authentication, and Gemini AI, the platform delivers a scalable and secure solution for hyperlocal coordination without being money-centric.

