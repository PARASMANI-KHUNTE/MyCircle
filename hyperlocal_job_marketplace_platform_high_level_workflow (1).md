# Hyperlocal Job, Service & Marketplace Platform

## 1. Vision & Core Idea
A single platform where people can **post jobs, offer services, sell items, or rent items** in a **local, flexible, low-friction** way. Payments are **optional**, and exchanges can be **money, barter, service-for-service, or free**.

The platform focuses on **short-term, real-world needs** (e.g., birthday decoration help, renting speakers, selling a chair) and prioritizes **human coordination over rigid transactions**.

---

## 2. User Roles

### 2.1 Guest User
- Can browse posts
- Can view limited post details
- Must sign up to interact

### 2.2 Registered User
A registered user can act as:
- Post Creator (job owner / seller / service provider)
- Applicant / Buyer / Renter
- Both at different times

There are **no fixed roles** like buyer/seller — behavior defines the role.

---

## 3. Core Post System (Single Unified Model)

All activities are handled through **one Post system**, differentiated by category.

### 3.1 Post Categories
- Job / Task
- Service Offer
- Sell Item
- Rent Item

### 3.2 Common Post Fields
- Post ID
- Title
- Description
- Category
- Location (area-level, radius based)
- Time / Duration (optional)
- Exchange Type:
  - Money
  - Barter
  - Service-for-Service
  - Free
  - Open to discussion
- Images (optional)
- Status:
  - Open
  - In Discussion
  - Reserved
  - Completed
  - Cancelled
- Created At / Updated At

This design avoids multiple modules and keeps the system **simple and scalable**.

---

## 4. User Journey & High-Level Workflow

### 4.1 Onboarding Flow
1. User opens platform
2. Browses nearby posts (read-only)
3. Attempts interaction → prompted to sign up
4. Sign up using:
   - Email / Password
   - Google Authentication
5. Basic profile creation:
   - Name
   - Profile photo (optional)
   - Area / City

---

### 4.2 Post Creation Workflow

1. User clicks "Create Post"
2. Selects Post Category
3. Enters post details:
   - Title
   - Description
   - Location
   - Time / Duration (if applicable)
   - Exchange preference
4. Uploads images (if item/service)
5. Submits post
6. Post becomes visible in local feed

System actions:
- Auto-tag post category
- Set default status to "Open"

---

### 4.3 Discovery & Browsing Workflow

1. User lands on feed
2. Feed sorted by:
   - Distance
   - Recency
3. User applies filters:
   - Category
   - Exchange type
   - Time-based
4. User opens post detail page

Post detail page shows:
- Full description
- Creator profile summary
- Exchange details
- Current status

---

### 4.4 Interaction Flow (Jobs & Services)

1. User clicks "Apply / Interested"
2. Application form:
   - Short message
3. Application submitted
4. Post creator receives notification
5. Creator reviews applicants list
6. Creator can:
   - Accept one or more applicants
   - Reject others
7. Instead of in-app chat, the creator can explicitly choose to:
   - Share phone number
   - Share WhatsApp contact link
8. Contact details are revealed only after explicit approval
9. Coordination continues outside the platform
10. Post status changes to "In Discussion"

This permission-based contact sharing ensures faster real-world coordination while maintaining user safety.

---

### 4.5 Interaction Flow (Sell / Rent Items)

1. User clicks "Interested"
2. Contact request is sent to the post creator
3. Post creator reviews the request
4. Creator explicitly chooses to:
   - Share phone number
   - Share WhatsApp contact link
5. Contact details are revealed only after approval
6. Item discussion and coordination happens externally
7. Creator marks post as:
   - Reserved
   - Completed

This avoids open messaging while preserving privacy and control.

---

## 5. Contact Sharing System (Chat-Free MVP)

Instead of a full in-app chat system, the MVP uses a **permission-based contact handoff** model.

### 5.1 Design Principles
- No public phone numbers
- No automatic contact sharing
- Contact details revealed only with explicit approval

### 5.2 Contact Sharing Flow
- Users request contact after applying or showing interest
- Post creators approve or deny contact sharing
- Upon approval, users receive:
  - Phone number (optionally masked initially)
  - Or click-to-WhatsApp link

### 5.3 Safety Controls
- Rate limits on contact requests
- Option to revoke shared contact
- Report user option even after contact sharing

This design mirrors real-world behavior while minimizing abuse and development complexity.

---

## 6. Deal Completion Workflow

1. Job/service/item exchange completed offline
2. Post creator clicks "Mark as Completed"
3. Completion modal:
   - Type of exchange used
   - Optional note
4. Post status set to "Completed"
5. Both users' profiles update:
   - Completed deals count +1

---

## 7. Profile & Trust System

### 7.1 User Profile Contains
- Name
- Area
- Number of posts created
- Number of completed deals
- Response rate

### 7.2 Trust Signals
- No star ratings initially
- Focus on activity & completion
- Reporting option for posts or chats

---

## 8. Notifications Workflow

System-generated notifications for:
- New application received
- Application accepted/rejected
- New chat message
- Post status changes

Notifications delivered via:
- In-app notifications
- Optional email alerts

---

## 9. Moderation, Safety & Abuse Prevention

This section defines how the platform proactively prevents misuse, harassment, spam, and unsafe behavior using **design-level controls**, not just reactive moderation.

---

### 9.1 Chat Abuse Prevention (Toxicity, Harassment, Hate Speech)

#### Problem
Users may send abusive, toxic, or emotionally harmful messages in chat.

#### Prevention Layers

**Layer 1: Real-time Message Filtering**
- Every chat message is checked *before saving*.
- Messages containing abusive, hateful, sexual, or threatening language are blocked.
- User receives a neutral warning: "Message violates community guidelines. Please rephrase."
- Trigger words are not revealed to avoid bypass attempts.

**Layer 2: Contextual Moderation**
- Messages are analyzed for intent (not just keywords).
- Repeated borderline behavior is flagged even if explicit words are avoided.

**Layer 3: Strike System**
- Each user maintains a violation count.
- Rules:
  - 1st violation → warning
  - 2nd violation → temporary chat mute
  - 3rd violation → interaction restriction or suspension

---

### 9.2 User Reporting & Human Oversight

- Every post and chat message includes a "Report" option.
- Report reasons:
  - Abuse / Harassment
  - Scam / Fraud
  - Inappropriate Content
- When a report is submitted:
  - Chat is temporarily frozen
  - Content enters admin review queue
  - Admin action: warn, mute, ban, or restore

This ensures edge cases not caught automatically are handled safely.

---

### 9.3 Spam, Fake Accounts & Multiple Post Control

#### Risks
- Users flooding the platform with repeated or fake posts

#### Controls
- Daily post creation limit per user
- Duplicate title/description detection
- Rate-limiting post creation and deletion
- Repeated violation leads to posting restrictions

---

### 9.4 Duplicate & Misleading Content Prevention

- Similarity checks on post content to prevent repost abuse
- Mandatory category selection
- Warning prompt when reposting similar content
- Flagging unrealistic or misleading offers

---

### 9.5 Scam & Social Engineering Prevention

Common scam signals detected:
- Requests to move conversation off-platform immediately
- Sharing suspicious external links
- Unrealistic offers or pressure tactics

System response:
- Soft safety warning shown to other user
- Internal flagging for monitoring
- Repeated behavior triggers restrictions

---

### 9.6 Restricted Content & Category Enforcement

The platform strictly blocks:
- Weapons
- Drugs
- Adult services
- Illegal documents or activities

Detection leads to:
- Immediate post rejection
- User warning or suspension

---

### 9.7 Privacy & Location Safety

- Exact location is never publicly visible
- Only area-level location is shown
- Personal contact details are not shared automatically
- Address exchange is user-controlled via chat

---

### 9.8 Ghosting, Inactivity & Misuse Handling

- Auto-reminders for inactive users in active deals
- Option to close inactive posts automatically
- Applicant withdrawal notifications

---

### 9.9 Security Philosophy (Design Principle)

The platform focuses on **preventing harm at the interaction level**, not promising zero abuse.

Key approach:
- Add friction where abuse typically starts
- Limit exposure between strangers
- Enforce clear consequences early

This layered strategy ensures safety while keeping the platform usable and lightweight.

---



## 10. Edge Cases & System Behavior

- If post creator cancels → notify all applicants
- If applicant withdraws → creator notified
- If no response after long inactivity → auto-reminder
- Closed posts are archived, not deleted

---

## 11. Scalability & Optimization Considerations

- Single post model reduces complexity
- Category-driven logic simplifies workflows
- Modular expansion possible without breaking core

---

## 12. Data Storage Strategy (MongoDB + Cloud Storage)

### 12.1 MongoDB (Primary Database)

MongoDB is used as the **primary data store** for all structured and frequently accessed data.

Stored in MongoDB:
- User profiles and authentication references
- Posts (jobs, services, sell, rent)
- Applications and interest records
- Chat messages (text only)
- Reports, violations, and moderation flags
- Post status, timestamps, counters

MongoDB is chosen because it:
- Handles semi-structured data efficiently
- Supports fast querying and indexing
- Scales well for feed-based and chat-heavy applications

MongoDB stores **references (URLs/IDs)** to media assets, not the media itself.

---

### 12.2 Google Cloud Storage (Media & File Assets)

Google Cloud Storage is used for **binary and large file data**, not suitable for databases.

Stored in Cloud Storage:
- Item images
- Service images
- Profile pictures
- Optional document attachments

Storage flow:
1. Client uploads file to Cloud Storage
2. Storage returns a secure URL
3. URL is saved in MongoDB as a reference

This approach:
- Keeps the database lightweight
- Improves feed and image loading performance
- Reduces backend load
- Enables secure, scalable file delivery

---

## 13. Future Scope (Not in Hackathon MVP)

- Full in-app chat system with real-time messaging
- AI-based chat moderation and sentiment analysis
- Voice and media messaging
- Payment gateway integration
- Ratings & reviews
- Identity verification (KYC)
- Real-time chat using WebSockets
- Recommendation system

---
