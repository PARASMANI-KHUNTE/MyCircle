## Page 1

MINOR PROJECT REPORT
TITLE PAGE
MyCircle – A Local Student Opportunity & Networking Platform
A Minor Project Report submitted in partial fulfillment of the requirements for the
award of the degree of MASTER OF COMPUTER APPLICATIONS
Submitted by:
[STUDENT_NAME]
Roll No: [ROLL_NO]
Enrollment No: [ENROLLMENT_NO]
MCA 2nd Semester
Department of Computer Science and Information Technology
Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)
Year: 2025
Guided By:
[GUIDE_NAME]
Assistant Professor
Department of Computer Science and Information Technology
Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)

## Page 2

CERTIFICATE OF APPROVAL
This is to certify that the Minor Project Report entitled "MyCircle – A Local Student
Opportunity & Networking Platform" submitted by [STUDENT_NAME], MCA 2nd Semester
student at Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.), is a bonafide record of the
project work carried out by him/her under my supervision and guidance.
The project has been completed in partial fulfillment of the requirements for the award of
the degree of Master of Computer Applications and is fit for submission to the University.
Date: _____________
Place: Bilaspur (C.G.)
(Signature of External Examiner)
(Signature of Guide)
[GUIDE_NAME]
Assistant Professor
ABSTRACT
MyCircle – A Local Student Opportunity & Networking Platform
The landscape of higher education in India has undergone significant transformation in
recent years, with students increasingly seeking opportunities that align with their local
college ecosystems. However, there exists a substantial gap in the current digital
ecosystem - while professional networking platforms like LinkedIn serve the corporate
world, no dedicated platform exists specifically for college students to discover and share
local opportunities, connect with peers, and build meaningful professional networks.
MyCircle is a comprehensive local student opportunity and networking platform developed
using the MERN stack (MongoDB, Express.js, React.js, Node.js) that bridges this critical

## Page 3

gap. The platform enables students to post and discover local opportunities including
internships, part-time jobs, freelance gigs, campus events, hackathons, and study groups.
Students can build verified profiles linked to their institution, follow their peers, message
each other in real-time, and collaborate on projects.
The MyCircle application features a modern, responsive user interface built with React and
Tailwind CSS, providing seamless experience across desktop and mobile devices. Security
is ensured through JWT-based authentication, bcrypt password hashing, and role-based
access control.
Keywords: MERN Stack, Student Networking, Local Opportunities, Web Platform,
MongoDB, React.js, Node.js
CHAPTER 1: INTRODUCTION
1.1 Introduction to the Project
The digital revolution has transformed how we connect, collaborate, and seek opportunities
in unprecedented ways. While global platforms like LinkedIn, Facebook, and Twitter have
revolutionized professional and social networking at a macro level, a significant gap
remains unaddressed at the local level - specifically within college and university
ecosystems where students spend their most formative years.
MyCircle emerges as a purpose-built solution designed specifically for local college and
university student communities. It represents a comprehensive web platform that enables
students to post and discover local opportunities including internships, part-time jobs,
freelance gigs, campus events, hackathons, workshops, and study groups within their
immediate college circle.
1.2 Problem Statement
The problem that MyCircle addresses is multifaceted and deeply rooted in the current
landscape of how college students access opportunities and connect with each other.

## Page 4

Despite the proliferation of digital platforms in our daily lives, students in local colleges and
universities face significant challenges in accessing relevant opportunities within their
immediate geographic and institutional circles.
1.3 Motivation
The motivation behind building MyCircle stems from both personal experiences as a
student and a genuine recognition of the gap in the current digital ecosystem.
CHAPTER 2: LITERATURE REVIEW
2.1 Existing Platforms Analysis
LinkedIn - Professional networking but not student-focused
Internshala - Focuses only on internships, missing broader student opportunities
WhatsApp - Communication but lacks structured opportunity management
College Portals - Often outdated user experience
2.2 Comparative Analysis
Target Local Opportunity
Platform Cost
Audience Focus Posting
Free +
LinkedIn Professionals National Yes
Premium
Free +
Internshala Job Seekers National Yes
Premium
WhatsApp General Local No Free
MyCircle Students Local Yes Free

## Page 5

CHAPTER 3: SYSTEM REQUIREMENTS
3.1 Functional Requirements
User Registration and Login (JWT Auth)
Student Profile Creation and Management
Post Opportunities (internships, gigs, jobs)
Browse and Search Opportunities
Create and Join Study Groups
Post and Discover Campus Events
Follow/Unfollow System
Real-time Notifications
Messaging System
Admin Panel
3.2 Non-Functional Requirements
Performance: Page load under 3 seconds
Security: JWT, bcrypt, HTTPS
Scalability: Horizontal scaling support
Availability: 99% uptime target
3.3 Technology Stack
Software Version Purpose
Node.js 18.x JavaScript runtime
Express.js 4.x Web framework
React.js 18.x Frontend UI

## Page 6

Software Version Purpose
MongoDB 6.x Database
Vite 5.x Build tool
Tailwind CSS 3.x Styling
JWT Latest Authentication
bcrypt Latest Password hashing
CHAPTER 4: SYSTEM DESIGN
4.1 System Architecture
MyCircle employs a three-tier architecture:
Client Tier: React.js SPA built with Vite
API Tier: Node.js Express.js server
Data Tier: MongoDB database
4.2 Database Design (Collections)
Users Collection:
_id, email, password, name, college, course, year, bio, profileImage, role, followers,
following
Opportunities Collection:
_id, title, type, description, postedBy, location, requirements, applicationLink, deadline
Events Collection:
_id, title, description, date, venue, organizer, registrationLink

## Page 7

StudyGroups Collection:
_id, name, subject, description, admin, members
Messages Collection:
_id, sender, receiver, content, timestamp, read
Notifications Collection:
_id, recipient, type, message, isRead, createdAt
CHAPTER 5: TECHNOLOGY STACK
5.1 MongoDB
MongoDB is a leading NoSQL database that stores data in flexible, JSON-like documents.
The document model aligns naturally with JavaScript object structures.
5.2 Express.js
Express.js is a minimalist web framework for Node.js that provides robust features for
building web applications and APIs.
5.3 React.js
React.js is a JavaScript library for building user interfaces through its component-based
architecture.
5.4 Node.js
Node.js provides the JavaScript runtime that executes MyCircle's server-side code.
5.5 Vite

## Page 8

Vite serves as MyCircle's frontend build tool and development server.
5.6 Tailwind CSS
Tailwind CSS provides MyCircle's styling through its utility-first approach.
5.7 JWT
JWT provides MyCircle's authentication through stateless token-based security.
CHAPTER 6: IMPLEMENTATION
6.1 User Registration and Authentication
The authentication system represents the foundation of MyCircle's security model. Users
register with full name, email, password, college, year, and course.
6.2 Student Profile Page
Profile page serves as students' personal showcase with edit functionality and profile
picture upload via Cloudinary.
6.3 Opportunities Feed
Main discovery interface showing all opportunities in a scrollable card layout with filtering
options.
6.4 Post an Opportunity
Create forms with title, type, description, location, requirements, application link, and
deadline.

## Page 9

6.5 Campus Events
Event listings with registration features.
6.6 Study Groups
Create, browse, join, and leave study groups.
6.7 Follow/Unfollow System
Enables personalized feeds and connection building.
6.8 Messaging
Direct communication between users.
6.9 Notifications
Alerts for new followers, opportunity posts, and event reminders.
6.10 Admin Panel
Moderation and statistical features.
CHAPTER 7: TESTING
7.1 Testing Strategy
MyCircle employs multi-level testing: Unit, Integration, System, and User Acceptance
Testing.

## Page 10

7.2 API Test Results
Test Case Endpoint Method Status
Register /auth/register POST Pass
Login /auth/login POST Pass
Create Opportunity /opportunities POST Pass
Follow User /user/follow/:id POST Pass
Create Event /events POST Pass
CHAPTER 8: UI SCREENSHOTS
8.1 Login / Register Page
Centered card on dark gradient background.
8.2 Home / Opportunity Feed
Card layout with color-coded type badges.
8.3 Profile Page
Profile picture, name, college, and bio.
8.4 Post Opportunity Form
Modal form with validation.

## Page 11

CHAPTER 9: LIMITATIONS
9.1 Technical Limitations
No mobile application (web only)
Basic recommendation algorithm
Polling for messaging (not WebSocket)
Basic search with regex
9.2 Platform Limitations
Free deployment tier limits
Storage limits on free tiers
9.3 Security Limitations
No 2FA
JWT in localStorage
Rate limiting not fully implemented
CHAPTER 10: FUTURE SCOPE
10.1 AI-Powered Recommendations
Machine learning for personalized feeds.
10.2 Mobile Application
React Native for native mobile app.

## Page 12

10.3 Multi-College Expansion
Additional verification infrastructure.
10.4 Advanced Search
Elasticsearch integration.
10.5 Gamification
Points, badges, and leaderboards.
10.6 Mentorship Module
Connecting students with mentors.
10.7 Premium Features
Monetization options.
CHAPTER 11: CONCLUSION
11.1 Summary
MyCircle stands as a comprehensive local student opportunity and networking platform
developed using the MERN stack.
11.2 Learning Outcomes
Full-stack development, REST API design, JWT authentication, database modeling, React
state management.

## Page 13

11.3 Impact
Centralized opportunity discovery, verified student profiles, community building, event
discovery.
11.4 Closing Statement
MyCircle represents how digital platforms can support local educational communities.
REFERENCES
1. MongoDB Documentation - https://www.mongodb.com/docs
2. Express.js Documentation - https://expressjs.com
3. React.js Documentation - https://react.dev
4. Node.js Documentation - https://nodejs.org/en/docs
5. Vite Documentation - https://vitejs.dev/guide
6. Tailwind CSS Documentation - https://tailwindcss.com/docs
7. JWT.io Introduction - https://jwt.io/introduction
8. MDN Web Docs - https://developer.mozilla.org
9. Cloudinary Documentation - https://cloudinary.com/documentation
10. Socket.io Documentation - https://socket.io/docs/v4
11. Mongoose Documentation - https://mongoosejs.com/docs
12. Postman Learning - https://learning.postman.com
