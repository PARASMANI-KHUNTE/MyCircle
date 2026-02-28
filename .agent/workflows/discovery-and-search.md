---
description: detailed workflow for content discovery and search
---

# Discovery & Search Workflow

This workflow details how users explore and find content in their local vicinity.

## 1. Entering Discovery (FeedScreen.tsx)
- **Initial Load**: Fetches nearby posts based on the user's proximity.
- **Visuals**: Displays either `FlashList` of cards or the Map Canvas.

## 2. Using the Floating Orbit UI
A signature glassmorphic container overlaying the feed.
- **Search**: User types keywords into the glass search bar. Logic handles debounced filtering.
- **Categories**: Horizontal chips for Quick Filter (All, Jobs, Services, etc.).
- **Logic**: Tapping a category adds it to active filters; search keywords are matched against titles and descriptions.

## 3. Map View Interaction
- **Toggle**: User switches to the Map via the Orbit UI.
- **Markers**: Posts appear as categorized pins. 
- **Privacy Fuzzing**: Coordinates are slightly offset in the UI to prevent precise tracking of private locations while showing density.
- **Staggered Animations**: Markers enter with a fade-in spring effect.

## 4. Interacting with Content
- **Double-tap to Like**: A large heart animation triggers on the card using Reanimated. 
- **Like persistence**: Optimistic UI updates the heart icon while syncing with `/posts/like` endpoint.
- **Expansion**: Tapping the card opens `PostDetailsScreen.tsx`.

## 5. Post Details Experience
- **Content**: High-res images, AI-generated content summaries, and location-based insights.
- **Deep Linking**: Support for sharing post IDs via standard share sheets.
- **Communication Entry**: The "I'm Interested" or "Message" button initiates the Social Workflow.
