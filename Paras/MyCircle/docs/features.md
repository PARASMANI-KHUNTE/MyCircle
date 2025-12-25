# MyCircle Feature Documentation

## Overview
MyCircle is a hyperlocal marketplace platform connecting people for jobs, services, sales, rentals, and barter exchanges within their community.

---

## 1. Authentication & Onboarding

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Google OAuth Login | ✅ | ✅ | Sign in with Google account |
| Landing/Welcome Screen | ✅ | ✅ | Introduction to the app |
| User Registration | ✅ | ✅ | Create new account |
| User Login | ✅ | ✅ | Email/password login |
| Persistent Sessions | ✅ | ✅ | JWT token-based auth |

---

## 2. Feed & Discovery

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Post Feed | ✅ | ✅ | Browse all posts with filtering |
| Category Filters | ✅ | ✅ | Filter by: Job, Service, Sell, Rent, Barter |
| Search | ✅ | ✅ | Text search across titles and descriptions |
| Location Filter | ✅ | ✅ | Filter by city/area |
| Date Filter | ✅ | ✅ | Filter by post date |
| Sort (Latest/Oldest) | ✅ | ✅ | Sort posts by creation date |
| Nearby Posts (GPS) | ✅ | ✅ | Filter posts by proximity |
| Map View | ✅ | ✅ | View posts on interactive map (Leaflet) |
| Pull to Refresh | ✅ | ❌ | Mobile-specific refresh gesture |
| Real-time New Posts | ✅ | ✅ | Socket.io live updates |

---

## 3. Posts

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Create Post | ✅ | ✅ | Multi-step wizard (Category → Details → Exchange → Review) |
| Post Types | ✅ | ✅ | Job, Service, Sell, Rent (with Barter option) |
| Image Upload | ✅ | ✅ | Up to 5 images per post |
| Location Picker | ✅ | ✅ | Search, GPS detect, or pin on map |
| Post Duration | ✅ | ✅ | 15 min, 3 hours, 7 days, 28 days |
| View Post Details | ✅ | ✅ | Full post with images, description, user info |
| Like Post | ✅ | ✅ | Heart/like functionality |
| Share Post | ✅ | ✅ | Copy link to clipboard |
| Comment on Post | ✅ | ✅ | Add comments to posts |
| Reply to Comments | ✅ | ✅ | Nested replies (3 levels deep) |
| Edit Comment | ✅ | ✅ | Modify your comments |
| Delete Comment | ✅ | ✅ | Remove your comments |
| Edit Post | ✅ | ✅ | Modify your own posts |
| Delete Post | ✅ | ✅ | Remove your own posts |
| Toggle Post Status | ✅ | ✅ | Archive/Activate posts |
| Related Posts | ✅ | ✅ | Show similar posts |
| Post Analytics | ✅ | ✅ | Views, likes, shares count |
| Double-tap to Like | ✅ | ❌ | Mobile gesture |

---

## 4. Contact Requests

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Request Contact | ✅ | ✅ | Request to connect with post owner |
| View Received Requests | ✅ | ✅ | See requests from others |
| View Sent Requests | ✅ | ✅ | Track your outgoing requests |
| Approve/Reject Request | ✅ | ✅ | Accept or decline contact requests |
| Withdraw Request | ✅ | ✅ | Cancel pending requests |
| WhatsApp Integration | ✅ | ✅ | Quick link to WhatsApp chat |
| Phone Call Link | ✅ | ✅ | Direct call to approved contacts |
| Chat from Request | ✅ | ✅ | Navigate directly to in-app chat |

---

## 5. Real-time Chat

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Conversation List | ✅ | ✅ | View all chat threads |
| 1-on-1 Messaging | ✅ | ✅ | Real-time chat with Socket.io |
| Typing Indicators | ✅ | ✅ | See when other user is typing |
| Read Receipts | ✅ | ✅ | Message status (sent/read) |
| Unread Count Badge | ✅ | ✅ | Badge showing unread messages |
| Reply to Message | ✅ | ❌ | Long-press to reply (mobile) |
| AI Chat Suggestions | ✅ | ✅ | Gemini-powered quick replies |
| AI Content Moderation | ✅ | ✅ | Flag inappropriate messages |
| Delete Conversation | ✅ | ✅ | Remove chat history |

---

## 6. Notifications

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| In-App Notifications | ✅ | ✅ | Notification center/list |
| Push Notifications | ✅ | ❌ | Native push via Notifee |
| New Request Alert | ✅ | ✅ | Notify when you receive a request |
| Approval Alert | ✅ | ✅ | Notify when request is approved |
| Like/Comment Alert | ✅ | ✅ | Notify on post engagement |
| Message Alert | ✅ | ✅ | Notify on new messages |
| Mark as Read | ✅ | ✅ | Dismiss individual notifications |
| Delete Notification | ✅ | ✅ | Remove notifications |
| Sound on New Message | ✅ | ❌ | Audio notification |

---

## 7. User Profile

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| View Own Profile | ✅ | ✅ | See your profile data |
| View Other Profiles | ✅ | ✅ | View other user profiles |
| Edit Profile | ✅ | ✅ | Update name, bio, skills |
| Upload Avatar | ✅ | ✅ | Profile picture upload |
| User Stats | ✅ | ✅ | Posts count, requests, rating |
| My Posts Grid/List | ✅ | ✅ | View your posts in grid or list |
| Post Expiration Timer | ✅ | ✅ | Visual countdown for post duration |

---

## 8. Settings & Privacy

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Dark Mode Toggle | ✅ | ✅ | Theme switching |
| Push Notification Toggle | ✅ | ❌ | Enable/disable push |
| Block User | ✅ | ✅ | Block unwanted users |
| Unblock User | ✅ | ✅ | Remove from blocked list |
| View Blocked Users | ✅ | ✅ | List of blocked accounts |
| Report User | ✅ | ✅ | Flag abusive users |
| Delete Account | ✅ | ✅ | Permanently remove account |
| Logout | ✅ | ✅ | Sign out of session |

---

## 9. AI Features (Gemini Integration)

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Content Safety Check | ✅ | ✅ | Validate post/comment content |
| Image Safety Check | ✅ | ✅ | Validate uploaded images |
| AI Chat Suggestions | ✅ | ✅ | Smart reply suggestions |
| Post Insights | ✅ | ✅ | AI-generated summary and tips |
| Post Explanation | ✅ | ✅ | AI analysis of post content |

---

## 10. Technical Features

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Real-time Updates | ✅ | ✅ | Socket.io for live data |
| JWT Authentication | ✅ | ✅ | Secure token-based auth |
| Image Compression | ✅ | ✅ | Optimize uploads |
| Offline Graceful Handling | ✅ | ⚠️ | Limited offline support |
| Responsive Design | N/A | ✅ | Web responsive layout |
| Deep Linking | ✅ | ✅ | Direct navigation via URLs |

---

## Legend
- ✅ = Fully implemented
- ⚠️ = Partially implemented
- ❌ = Not available on this platform
- N/A = Not applicable
