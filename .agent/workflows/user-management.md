---
description: detailed workflow for user profile management and settings
---

# User Management & Privacy Workflow

This workflow covers how users maintain their identity and privacy within MyCircle.

## 1. Profile Maintenance (ProfileScreen.tsx)
- **Visual State**: Profile displays user reputation (TrustBadge) and key metrics (Posts, Requests, Rating).
- **Customization**:
  - **Switch View**: Toggle between a professional grid or a detailed list of active posts.

## 2. Editing Identity (EditProfileScreen.tsx)
- **Avatar**: `launchImageLibrary` allows updating the profile picture; uploads via `multipart/form-data`.
- **Identity Fields**:
  - **Display Name**: Primary identifier.
  - **Contact Logic**: Select country code (e.g., +91) and input phone number.
  - **Bio & Skills**: Comma-separated tags for interest-based matching.

## 3. Privacy & Safety Controls
- **Blocking (BlockedUsersScreen.tsx)**:
  - User can block others from Post Details or Chat.
  - The Block list allows viewing and unblocking users at any time.
- **Reporting**: Options to flag inappropriate content or users directly to the safety moderation team.
- **Account Deletion**: Located in "Danger Zone" of settings; requires confirmation via `ThemedAlert` and removes all associated data from the servers.

## 4. Application Preferences (SettingsScreen.tsx)
- **Theme Engine**: `context/ThemeContext.tsx` manages a dynamic toggle between Dark (Neon Slate) and Light modes.
- **Notifications**: Granular toggles for Push, Email, and Activity alerts.
- **Credits**: Software version and corporate attribution.
