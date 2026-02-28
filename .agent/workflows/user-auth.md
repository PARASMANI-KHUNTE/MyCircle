---
description: detailed workflow for user onboarding and authentication
---

# User Onboarding & Authentication Workflow

This workflow describes the end-to-end journey of a new or returning user entering the MyCircle application.

## 1. Initial Landing (LandingScreen.tsx)
- **Visual Entrance**: User is greeted with animated background shapes and the MyCircle brand assets.
- **Decision Point**:
  - NEW USER: Selects "Continue with Google".
  - RETURNING USER: Selects "Continue with Google" or "Login" (if they have email/pass).

## 2. Authentication Process
- **Google Sign-In**:
  - App invokes `@react-native-google-signin/google-signin`.
  - User selects account.
  - ID Token is received and sent to the backend `/auth/google` endpoint.
- **Email/Password**:
  - User fills `LoginScreen.tsx` or `RegisterScreen.tsx`.
  - Backend verifies credentials and returns a JWT token.

## 3. Account Initialization (AuthContext.tsx)
- **Token Storage**: JWT is stored securely in `AsyncStorage`.
- **User Data Sync**:
  - Application fetches the full profile from `/user/profile`.
  - Socket.io connection is initialized using the user ID.
- **Redirection**:
  - If profile is complete -> Navigate to `MainApp` (Feed).
  - If profile is incomplete -> Prompt for initial setup (Display Name, Location).

## 4. Entering the Main App
- User is transitioned to the `FeedScreen.tsx` via the `ModernTabBar`.
- Real-time notification services start listening.
