---
description: detailed workflow for social connection and messaging
---

# Social Connection & Messaging Workflow

This workflow explains how users connect and communicate in real-time.

## 1. Initiating Connection (PostDetailsScreen.tsx)
- **Action**: User taps "Message" or "Contact" on a post that isn't their own.
- **Contact Request**: Backend creates a `ContactRequest`.
- **Notification**: The post owner receives a push notification and a badge on their "Requests" tab.

## 2. Request Management (RequestsScreen.tsx)
- **Decision Point**:
  - **Approve**: User taps "Check" icon. Backend status updates to `approved`.
  - **Reject**: User taps "X" icon. Status updates to `rejected`.
- **Dynamic Action**: Approval immediately enables the "Chat" button for both parties.

## 3. Real-Time Chat (ChatWindowScreen.tsx)
- **Socket.io Integration**: Conversation is bounded by the `postId` and `participants`.
- **Messaging Flow**:
  - User types message. `user_typing` event is emitted.
  - Message sent via `/chat/message`.
  - Receiver gets `receive_message` event in real-time.
- **UI Enrichments**:
  - **Read Receipts**: Single check (sent), Double check (delivered), Blue double check (read).
  - **AI Suggestions**: `getSmartSuggestions()` analyzes the last message and provides 3 quick-reply chips using LLM logic.

## 4. Conversation Life Cycle
- **Persistence**: Chat history is stored and paginated via `api.get('/chat/messages/:id')`.
- **Expiry Sync**: If the associated post is deleted or expires, the chat conversation may be archived or the `conversation_deleted` event is triggered.
- **Feedback**: `react-native-sound` provides optional audio cues for incoming messages.
