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
| Persistent Sessions | ✅ | ✅ | JWT token-based auth |

---

## 2. Feed & Discovery

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Post Feed | ✅ | ✅ | Browse all posts with filtering |
| Category Filters | ✅ | ✅ | Filter by: Job, Service, Sell, Rent, Barter |
| Search | ✅ | ✅ | Text search across titles and descriptions |
| Location Filter | ✅ | ✅ | Filter by city/area |
| Distance Filter | ✅ | ⚠️ | Filter by radius: 1km, 5km, 10km, 25km |
| Date Filter | ✅ | ✅ | Filter by post date |
| Sort Options | ✅ | ✅ | Sort by: Latest, Oldest, Urgent, Nearest |
| Nearby Posts (GPS) | ✅ | ✅ | Filter posts by proximity |
| Map View | ✅ | ✅ | View posts on interactive map with fuzzy pins |
| Pull to Refresh | ✅ | ❌ | Mobile-specific refresh gesture |
| Real-time New Posts | ✅ | ✅ | Socket.io live updates |

---

## 3. Posts

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Create Post Wizard | ✅ | ✅ | Multi-step: Category → Details → Exchange → Review |
| Post Types | ✅ | ✅ | Job, Service, Sell, Rent (with Barter option) |
| Image Upload | ✅ | ✅ | Up to 5 images per post |
| Location Picker | ✅ | ✅ | Search, GPS detect, or pin on map |
| Post Duration | ✅ | ✅ | 15 min, 3 hours, 7 days, 28 days |
| Character Limits | ✅ | ⚠️ | Title: 100 chars, Description: 1000 chars |
| Urgent Toggle | ✅ | ⚠️ | Mark post as urgent (highlighted in search) |
| Exchange Preference | ✅ | ⚠️ | Money, Barter, or Flexible |
| View Post Details | ✅ | ✅ | Full post with images, description, user info |
| Like Post | ✅ | ✅ | Heart/like functionality |
| Share Post | ✅ | ✅ | Copy link to clipboard |
| Comment on Post | ✅ | ✅ | Add comments to posts |
| Reply to Comments | ✅ | ✅ | Nested replies (3 levels deep) |
| Edit/Delete Comment | ✅ | ✅ | Modify or remove your comments |
| Edit/Delete Post | ✅ | ✅ | Modify or remove your own posts |
| Toggle Post Status | ✅ | ✅ | Archive/Activate posts |
| Related Posts | ✅ | ✅ | Show similar posts |
| Post Analytics | ✅ | ✅ | Views, likes, shares count |
| Double-tap to Like | ✅ | ❌ | Mobile gesture |

---

## 4. Contact Requests

| Feature | Mobile | Web | Description |
|---------|:------:|:---:|-------------|
| Request Contact | ✅ | ✅ | Request to connect with post owner |
| Optional Message | ✅ | ✅ | Add message with request (max 200 chars) |
| View Requests | ✅ | ✅ | Received and Sent tabs |
| Approve/Reject | ✅ | ✅ | Accept or decline contact requests |
| Withdraw Request | ✅ | ✅ | Cancel pending requests |
| Auto-Expire Requests | ✅ | ✅ | Pending requests expire after 7 days |
| Request Cooldown | ✅ | ✅ | 24-hour wait after rejection before re-requesting |
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
| Request Alerts | ✅ | ✅ | New request, approval, rejection |
| Engagement Alerts | ✅ | ✅ | Likes, comments on your posts |
| Message Alerts | ✅ | ✅ | New chat messages |
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
| Block/Unblock User | ✅ | ✅ | Manage blocked users |
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
| Cron Jobs | ✅ | ✅ | Auto-expire posts and requests |
| Responsive Design | N/A | ✅ | Web responsive layout |
| Deep Linking | ✅ | ✅ | Direct navigation via URLs |

---

## Legend
- ✅ = Fully implemented
- ⚠️ = Partially implemented / Mobile only
- ❌ = Not available on this platform
- N/A = Not applicable
