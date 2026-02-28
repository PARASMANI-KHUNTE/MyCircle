---
description: detailed workflow for post creation and management
---

# Post Creation & Management Workflow

This workflow covers the multi-step process for creating and managing community posts.

## 1. Initiating Creation (ModernTabBar.tsx)
- **Interaction**: User taps the prominent central `+` (Plus) button on the floating bottom tab bar.
- **Navigation**: Transitions to `CreatePostScreen.tsx`.

## 2. The 5-Step Stepper Wizard
The wizard uses the `Stepper.tsx` component to track progress.

### Step 1: Category Selection
- **Inputs**: Job, Service, or Sell/Rent.
- **Logic**: Visual cards with glassmorphism intensity shifts on selection.
- **Transition**: `goNext()` validates that a category is selected.

### Step 2: Details & Media
- **Inputs**: Title (100 char), Description (1000 char), Category Sub-type (e.g., Hiring/Seeking).
- **Media**: `launchImageLibrary` allows up to 5 photos.
- **Navigation**: KeyboardAvoidingView ensures inputs remain visible during typing.

### Step 3: Geographic Context
- **Methods**:
  - **Detect GPS**: Uses `getCurrentLocation()` and reverse geocoding via OpenStreetMap.
  - **Search**: Auto-complete search using Nominatim API.
  - **Manual Pin**: User opens a full-screen Leaflet Map Modal and drags the pin.
- **Privacy Note**: Exact coordinates are saved but fuzzed in the discovery view.

### Step 4: Exchange & Boosting
- **Inputs**: Price/Budget, "Open to Barter" checkbox.
- **Boosts**: "Urgent" flag for highlighting the post.
- **Duration**: Select from 15 mins to 28 days (duration tracking for auto-expiration).

### Step 5: Review & Publish
- **Preview**: Renders a mock `PostCard` showing exactly how the post will look to others.
- **Publish**: `formData` is compiled and sent to `/posts` via a `multipart/form-data` request.

## 3. Post Management (ProfileScreen.tsx)
- **Visibility**: Posts appear in the user's Profile under "My Posts" (List/Grid view).
- **Life Cycle**: A real-time progress bar shows the time remaining until expiration.
- **Actions**:
  - **Edit**: Re-opens the 5-step wizard with pre-filled data.
  - **Delete**: Prompts `ThemedAlert` before permanent removal.
