# MyCircle Feature Test Sheet

## 1. Authentication & Onboarding

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| Google OAuth Login | Tap "Sign in with Google" | Redirects to Google, returns to app logged in |
| Persistent Sessions | Close and reopen app | User remains logged in |
| Logout | Settings → Logout | Clears session, shows login screen |

---

## 2. Feed & Discovery

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| Post Feed | Open app | Shows list of active posts |
| Category Filter | Tap category chip (Job/Service/Sell/Rent) | Shows only posts of that type |
| Search | Type in search bar | Filters posts by title/description match |
| Distance Filter | Tap Distance chip multiple times | Cycles: All → 1km → 5km → 10km → 25km |
| Sort Options | Tap Sort chip multiple times | Cycles: Latest → Oldest → 🔥 Urgent → 📍 Nearest |
| Location Filter | Tap Location chip → Select city | Shows posts from that city only |
| Nearby Filter | Tap "Nearby" chip | Shows posts within proximity (requires GPS) |
| Date Filter | Tap Date chip | Filters to today's posts only |
| Map View | Tap List/Map toggle | Shows posts as pins on map |
| Pull to Refresh | Pull down on feed | Refreshes post list |
| Real-time Updates | Another user creates post | New post appears in feed |

---

## 3. Posts

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| Create Post - Step 1 | Select category | Advances to Details step |
| Create Post - Step 2 | Enter title (100 chars max), description (1000 chars max) | Character counter updates, advances to Exchange |
| Create Post - Step 3 | Set price, toggle Urgent, select Exchange preference | Options saved |
| Create Post - Step 4 | Review preview card | Shows styled preview with badges |
| Create Post - Submit | Tap "Post" | Creates post, shows success, resets form |
| Urgent Toggle | Enable urgent toggle | Preview shows 🔥 URGENT badge |
| Exchange Preference | Select Money/Barter/Flexible | Badge updates in preview |
| Image Upload | Tap "Add" in image section | Opens gallery, adds images (up to 5) |
| Location - Search | Type city name | Shows autocomplete suggestions |
| Location - GPS | Tap "Detect GPS" | Fetches current location |
| Location - Pin | Tap "Open Map" → Tap on map | Pins location at tap point |
| View Post | Tap post card | Opens post detail screen |
| Like Post | Tap heart icon | Heart fills red, like count increases |
| Double-tap Like | Double-tap post image | Heart animation, post liked |
| Share Post | Tap share icon | Copies link to clipboard |
| Comment | Type comment → Send | Comment appears in list |
| Reply to Comment | Tap "Reply" → Type → Send | Reply appears nested under comment |
| Edit Own Post | Post detail → Edit | Opens edit screen with existing data |
| Delete Own Post | Profile → Post → Delete | Removes post after confirmation |

---

## 4. Contact Requests

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| Request Contact | Post detail → "Request Contact" | Shows success, button changes to "Request Sent" |
| Optional Message | Enter message (200 chars max) with request | Message sent with request |
| View Received | Requests tab → Received | Shows incoming requests |
| View Sent | Requests tab → Sent | Shows outgoing requests |
| Approve Request | Tap ✓ on received request | Status changes to approved, chat enabled |
| Reject Request | Tap ✗ on received request | Status changes to rejected |
| Withdraw Request | Sent tab → Withdraw | Removes pending request |
| Request Cooldown | Request after rejection | Shows "wait X hours" message (24h cooldown) |
| Auto-Expire | Wait 7 days for pending request | Request marked as expired |
| Chat from Approval | Tap chat icon on approved request | Opens chat with requester |
| WhatsApp Link | Tap WhatsApp icon | Opens WhatsApp with contact |
| Phone Link | Tap phone icon | Opens dialer with number |

---

## 5. Real-time Chat

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| Conversation List | Chat tab | Shows all conversations |
| Send Message | Type → Send | Message appears in chat |
| Typing Indicator | Start typing | Other user sees "typing..." |
| Read Receipts | Other user reads message | Shows read indicator |
| Unread Badge | Receive message while away | Badge shows count on Chat tab |
| Reply to Message | Long-press message → Reply | Shows reply context, sends threaded |
| AI Suggestions | Receive message | Shows smart reply suggestions |
| Delete Conversation | Swipe left → Delete | Removes conversation |

---

## 6. Notifications

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| In-App List | Tap bell icon | Shows notification list |
| Push Notification | Receive event while app backgrounded | System notification appears |
| New Request Alert | Someone requests your post | Notification received |
| Approval Alert | Your request approved | Notification received |
| Like/Comment Alert | Someone engages your post | Notification received |
| Message Alert | New chat message | Notification received |
| Mark as Read | Tap notification | Marked as read, navigates to item |
| Delete Notification | Swipe left → Delete | Removes notification |

---

## 7. User Profile

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| View Own Profile | Tap profile tab | Shows your profile with stats |
| View Other Profile | Tap username on post | Shows their profile |
| Edit Profile | Profile → Edit | Opens edit form |
| Upload Avatar | Edit → Tap avatar | Opens gallery, uploads image |
| User Stats | View profile | Shows posts count, requests |
| My Posts Grid/List | Toggle view mode | Switches between grid and list |
| Post Timer | View own post | Shows expiration countdown |

---

## 8. Settings & Privacy

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| Dark Mode | Settings → Toggle theme | App switches theme |
| Push Toggle | Settings → Toggle push | Enables/disables notifications |
| Block User | Profile → Block | User blocked, hidden from feed |
| Unblock User | Settings → Blocked → Unblock | User removed from block list |
| Report User | Profile → Report | Opens report form |
| Delete Account | Settings → Delete Account | Permanently removes account |

---

## 9. AI Features

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| Content Safety | Post inappropriate text | Warning shown, post blocked |
| Image Safety | Upload inappropriate image | Warning shown, image rejected |
| AI Suggestions | Receive message in chat | Shows smart reply options |
| Post Insights | Post detail → Sparkles icon | Shows AI-generated tips |

---

## 10. Error Handling

| Feature | Action | Expected Result |
|---------|--------|-----------------|
| Network Error | Disconnect internet → Action | Shows error message gracefully |
| Invalid Form | Submit empty required field | Shows validation error |
| Session Expired | Token expires | Redirects to login |
| Duplicate Request | Request same post twice | Shows "already requested" message |
