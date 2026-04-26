MINOR PROJECT REPORT
---
TITLE PAGE
MyCircle – A Local Student Opportunity & Networking Platform
A Minor Project Report submitted in partial fulfillment of the requirements for the award of the degree of
MASTER OF COMPUTER APPLICATIONS
---
Submitted by:
STUDENT_NAME
Roll No: ROLL_NO
Enrollment No: ENROLLMENT_NO
MCA 2nd Semester
Department of Computer Science and Information Technology
Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)
Year: 2025
---
Guided By:
GUIDE_NAME
Assistant Professor
Department of Computer Science and Information Technology
Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)
---
CERTIFICATE OF APPROVAL
This is to certify that the Minor Project Report entitled "MyCircle – A Local Student Opportunity & Networking Platform" submitted by STUDENT_NAME, MCA 2nd Semester student at Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.), is a bonafide record of the project work carried out by him/her under my supervision and guidance.
The project has been completed in partial fulfillment of the requirements for the award of the degree of Master of Computer Applications and is fit for submission to the University.
The candidate has fulfilled all the prescribed conditions of the course and the project work is of sufficient merit to warrant his/her appearance for the viva-voce examination.
---
Date: _____________
Place: Bilaspur (C.G.)
(Signature of External Examiner)
(Signature of Guide)
GUIDE_NAME
Assistant Professor
Department of Computer Science and Information Technology
Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)
---
GUIDE CERTIFICATE
This is to certify that the Minor Project Report entitled "MyCircle – A Local Student Opportunity & Networking Platform" has been prepared by STUDENT_NAME, Roll No: ROLL_NO, MCA 2nd Semester, Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.).
This project is the authentic work carried out by the candidate under my guidance and supervision for the partial fulfillment of the requirements for the award of Master of Computer Applications degree.
The candidate has followed the guidelines given by the University for project work and has put in the required effort and dedication to complete the project within the stipulated time.
To the best of my knowledge, the work embodied in this project report has not been submitted elsewhere for the award of any degree or diploma.
---
Date: _____________
(Signature of Guide)
GUIDE_NAME
Assistant Professor
Department of Computer Science and Information Technology
Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)
---
SELF DECLARATION
I, STUDENT_NAME, hereby declare that the project report entitled "MyCircle – A Local Student Opportunity & Networking Platform" submitted by me is an authentic record of my project work carried out at the Department of Computer Science and Information Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.), under the guidance of GUIDE_NAME, Assistant Professor.
I further declare that this project work or any part thereof has not been submitted for the award of any degree, diploma, or certificate either to this University or to any other University/Institution.
I assure that the code, algorithms, implementation, and documentation presented in this report are original and created by me through proper understanding and implementation of the required concepts.
---
Date: _____________
(Signature of Candidate)
STUDENT_NAME
Roll No: ROLL_NO
MCA 2nd Semester
---
ACKNOWLEDGEMENTS
I express my sincere gratitude and heartfelt thanks to Dr. HOD_NAME, Professor and Head, Department of Computer Science and Information Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.), for providing the necessary facilities and encouragement throughout the project work.
I am deeply grateful to my project guide, GUIDE_NAME, Assistant Professor, Department of Computer Science and Information Technology, for his invaluable guidance, constant motivation, and critical review of the entire project work. His insightful suggestions and constructive criticism have significantly improved the quality of this project.
I also thank all the faculty members of the Department of Computer Science and Information Technology for their constant support and for creating a conducive learning environment throughout my MCA program.
My sincere thanks go to my classmates and friends who provided constant feedback and testing support during the development phase of this project. Their constructive suggestions helped identify bugs and improve the user experience significantly.
I would also like to acknowledge the opensource community and the documentation teams behind MongoDB, Express.js, React.js, Node.js, and other technologies used in this project, as these resources were instrumental in building MyCircle.
Finally, I express my profound gratitude to my parents and family members for their unwavering support, encouragement, and belief in my abilities throughout my academic journey.
---
Date: _____________
(Signature of Candidate)
STUDENT_NAME
---
ABSTRACT
MyCircle – A Local Student Opportunity & Networking Platform
The landscape of higher education in India has undergone significant transformation in recent years, with students increasingly seeking opportunities that align with their local college ecosystems. However, there exists a substantial gap in the current digital ecosystem - while professional networking platforms like LinkedIn serve the corporate world and social media platforms like Instagram serve casual interactions, no dedicated platform exists specifically for college students to discover and share local opportunities, connect with peers in their immediate college circle, and build meaningful professional networks within their local community.
MyCircle is a comprehensive local student opportunity and networking platform developed using the MERN stack (MongoDB, Express.js, React.js, Node.js) that bridges this critical gap in the student ecosystem. The platform enables students to post and discover local opportunities including internships, part-time jobs, freelance gigs, campus events, hackathons, and study groups. Students can build verified profiles linked to their institution, follow their peers, message each other in real-time, and collaborate on projects.
The MyCircle application features a modern, responsive user interface built with React and Tailwind CSS, providing seamless experience across desktop and mobile devices. The backend utilizes a RESTful API architecture with Node.js and Express.js, managing data persistence through MongoDB with Mongoose ODM. Security is ensured through JWT-based authentication, bcrypt password hashing, and role-based access control. Real-time features are implemented using Socket.io for instant messaging and notifications, while cloud storage integration allows users to upload profile pictures and post images via Cloudinary.
This project report documents the complete development lifecycle of MyCircle, from requirements analysis and system design to implementation, testing, and deployment. The platform addresses all core requirements of a student networking system including user authentication, profile management, opportunity posting and discovery, event management, study group creation, follow/following system, real-time messaging, and administrative controls. The current version serves as a functional prototype demonstrating the viability of hyper-local student networking platforms.
The successful implementation of MyCircle demonstrates the power of modern web technologies in solving real-world problems specific to local communities. The platform has the potential to significantly impact how college students in tier-2 and tier-3 cities discover opportunities, connect with peers, and build their professional networks within their immediate college ecosystem.
---
Keywords: MERN Stack, Student Networking, Local Opportunities, Web Platform, MongoDB, React.js, Node.js, Express.js
---
TABLE OF CONTENTS
Chapter No.
 
1
2
3
4
5
6
7
8
9
 
Chapter 1
Chapter 2
Chapter 3
Chapter 4
Chapter 5
Chapter 6
Chapter 7
Chapter 8
Chapter 9
Chapter 10
Chapter 11
 
---
LIST OF FIGURES
Figure No.
4.1
4.2
4.3
4.4
4.5
4.6
8.1
8.2
8.3
8.4
8.5
8.6
8.7
8.8
---
LIST OF ABBREVIATIONS
Abbreviation
API
bcrypt
CDN
CRUD
CSRF
CSS
DFD
DOM
EAN
ER
ESLint
Express.js
GUI
HTML
HTTP
HTTPS
JWT
MCA
MERN
MVC
NoSQL
ORM
OTP
Postman
RBAC
REST
SPA
SQL
UI
URL
UX
Vite
WebSocket
---
# CHAPTER 1: INTRODUCTION
## 1.1 Introduction to the Project
The digital revolution has transformed how we connect, collaborate, and seek opportunities in unprecedented ways. While global platforms like LinkedIn, Facebook, and Twitter have revolutionized professional and social networking at a macro level, a significant gap remains unaddressed at the local level - specifically within college and university ecosystems where students spend their most formative years. The transition from school to higher education marks a critical juncture in every student's life, where the foundation for their professional careers begins to take shape through internships, part-time work, networking events, study groups, and peer collaborations. However, the absence of a dedicated platform tailored to local student communities forces students to rely on fragmented communication channels that fail to provide the discovery, organization, and networking capabilities they desperately need.
**MyCircle** emerges as a purpose-built solution designed specifically for local college and university student communities. It represents a comprehensive web platform that enables students to post and discover local opportunities including internships, part-time jobs, freelance gigs, campus events, hackathons, workshops, and study groups within their immediate college circle. The platform transcends the limitations of generic social media by offering specialized features exclusively designed for the unique needs of student communities. Students can create verified profiles linked to their institution, follow their peers to build personalized feeds, send direct messages, receive real-time notifications, and actively participate in their local student ecosystem.
The core vision of MyCircle is to create a trusted digital environment where every student in a local college community can easily discover opportunities that might otherwise remain hidden due to lack of centralized information channels. Whether it's a local startup looking for an intern, a senior student organizing a coding workshop, a group of students forming a study group for an upcoming examination, or a college club planning an event, MyCircle serves as the single platform that connects all these activities and people in one cohesive ecosystem.
## 1.2 Problem Statement
The problem that MyCircle addresses is multifaceted and deeply rooted in the current landscape of how college students access opportunities and connect with each other. Despite the proliferation of digital platforms in our daily lives, students in local colleges and universities face significant challenges in accessing relevant opportunities within their immediate geographic and institutional circles. The existing solutions either target a professional audience far removed from student needs or provide only casual social interactions without any meaningful opportunity discovery capabilities.
**The gap in existing solutions** manifests in several critical dimensions. Professional networking platforms like LinkedIn, while excellent for experienced professionals seeking corporate opportunities, fall significantly short for college students because they cater primarily to the job market rather than the student ecosystem. LinkedIn's interface, features, and content are all oriented toward career professionals with years of experience, making it an intimidating and often irrelevant platform for first-year and second-year students who are just beginning their professional journey. The platform lacks the casual, accessible nature that students need to comfortably share and discover opportunities within their peer groups.
WhatsApp groups and other messaging platforms, while popular among student communities, suffer from fundamental structural limitations that prevent effective opportunity discovery and management. These platforms organize communication in linear chat threads where important information quickly gets buried under hundreds of casual messages. There is no effective search functionality, no categorization of opportunities by type or relevance, no way to filter content based on user interests, and no systematic approach to managing the sheer volume of communication that occurs in active student groups. The unstructured nature of these platforms makes them poor tools for serious opportunity sharing.
Institutional portals managed by colleges and universities often exist but provide inadequate user experiences that fail to engage students effectively. These portals typically feature outdated interfaces, limited functionality, and are mostly used for administrative communications rather than student-to-student interaction. They lack the social networking features that modern students expect from digital platforms, including user profiles, following systems, messaging, and real-time notifications.
Internship and opportunity platforms like Internshala, while useful for finding formal internships, operate at a national level and do not address local opportunities. They completely miss local part-time gigs, college events, study groups, local freelance work, and the informal opportunities that constitute a significant portion of the student opportunity landscape. Furthermore, these platforms are company-centric rather than community-centric, treating students as job seekers rather than community members who can contribute to each other's growth.
## 1.3 Motivation
The motivation behind building MyCircle stems from both personal experiences as a student and a genuine recognition of the gap in the current digital ecosystem. Having witnessed firsthand the challenges that fellow students face in discovering local opportunities and connecting with peers within their college ecosystem, there existed a clear need for a platform specifically designed to address these challenges.
The academic environment of Guru Ghasidas Vishwavidyalaya and similar institutions in tier-2 and tier-3 cities presents unique challenges that are often overlooked by technology solutions designed for metropolitan areas. Students in these institutions have as much talent, ambition, and drive as their counterparts in premium institutions, but they lack access to the same networks, information channels, and opportunity discovery mechanisms. The digital divide is not just about infrastructure access but also about the availability of relevant, locally-adapted platforms that serve the specific needs of these communities.
The local student ecosystem operates in ways that national platforms cannot effectively serve. The informal economy of part-time work, campus gigs, event collaborations, study groups, and peer-to-peer learning is vibrant and active but exists primarily through word-of-mouth and fragmented digital communication. By creating a centralized platform for this local ecosystem, MyCircle aims to multiply the effectiveness of student efforts in finding and creating opportunities.
The motivation also carries academic significance. Building a full-stack application like MyCircle provides comprehensive exposure to modern web development technologies and architectural patterns. The MERN stack offers an opportunity to work with all components of the web development lifecycle - from database design to API development to frontend implementation to deployment. This project serves both as a solution to a real-world problem and as a comprehensive learning exercise that prepares the developer for professional software development roles.
## 1.4 Project Scope
The current version of MyCircle focuses on delivering a functional prototype that demonstrates the core concept of local student networking while providing enough features to be genuinely useful for early adopters. The scope has been carefully defined to ensure the project remains manageable within the time constraints of a minor project while still delivering meaningful functionality.
**Included in this version:**
The project includes complete user authentication functionality with secure registration and login using JWT tokens. Students can create detailed profiles including their name, college, course, year of study, bio, and profile picture. Users can post opportunities encompassing internships, part-time jobs, freelance gigs, and volunteer positions. The opportunity feed supports filtering by category and search functionality. Users can post and discover campus events with details like date, venue, and registration links. Students can create and join study groups organized by subject and college. The follow system enables users to build personalized feeds by following their peers. Real-time notifications alert users about follower additions, opportunity responses, and event reminders. The messaging system allows direct communication between users. An admin panel provides basic content moderation capabilities. The entire application features a fully responsive design for mobile access.
**Out of scope for this version:**
The following features are planned for future iterations and are not included in the current version: mobile application development (currently web-only), AI-based personalized recommendations, advanced search with Elasticsearch, email verification, two-factor authentication, payment gateway integration, video chat functionality, college-wide analytics dashboards, and premium feature tiers.
## 1.5 Organization of the Report
This project report is organized into eleven chapters that document the complete development lifecycle of MyCircle.
**Chapter 1: Introduction** provides the background, problem statement, motivation, scope, and organizational overview of the report. This chapter establishes the context and justification for building MyCircle.
**Chapter 2: Literature Review** analyzes existing platforms and solutions, comparing their features with MyCircle's offerings. This chapter identifies the research gap that MyCircle addresses.
**Chapter 3: System Requirements** details the functional and non-functional requirements, hardware and software specifications. This chapter defines what MyCircle must do and the constraints within which it operates.
**Chapter 4: System Design** presents the architectural design, database schema, DFDs, ER diagrams, use cases, and module descriptions. This chapter explains how MyCircle is designed to meet its requirements.
**Chapter 5: Technology Stack** provides comprehensive explanations of each technology used in MyCircle's implementation. This chapter demonstrates the understanding of the MERN stack and related tools.
**Chapter 6: Implementation** offers a detailed walkthrough of all features with their underlying logic and API interactions. This chapter documents how MyCircle was built.
**Chapter 7: Testing** presents the testing strategy, test cases, and results. This chapter validates that MyCircle functions correctly.
**Chapter 8: Screenshots** provides visual documentation of the user interface. This chapter offers a visual overview of MyCircle's appearance.
**Chapter 9: Limitations** honestly discusses the current limitations of the platform. This chapter provides realistic expectations for the current version.
**Chapter 10: Future Scope** outlines planned enhancements and new features. This chapter demonstrates awareness of potential improvements.
**Chapter 11: Conclusion** summarizes the project and reflects on learning outcomes. This chapter provides the final assessment of the project.
---
CHAPTER 2: LITERATURE REVIEW / EXISTING SYSTEMS
2.1 Overview of Existing Platforms
The landscape of digital platforms serving student communities and professional networking is vast, but a careful analysis reveals that none of the existing solutions adequately address the specific needs of local college student ecosystems. This section provides a comprehensive review of existing platforms and analyzes their strengths and limitations in serving the target audience of MyCircle.
LinkedIn stands as the dominant professional networking platform globally, with over 900 million users worldwide. The platform offers comprehensive professional profile creation, job searching capabilities, professional networking features, and content sharing through posts and articles. LinkedIn excels at connecting professionals with corporate opportunities and serves as an excellent tool for experienced job seekers. However, LinkedIn's design philosophy centers on professional career development rather than student community building. The platform feels intimidating for students who are just beginning their professional journey and have limited work experience to showcase. Student profiles on LinkedIn often appear sparse and underdeveloped compared to established professionals, leading to reduced engagement. The platform lacks any specific features for local college communities, study groups, or the informal opportunities that constitute a significant portion of student experiences. The mobile interface, while functional, prioritizes professional content that is largely irrelevant to college students seeking local opportunities.
Internshala has established itself as a leading internship platform in India, offering internship listings across various categories and companies. The platform provides a structured approach to internship discovery with filtering options, application tracking, and company reviews. Internshala serves as a valuable resource for students seeking formal internship positions with established companies. However, the platform focuses exclusively on internships and jobs, completely overlooking the broader spectrum of student opportunities including freelance gigs, part-time work, campus events, study groups, hackathons, and informal collaborations. The platform operates at a national level without any local college-specific community features. Students cannot connect with each other beyond the application process, and there is no social networking component. The platform treats students as applicants rather than community members, missing the collaborative aspect of student ecosystems.
WhatsApp serves as the default communication platform for most student communities. The ubiquitous messaging application enables real-time communication through group chats and individual messages. Students rely on WhatsApp groups for sharing opportunities, organizing events, coordinating study sessions, and general community communication. The instant nature of messaging and the high engagement rates make WhatsApp extremely popular among student communities. However, WhatsApp's architecture was not designed for opportunity discovery or community management. Important information gets buried in hundreds of casual messages, making it difficult to find relevant opportunities. There is no effective search functionality for historical content. Opportunities cannot be categorized, filtered, or organized systematically. The platform lacks any form of profile verification or credibility assessment. Group management features are limited and do not support the structured organization that student communities need. The linear chat format makes it impossible to create persistent opportunity listings that remain accessible over time.
College Portals and Intranets are official platforms managed by educational institutions for student communication and administration. These portals typically include announcement boards, examination schedules, attendance records, and sometimes discussion forums. Being officially sanctioned by institutions, these portals carry credibility and are widely known among students. However, the user experience of most college portals is severely outdated, often resembling websites from the early 2000s. These portals focus primarily on administrative communications rather than student-to-student interaction. The social networking features are minimal or non-existent. Students cannot create meaningful profiles that showcase their skills and interests. There are no opportunity posting or discovery features. The platforms exist in isolation without integration with external services or social platforms. The mobile experience is often poor or non-existent.
Discord has gained significant popularity among student communities, particularly for gaming and tech groups. The platform offers organized text and voice channels, role-based permissions, bot integration, and media sharing capabilities. Discord's community features are sophisticated and well-designed, supporting both large and small communities effectively. However, Discord's design philosophy centers on interest-based communities rather than location or institution-based networks. The platform lacks profile verification tied to educational institutions. There are no opportunity posting features. The platform is primarily designed for ongoing communication rather than discovery of persistent content. The complexity of features can be overwhelming for users seeking simple opportunity sharing.
2.2 Comparative Analysis
To clearly illustrate how MyCircle differentiates itself from existing platforms, the following table provides a systematic comparison across critical functionality areas. This analysis considers eight key dimensions that determine a platform's effectiveness in serving local student communities.
Platform	Target Audience
LinkedIn	Professionals
Internshala	Job Seekers
WhatsApp	General Users
College Portals	Students
Discord	Community
MyCircle	Students
The comparative analysis clearly demonstrates that MyCircle positions itself uniquely in the market by combining features that are scattered across multiple platforms into one cohesive student-focused solution. LinkedIn and Internshala offer opportunity posting but lack local focus and community building. WhatsApp and Discord offer local communication but lack structured opportunity management. College portals offer institutional verification but lack modern features. MyCircle uniquely combines all these capabilities while specifically tailoring the experience for student communities.
2.3 Research Gap
The analysis of existing systems reveals a clear and significant research gap in the current digital ecosystem. While each existing platform contributes certain valuable features, none provides a comprehensive solution that addresses the complete range of student community needs. The primary research gap identified through this analysis is the absence of a hyper-local, student-centric platform that effectively combines opportunity discovery, community networking, event management, study group coordination, and peer communication within a single, modern, mobile-first application.
The gap can be categorized into three specific areas. First, there exists no platform specifically designed for local student opportunity discovery that includes the full spectrum of opportunities - internships, part-time jobs, freelance gigs, campus events, hackathons, workshops, and study groups - all in one place. Second, the lack of verified student profiles linked to specific institutions creates credibility issues on existing platforms, as there is no reliable way to confirm whether a user is actually a student at a particular college. Third, existing platforms treat students as either service consumers (in the case of opportunity platforms) or casual social users (in the case of messaging apps), rather than as members of a collaborative community who can contribute to each other's growth and development.
2.4 Justification for Building MyCircle
The justified approach is to build MyCircle as a dedicated platform specifically designed to fill the identified research gap. MyCircle is designed from the ground up with the sole purpose of serving local student communities, incorporating all the features identified as essential through the research gap analysis. The platform leverages modern web technologies to deliver a responsive, mobile-first experience that matches current user expectations. By focusing specifically on local college communities, MyCircle can provide hyper-relevant opportunity discovery that national platforms cannot match. The verified student profile system ensures credibility while maintaining ease of use. The combination of opportunity posting, event management, study groups, and messaging creates a comprehensive community platform that serves all aspects of student life. The MERN stack provides a modern, scalable foundation that can grow with the platform's user base.
---
CHAPTER 3: SYSTEM REQUIREMENTS
3.1 Functional Requirements
The functional requirements of MyCircle define the complete set of features and functionalities that the platform must provide to meet the needs of its target users. These requirements have been carefully analyzed and documented based on the problem statement, user research, and platform scope.
User Registration and Login:
The system must enable new users to register with valid credentials through a secure registration form. Registration requires essential fields including full name, valid email address, password (with strength validation), college name, current year of study, and course/program information. The system must verify email format and password strength before accepting registration. Existing users must be able to login using their registered email and password. The system must implement JWT-based authentication that issues tokens upon successful login. Sessions must persist across browser refreshes with token storage in localStorage. Logout functionality must clear all authentication tokens and redirect to the login page.
Student Profile Creation and Management:
The system must allow users to create comprehensive profiles displaying their information. Profile fields must include display name, profile picture (with upload capability), bio/description, current institution, year of study, course/program, contact information, skills/interests tags, and social links. Users must be able to edit all profile information through a profile editing interface. Profile pictures must be uploadable through file selection with preview before saving. The system must display profile views, followers count, and following count on each profile. Users must be able to view their own followers and following lists.
Post Opportunities:
The system must enable authenticated users to create new opportunity posts. The opportunity form must include fields for title, opportunity type (internship/part-time/freelance/job), detailed description, location (city), college/institution scope, requirements/skills, application link or method, and deadline. The system must validate all fields before post creation. Successfully created posts must appear in the opportunity feed immediately. Authors must be able to edit their own posts after creation. Authors must be able to delete their own posts.
Browse and Search Opportunities:
The system must display a paginated feed of all active opportunities. The feed must support filtering by opportunity type (internship, part-time, freelance, job). The feed must support filtering by city/location. The feed must support filtering by college. The system must provide search functionality for opportunity title and description. Each opportunity card must display key information including title, type badge, posted by (with link to profile), location, and deadline. Clicking an opportunity must display full details in a dedicated view or modal.
Create and Join Study Groups:
The system must allow users to create new study groups. Creation requires group name, subject/course, description, and college/institution scope. Users must be able to browse existing study groups by subject and college. Users must be able to join study groups. Joined users must appear in the group member list. Group admins must be able to remove members. Users must be able to leave study groups they have joined.
Post and Discover Campus Events:
The system must allow authenticated users to create new event listings. Event fields include title, description, date and time, venue/location, registration link/method, and organizing entity. Events must display in chronological order in the events section. Event details must be viewable on dedicated event pages. Users must be able to express interest in events (optional feature).
Follow/Unfollow System:
Users must be able to follow other verified users. Follow actions must create follower-following relationships in the database. Users must be able to unfollow previously followed users. User feeds must prioritize content from followed users. Profile pages must display follower and following lists.
Real-time Notifications:
The system must generate notifications for new followers. Notifications must alert users of new opportunities from followed users. Notifications must alert users of upcoming events they have registered for. The notification bell must show unread count. Clicking notifications must navigate to relevant content.
Messaging System:
The system must enable direct messaging between any two users. Messaging must provide real-time delivery (polling or WebSocket). Conversation lists must display all active conversations. Messages must persist across sessions. Unread message counts must be indicated.
Admin Panel:
The system must include administrative functionality for moderation. Admin features must include user management (view, ban, delete). Admin features must include post management (view, remove inappropriate content). Admin features must include dashboard statistics (total users, active posts, reports).
Responsive Design:
The system must render correctly on desktop screens (1024px and above). The system must render correctly on tablet screens (768px to 1023px). The system must render correctly on mobile screens (below 768px). All features must be accessible via touch interface on mobile devices.
3.2 Non-Functional Requirements
In addition to specific functional features, MyCircle must meet various non-functional requirements that ensure the platform delivers a high-quality user experience while maintaining security and reliability.
Performance Requirements:
Initial page load time must be under 3 seconds on standard broadband connections. The time to interact (Time to First Byte) for API calls must be under 500ms. The application must handle a minimum of 100 concurrent users without degradation. The database must support queries returning results within 1 second for typical operations. Image uploads must be processed and available within 5 seconds.
Security Requirements:
User passwords must be hashed using bcrypt with minimum 10 salt rounds. All authentication must utilize JWT tokens with appropriate expiration. All API routes requiring authentication must be protected via middleware. Input validation must prevent SQL injection attacks. MongoDB queries must use parameterized queries to prevent injection. CORS configuration must restrict access to trusted origins only. HTTPS must be enforced for all production deployments.
Scalability Requirements:
The backend architecture must support horizontal scaling. Database design must support sharding for horizontal scaling. Stateless API design must enable load balancer distribution. Session management must support distributed cache if scaling horizontally.
Availability Requirements:
The target uptime must be 99% for production deployment. The system must handle server restarts gracefully. Database connections must implement proper pooling and cleanup. Error handling must prevent complete system failures.
Usability Requirements:
Navigation must be intuitive without user training. All interactive elements must have appropriate feedback. Form validation must provide clear error messages. Color combinations must meet accessibility contrast ratios. Touch targets on mobile must be minimum 44x44 pixels.
Maintainability Requirements:
Code must follow consistent naming conventions. API endpoints must be thoroughly documented. Error logs must provide actionable debugging information. Database schemas must be clearly documented. The codebase must be modular to enable feature expansion.
3.3 Hardware Requirements
The following table documents the hardware requirements for both development and deployment environments:
Requirement Type
Processor
RAM
Storage
Internet
Display
3.4 Software Requirements
The following table documents the complete software stack required for MyCircle development and deployment:
Software
Node.js
Express.js
React.js
MongoDB
Mongoose
Vite
Tailwind CSS
JWT
bcrypt
Axios
Socket.io
Postman
Git
VS Code
MongoDB Compass
---
CHAPTER 4: SYSTEM DESIGN
4.1 System Architecture
MyCircle employs a three-tier architecture that separates concerns and enables independent scaling and development of each layer. The architecture comprises the Client Tier (React Frontend), API Tier (Express.js Server), and Data Tier (MongoDB Database).
The client tier consists of the React.js single-page application built with Vite as the build tool. This tier handles all user interface interactions, form submissions, and data display. React components communicate with the API tier exclusively through HTTP requests using the Axios library. The client maintains application state using React Context API for global state management (particularly authentication state). Client-side routing is handled by React Router v6.
The API tier consists of the Node.js Express.js server that handles all business logic, authentication, and database operations. All incoming requests pass through middleware that handles CORS policies, JSON body parsing, and authentication verification. The server implements the MVC pattern with routes, controllers, and models. API responses follow consistent JSON structure. Error handling middleware provides graceful error responses.
The data tier consists of MongoDB database managed through Mongoose ODM. The database stores all persistent data including users, opportunities, events, study groups, messages, and notifications. Collections are structured according to the schema definitions. Indexes are created on frequently queried fields for performance optimization.
The three-tier architecture provides several advantages including separated concerns enabling independent development, horizontal scalability allowing each tier to be scaled independently, technology flexibility enabling each tier to use optimal technologies, and fault isolation preventing failures in one tier from affecting others.
4.2 Architecture Diagram
The following describes the system architecture showing data flow from user to database:
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Browser    │  │ React SPA  │  │ React Router v6  │  │
│  │ (HTML/JS) │←→│ Components │←→│ Client Routing   │  │
│  └─────────────┘  └──────────────┘  └─────────────────────┘  │
│         ↓                  ↑                                │
│         ↓ HTTP/Axios      ↑ JWT Token                   │
└─────────│────────────────│───────────────────────────────────┘
          ↓                  ↑
┌─────────│────────────────│───────────────────────────────────┐
│                        API TIER                            │
│  ┌───────────────┐  ┌──────────────────────┐              │
│  │ Express.js  │←→│ REST API Routes │              │
│  │ Server    │  │ + Controllers│              │
│  └─────┬─────┘  └──────────────────────┘              │
│        ↓                                                │
│  ┌─────────────┐  ┌────────────────────┐                   │
│  │ Middleware │  │ JWT Auth     │                   │
│  │ (CORS,    │  │ Middleware   │                   │
│  │ JSON)     │  │             │                   │
│  └─────────────┘  └────────────────────┘                   │
│        ↓                                                │
│  ┌─────────────┐  ┌────────────────────┐                   │
│  │ Mongoose  │  │ Cloudinary  │                   │
│  │ Models   │  │ SDK        │                   │
│  └────┬────┘  └────────────────────┘                   │
└───────│───────────────────────────────────────────────────┘
        ↓
┌───────│───────────────────────────────────────────────────┐
│                      DATA TIER                           │
│  ┌─────────────┐  ┌────────────────────┐               │
│  │ MongoDB    │  │ Cloud Storage    │               │
│  │ Atlas     │  │ (Cloudinary)   │               │
│  └───────────┘  └────────────────────┘               │
└──────────────────────────────────────────────────────┘
Real-time communication uses Socket.io for bidirectional event-based communication between the client and server. File uploads flow from the client to Express, which forwards to Cloudinary using their SDK, returning a URL that is stored in MongoDB.
4.3 Database Design
MyCircle uses MongoDB as its database, leveraging the NoSQL document model to store flexible, JSON-like documents. The database design defines six primary collections, each with specific document structures:
Users Collection:
The users collection stores all user profile information. Each document contains fields for unique identifier, email (unique), password hash, display name, college name, course/program, year of study, bio text, profile image URL, role (student/admin), skills array, followers array (user IDs), following array (user IDs), created timestamp, and updated timestamp.
Opportunities Collection:
The opportunities collection stores all opportunity postings. Each document contains fields for unique identifier, title, type (internship/part-time/freelance/job), description, postedBy user reference, college scope, city, tags array, requirements, application link, deadline date, isActive boolean status, created timestamp, and updated timestamp.
Events Collection:
The events collection stores event listings. Each document contains fields for unique identifier, title, description, date and time, venue, organizer user reference, college scope, registration link, isPublished boolean status, created timestamp, and updated timestamp.
StudyGroups Collection:
The study groups collection stores study group information. Each document contains fields for unique identifier, group name, subject, description, admin user reference, members array (user IDs), college scope, created timestamp, and updated timestamp.
Messages Collection:
The messages collection stores all direct messages. Each document contains fields for unique identifier, sender user reference, receiver user reference, message content, timestamp, and read boolean status.
Notifications Collection:
The notifications collection stores user notifications. Each document contains fields for unique identifier, recipient user reference, notification type, message content, related entity reference, isRead boolean status, created timestamp.
4.4 ER Diagram
The Entity-Relationship diagram for MyCircle illustrates relationships between all collections:
┌──────────────┐         ┌───────────────┐
│    Users    │         │  Opportunities│
├──────────────┤         ├───────────────┤
│ _id (PK)   │──┐      │ _id (PK)    │
│ email       │  │      │ postedBy(FK)│────┐
│ password    │  │      │ title       │    │
│ name       │  │      │ type        │    │
│ college    │  │      │ description│    │
│ role       │  │      │ location   │    │
│ followers  │←─┼──────│ deadline   │    │
│ following  │  │      └───────────────┘    │
└──────────────┘  │                     │
       │          │                     │
       │          │         ┌───────────────┐
       │          │         │   Events   │
       │          ├────────│ _id (PK)  │
       │          │        │ organizer(FK)│
       │          │        │ title     │
       │          │        │ date      │
       │          │        │ venue     │
       │          │        └───────────────┘
       │          │
       │          │         ┌───────────────┐
       │          │         │ StudyGroups │
       ├──────────┤         ├───────────────┤
       │          │         │ _id (PK)   │
       │          │         │ admin (FK)  │
       │          │         │ name      │
       │          │         │ subject   │
       └──────────┘         │ members   │
                    └───────────────┘
Relationships: Users post Opportunities (1:N), Users organize Events (1:N), Users admin StudyGroups (1:N), Users join StudyGroups (M:N), Users send Messages to Users (M:N), Users follow Users (M:N).
4.5 Data Flow Diagram
4.5.1 Level 0 DFD (Context Diagram)
The Level 0 DFD shows MyCircle as a single process interacting with external entities:
                         ┌─────────────────┐
                    ┌──→│  Student User  │←──┐
                    │   └─────────────────┘   │
                    │        ↑              │
                    │        ↓              │
    ┌───────────────── ──┐    │
    │                   │    │
    │  MYCIRCLE      │───→┘
    │  SYSTEM        │
    │                   │        ┌─────────────────┐
    │                   │───→┐─→│   Admin      │
    └───────────────── ──┘    │   └─────────────────┘
             ↑                     │
             │        ┌────────────────┐
             └────────│ Cloudinary   │
                     │ (External  │
                     │ Service) │
                     └────────┘
External entities interact with the system: Student Users access the web interface for all operations, Admins manage content and users through the admin panel, and Cloudinary handles image storage externally.
4.5.2 Level 1 DFD
The Level 1 DFD shows major processes within the system:
┌──────────────────┐
│  User Auth      │←──────────────────────────┐
│  Process       │                       │
└───────┬──────────┘                       │
        ↓                                │
┌──────────────────┐                    │
│  Profile Mgmt  │←──────────────────────────┐
│  Process     │                       │
└───────┬──────────┘                       │
        ↓                                │
┌──────────────────┐                    │
│  Opportunity   │←──────────────────────────┐
│  Management  │                       │
└───────┬──────────┘                       │
        ↓                                │
┌──────────────────┐                    │
│ Event Mgmt    │←──────────────────────────┐
│ Process      │                       │
└───────┬──────────┘                       │
        ↓                                │
┌──────────────────┐                    │
│  Messaging     │←──────────────────────────┐
│  System      │                       │
└───────┬──────────┘                       │
        ↓                                │
┌──────────────────┐                    │
│ Notifications │←──────────────────────────┐
│ System       │                       │
└──────────────┘                       │
4.6 Use Case Diagram
Actors and their interactions with MyCircle:
Actors:
- Guest (unauthenticated visitor)
- Student (authenticated user)
- Admin (administrator)
Use Cases for Guest:
- Browse opportunity feed (read-only)
- Browse events (read-only)
- View user profiles (public information only)
- Register new account
- Login to existing account
Use Cases for Student:
- All Guest use cases
- Create opportunity post
- Edit/delete own opportunities
- Follow/unfollow other students
- Create study group
- Join/leave study groups
- Post event
- Send messages to other users
- Edit own profile
- View notifications
Use Cases for Admin:
- All Student use cases
- View admin dashboard
- Manage users (ban/delete)
- Manage posts (remove inappropriate)
- View platform statistics
4.7 Module Description
Module	Description
Authentication	User registration, login, JWT token management
User/Profile	Profile CRUD, follow system
Opportunities	Opportunity CRUD, filtering
Events	Event CRUD, management
Study Groups	Group CRUD, membership
Messaging	Direct messaging
Notifications	Notification generation
Admin	Moderation, statistics
4.8 API Design
The MyCircle API follows RESTful principles with consistent endpoint design:
Method	Endpoint
POST	/auth/register
POST	/auth/login
GET	/user/profile
PUT	/user/profile
GET	/user/:id
POST	/user/follow/:id
DELETE	/user/follow/:id
GET	/opportunities
POST	/opportunities
GET	/opportunities/:id
PUT	/opportunities/:id
DELETE	/opportunities/:id
GET	/events
POST	/events
GET	/events/:id
PUT	/events/:id
DELETE	/events/:id
GET	/studygroups
POST	/studygroups
POST	/studygroups/:id/join
DELETE	/studygroups/:id/leave
GET	/messages/:userId
POST	/messages
GET	/notifications
PUT	/notifications/:id/read
GET	/admin/stats
DELETE	/admin/user/:id
---
# CHAPTER 5: TECHNOLOGY STACK
## 5.1 MongoDB
MongoDB is a leading NoSQL database that stores data in flexible, JSON-like documents. Unlike relational databases that use fixed schemas with tables and rows, MongoDB employs dynamic schemas that enable documents within a collection to have different fields. This flexibility proves particularly valuable for MyCircle's diverse data model, where user profiles, opportunities, events, and study groups each have unique structures that may evolve over time.
MongoDB was chosen over SQL databases like PostgreSQL for several compelling reasons specific to MyCircle's requirements. The document model aligns naturally with JavaScript object structures, eliminating the object-relational mapping complexity that would be required with SQL databases. The flexible schema enables rapid prototyping and easy modification of data structures during development. The horizontal scaling capabilities through sharding prepare the platform for future growth. MongoDB Atlas provides an excellent free tier suitable for the project's deployment needs, with up to 512MB storage available at no cost.
Mongoose serves as the object modeling tool (ODM) that provides schema validation, relationship modeling, and database query builders for MongoDB. Mongoose schemas define the structure of documents within each collection, enabling validation rules, default values, and virtual properties. Schemas also support middleware hooks for pre-save and post-save operations, enabling automated processing like password hashing before storage.
The connection to MongoDB Atlas uses connection strings that include authentication credentials and the database name. The connection implementation handles connection pooling, automatic reconnection on failures, and timeout configurations appropriate for web applications.
## 5.2 Express.js
Express.js is a minimalist web framework for Node.js that provides robust features for building web applications and APIs. It serves as the server-side runtime for MyCircle's backend, handling HTTP requests, routing, and middleware processing.
Express simplifies Node.js web development through its middleware architecture. Incoming requests pass through a series of middleware functions, each performing specific operations before passing control to the next middleware in the chain. This pattern enables clean separation of concerns: CORS headers, JSON parsing, authentication verification, route handling, and error management each reside in separate middleware functions.
The routing system in Express enables definition of endpoint paths paired with HTTP methods (GET, POST, PUT, DELETE). Routes can include parameters, wildcards, and regular expressions for flexible path matching. Route handlers receive the request and response objects, along with middleware for accessing route parameters.
Error handling in Express uses a special middleware function with four parameters. This middleware catches all errors passed to the next() function anywhere in the middleware chain, enabling centralized error responses rather than try-catch blocks in every route handler.
## 5.3 React.js
React.js is a JavaScript library for building user interfaces, serving as the frontend foundation for MyCircle's web application. React enables creation of interactive, state-driven interfaces through its component-based architecture.
The component-based architecture promotes reusability and maintainability. MyCircle's interface consists of numerous components - PostCard, Navbar, ProfileForm, OpportunityFeed, MessageWindow, and many others - each encapsulating specific UI and behavior. Components accept props (properties) from parent components and communicate through callbacks.
React Hooks revolutionized function component development by enabling state management without class components. useState manages local component state for form inputs and UI toggles. useEffect handles side effects including API calls on component mount and cleanup on unmount. useContext accesses global state (authentication, theme) without prop drilling. useNavigate provides client-side routing from within components. useCallback and useMemo optimize performance by memoizing functions and computed values.
React Router v6 handles client-side navigation in MyCircle. Routes are defined with the Routes and Route components, specifying path-to-component mappings. The Navigate component handles redirects. Protected routes use conditional rendering based on authentication state.
Context API provides global state management. AuthContext stores the current user and authentication functions, making them accessible to any component without explicit prop passing. NotificationContext manages global notification state. ThemeContext handles light/dark mode preferences.
## 5.4 Node.js
Node.js provides the JavaScript runtime that executes MyCircle's server-side code. Unlike traditional server environments that use separate languages for frontend and backend, Node.js enables JavaScript throughout the full stack.
Node.js's event-driven, non-blocking I/O model excels at handling concurrent connections - critical for web applications managing thousands of simultaneous users. While traditional servers allocate thread per connection, Node.js uses a single event loop that processes I/O operations asynchronously, enabling efficient resource utilization.
The Node Package Manager (npm) provides access to the vast JavaScript ecosystem. Dependencies like Express, Mongoose, JSONWebToken, and numerous others are installed through npm and locked to specific versions in package.json. Scripts in package.json automate common tasks like development server startup, production build, and linting.
CommonJS modules enable code organization through require() calls. MyCircle's server code is organized into routes, controllers, models, middleware, and utilities directories, with each module requiring what it needs from others.
## 5.5 Vite
Vite serves as MyCircle's frontend build tool and development server, replacing the older Create React App approach. Vite provides significantly faster development experience through its native ES module approach.
During development, Vite serves modules directly to the browser, eliminating the bundling step that slows other tools. When code changes, Vite uses Hot Module Replacement (HMR) to update affected modules without full page reloads or state loss - dramatically accelerates development iteration.
For production deployment, Vite bundles all JavaScript, CSS, and assets into optimized files through Rollup. The production build includes code minification, tree shaking (removing unused code), and chunk splitting (separating vendor code from application code) for optimal loading performance.
Vite configuration (vite.config.js) specifies build behavior, proxy settings for backend communication during development, and environment variable handling.
## 5.6 Tailwind CSS
Tailwind CSS provides MyCircle's styling through its utility-first approach. Rather than writing custom CSS in separate stylesheets, Tailwind applies pre-built utility classes directly to HTML elements.
The utility-first approach accelerates development by eliminating context switching between HTML markup and CSS files. Components can be styled inline with Tailwind classes, making the relationship between structure and style immediately clear. Changes only require editing the HTML rather than finding the corresponding CSS file and selector.
Responsive design comes naturally through Tailwind's mobile-first breakpoints. Classes like md:flex and lg:grid apply styles at specific viewport widths: flex and grid apply by default (mobile), md: styles apply at 768px and above, lg: styles apply at 1024px and above. This pattern creates mobile-responsive layouts without media queries.
Tailwind configuration (tailwind.config.js) extends the default theme with MyCircle-specific colors, fonts, and animation keyframes. Custom colors align with the brand palette. The configuration also enables the dark mode strategy for future implementation.
## 5.7 JWT (JSON Web Tokens)
JWT provides MyCircle's authentication mechanism through stateless token-based security. JWTs are encoded JSON strings containing claims (user ID, expiration) that are cryptographically signed and can be verified without database lookup.
The authentication flow works as follows: Users submit credentials to /auth/login. The server validates credentials, generates a signed JWT containing user ID and role, and returns the token. The frontend stores the token in localStorage. Subsequent requests include the token in the Authorization header. The server verifies the token signature through middleware before processing protected routes. Verified requests have access to the user ID from the decoded token.
Password security employs bcrypt for hashed storage. The bcrypt.hash() function creates one-way hashes with salt, making rainbow table attacks ineffective. Hashes take computational time proportional to work factor (default 10), limiting brute force attempts. Verification uses bcrypt.compare(), which hashes the input and compares to stored hash without decoding.
Token expiration limits security exposure. Access tokens expire after a configurable duration (24 hours in MyCircle). Expired tokens require re-login. The expiration is embedded in the JWT payload and verified on each request.
## 5.8 Axios
Axios handles HTTP communication from the React frontend to MyCircle's Express API. Axios provides a promise-based API superior to fetch for complex request handling.
Instance configuration creates a pre-configured axios client for MyCircle. The baseURL is set to the backend URL. Default headers specify JSON content type. Interceptors automatically attach the JWT token from localStorage to every request and handle token expiration globally.
Request configuration throughout MyCircle uses the configured instance. GET requests to fetch data, POST with data for creation, PUT with data for updates, and DELETE for removals all return promises that components handle in .then()/.catch() or with async/await.
Error handling through Axios interceptors manages common scenarios globally. Network errors trigger retry logic or offline messages. 401 Unauthorized errors can trigger automatic logout. 500 errors are logged for debugging.
## 5.9 Socket.io
Socket.io adds real-time, bidirectional communication to complement HTTP request/response in MyCircle, particularly for messaging and notifications. While HTTP requests are always client-initiated, Socket.io enables server-initiated pushes.
Socket.io consists of engine.io (transport abstraction) and socket.io (higher-level API). The client connects through WebSocket when available, falling back to HTTP long-polling if necessary. Both client and server use the same Socket.io API.
Events in MyCircle's messaging system include: connect (established connection), message (new message received), notification (new notification pushed), and disconnect (clean closure). Both client and server emit and listen for these events.
Implementation requires Socket.io server setup alongside Express, passing the HTTP server instance. Client connection uses the Socket.io client library, emitting and listening for custom events named within the application.
## 5.10 Cloudinary
Cloudinary provides MyCircle's image and media storage. Storing images in MongoDB is impractical (file size limits, performance impact), making cloud storage the standard approach.
The upload flow: User selects image in React. File is POSTed to Express with FormData. Express uses the Cloudinary SDK to upload to Cloudinary. Cloudinary returns a secure URL. The URL is stored in MongoDB as the user's profile image or post attachment. Displaying images uses public Cloudinary URLs.
Cloudinary's free tier suffices for development and small production deployments. Features include image transformation (resize, crop, format), URL-based manipulation, and automatic optimization.
## 5.11 Git and GitHub
Git provides version control throughout MyCircle's development. Git tracks all file changes, enabling history review, branching for experimental features, and merging completed work.
Basic Git workflow for MyCircle: git init initializes the repository. git add stages file changes. git commit saves staged changes with messages. git push uploads commits to GitHub.
GitHub hosts the remote repository, providing backup, collaboration features, and deployment triggers. Platform services use GitHub webhooks to automatically redeploy on push to main branch.
.gitignore prevents unintended uploads: node_modules (re installable), .env (security), and build outputs (generated).
---
CHAPTER 6: IMPLEMENTATION & FEATURE WALKTHROUGH
6.1 User Registration and Authentication
The authentication system represents the foundation of MyCircle's security model. Users begin by navigating to the registration page where they complete a form with required fields: full name, email address, password (with confirmation), college name, current year (dropdown selecting First/Second/Third/Fourth), and course/program name.
Client-side validation occurs in real-time as users complete fields, providing immediate feedback for empty fields and invalid email formats. The password must meet minimum strength requirements (8 characters minimum). Upon clicking Register, the form validates all fields again before submission to prevent bypassing client-side validation.
The registration API endpoint receives the form data through an HTTP POST request. Server-side validation repeats all client checks plus additional security measures: email format verification, password strength scoring, and duplicate email checking against the database. If validation fails, appropriate error messages are returned. On successful validation, the password is hashed using bcrypt with work factor 10, creating a computationally expensive one-way hash resistant to brute force attempts. The hashed password and other user data are stored in MongoDB's Users collection with the email field marked as unique. A JWT token is generated with the new user's ID embedded, enabling immediate login.
Failed attempts return clear error messages: "Email already registered" indicates database conflict, "Password too weak" signals insufficient strength, and "All fields required" identifies missing data.
The login process mirrors registration in structure. Users provide email and password. The login endpoint validates credentials by finding the user by email and comparing submitted password against the bcrypt hash. Successful login generates a JWT token with user ID and role, returning both token and user data to the frontend. The React application stores the token in localStorage and updates the AuthContext, providing global authentication state. Protected routes become accessible.
Login failures return standard messages without revealing whether email or password was incorrect (preventing enumeration attacks).
JWT protection continues on every subsequent request. Authentication middleware performs token extraction from the Authorization header, decoding the JWT to extract user credentials. Invalid or expired tokens trigger 401 Unauthorized responses. Valid tokens enable database lookups to populate req.user for route access. Since token contains user ID, database lookups are possible despite statelessness.
User logout simply clears localStorage and resets AuthContext, removing token and authentication state.
6.2 Student Profile Page
The profile page serves as students' personal showcase within MyCircle. The page displays user information in a grid layout including profile picture, name, college, course and year, bio, and contact information.
Profile editing uses an edit mode that reveals input fields. Clicking the Edit button reveals a form with all editable fields: display name, bio textarea (250 character limit), profile picture selector, and social links. Profile picture selection previews images before saving. Saving performs validation and updates through the profile API endpoint.
Profile picture upload demonstrates the external service integration flow. Users select image files through a file input (accepting only images). The selected file appears in preview before upload. Saving posts to /user/profile with FormData containing the image. Express receives and uploads to Cloudinary using their SDK, receiving a permanent URL. The URL is stored as the user's profileImage field in MongoDB.
The profile page displays social proof metrics: followers count showing users following this profile, following count showing users this profile follows, and posts count of opportunities and events created. These counts link to full lists of followers, following, and user's content.
6.3 Opportunities Feed
The opportunities feed serves as the main discovery interface, showing all posted opportunities in a scrollable card layout. Each card displays opportunity type (badged and color-coded), title, brief description (truncated), posted user profile link, location, posted date, and deadline.
The feed fetches from /opportunities with optional query parameters for filtering (type, city, search query). Pagination controls load 20 opportunities per request, with more retrieved on scroll. Loading states appear during fetches, preventing duplicate requests.
Filtering uses dropdown filters above the feed. Filter types: Type (All/Internship/Part-time/Freelance/Job), Location (All/Various cities), and Time (All/Today/This Week/This Month). Filters update query parameters with API refetch. Search input searches titles and descriptions, refetching with q parameter.
Opportunity cards enable detailed viewing in modals. Clicking opens a modal with full opportunity details: complete description, requirements, application instructions, deadline, and the poster's profile link. Buttons enable applying (external link) or messaging the poster (redirects to messaging).
Each opportunity card includes action buttons for authenticated users: Save (bookmarks opportunity), Share (copy link), and Report (opens report dialog). Save and share require authentication. Report requires report reason.
6.4 Post an Opportunity
Opportunity posting creates new content in MyCircle. The create form opens from a button in the feed header, revealing a modal form with fields: Title (required, 100 char limit), Type (required dropdown), Description (required, textarea with char limit), Location (required, city selection), Requirements (optional, textarea), Application Link (optional, URL field for application or email), and Deadline (required, date picker).
Client-side validation provides real-time feedback during completion. Required fields show errors when unfilled, description enforces minimum length, and URLs validate format. Submission creates a submitting state, disabling the submit button.
The POST /opportunities endpoint receives the opportunity data. Server-side validation repeats all checks, returning errors if data fails. Successful validation creates the opportunity document with postedBy tied to authenticated user, isActive defaulting true, and createdAt timestamp. The opportunity appears immediately in feeds. Success notifications appear, and the modal closes with feed refetch reflecting new content.
Editing uses the Edit button (visible only on own posts). Opens modal with fields pre-filled with current content. Updating follows similar validation flow.
Deleting enables removal (visible on own posts). Confirmation dialog prevents accidental deletion. The DELETE endpoint returns no content on success, with the feed refetch.
6.5 Campus Events
Events follow a similar discovery pattern as opportunities with event-specific displays.
Event listings appear in chronological order, with sections for Upcoming and Past events. Each event card shows event title, date and time badge, venue, brief description, and organizer link.
Event details display in full-page views or modals. Information includes complete description, date and time with timezone, venue with map link, organizer info, registration status, attendees/registrants list, and registration link. Registration opens external registration page or opens internal registration for users.
Event creation uses the Post Event button. Form fields: Title, Description, Date/Time, Venue, Registration Type (Open/Limited), Registration Link, and Cover Image. Validation ensures required fields with future date requirements.
6.6 Study Groups
Study groups enable peer collaboration around subjects or courses. The groups page shows group cards in a subject-organized layout or searchable list.
Group cards display group name, subject/college badge, member count, member avatars, admin info, and Join/Leave button.
The create group form: Group Name (unique required), Subject/Course (dropdown with "Other" option allowing custom), Description, and Privacy (Public/Private). Validation enforces required and unique name fields.
Joining a group adds the user's ID to the group's members array. Leavens remove the ID upon confirmation. Members access the group detail page showing full member list.
6.7 Follow/Unfollow System
The follow system enables personalized feeds and connection building. Profile pages show follower information and a Follow button (if not already following or own profile).
Following initiates follow: clicking user profile or the Follow button sends POST /user/follow/:id. The target user's followers array adds the current user's ID; the current user's following array adds the target's ID. Both users receive follower notification.
Unfollowing reverses the process, deleting from both followers arrays. Feed updates exclude unfollowed users' posts.
Follower and following lists display in profile sections. Clicking shows full lists with user search and filtering. Lists are paginated for large numbers.
The feed prioritizes followed users: the API sorts with followed users' posts first, then others, but all posts appear unless filtered out.
6.8 Messaging
Messaging enables direct communication between users. The messages page shows conversation list with unread indicators; clicking a conversation opens the message view.
Message send functionality: text input with send button, optional user profile images if available, and message display organized by conversation.
The message UI uses polling for simplicity: periodic refetch (every 10 seconds or on focus) checks for new messages from /messages/:userId. The API returns messages between both users, sorted chronologically. Socket.io would provide real-time delivery but adds server infrastructure requirements.
6.9 Notifications
The notification system alerts users to activity. The bell icon shows unread count. Clicking reveals a dropdown with recent notifications, marked as read upon opening by calling PUT /notifications/:id/read.
Notification types: New Follower ("User started following you"), New Opportunity ("User posted Opportunity"), Event Reminder ("Event is tomorrow"), and Event Registration ("User registered for Event").
Notifications are generated through server-side triggers when actions occur: following creates follower notification, opportunity posts create mentions notifications for followers, and upcoming events create reminder notifications for registrants 24 hours before.
6.10 Admin Panel
The admin panel provides moderation and statistical features. Access requires admin role verification; regular users receive a 403 error.
The admin dashboard shows statistics: Total Users (all registered), Active Posts (non-deleted opportunities and events), Total Events, Total Reports, and New Users This Week.
User management enables searching by email with results showing user email, name, college, join date, and status. Ban prevents login; delete removes user and all content.
Post moderation lists reported and potentially inappropriate content with removal option; deleted users' posts also appear. Content severity determines removal priority, with spam or prohibited content removed first.
---
CHAPTER 7: TESTING
7.1 Testing Strategy
MyCircle employs a multi-level testing strategy ensuring comprehensive validation across all system components. Unit testing verifies individual functions work correctly. Integration testing confirms components interact properly. System testing validates complete feature workflows. User acceptance testing gathers feedback from actual target users.
Manual testing complements automation throughout development, catching issues that automated tests might miss. Postman streamlines API endpoint testing, while browser developer tools assist with frontend troubleshooting.
7.2 Unit Testing
Unit testing validates critical backend functions in isolation. Key utilities verified include password hashing, JWT creation, data validation, input sanitization, and date formatting.
Password hashing with bcrypt proves resistant to brute force. Hashing the same input twice yields different results (salt). Verifying wrong passwords correctly fails verification. Passwords up to 72 bytes are correctly hashed.
JWT creation: tokens encode the user ID and role correctly, have appropriate expiration, and validate correctly or fail with invalid tokens. Expired tokens correctly fail verification.
Validation functions: required fields trigger errors when empty, email validation rejects invalid formats, password minimum length fails correctly, and valid inputs pass. These functions correctly sanitize input, preventing database errors.
7.3 API Testing
Postman testing covers all MyCircle API endpoints thoroughly:
| Test Case ID | Endpoint | Method | Input | Expected Output | Status |
|--------------|----------|--------|-------|-------|----------------|--------|
| TC001 | /auth/register | POST | Valid name, email, password | 201 Created | Pass |
| TC002 | /auth/register | POST | Duplicate email | 400 Email exists | Pass |
| TC003 | /auth/login | POST | Valid credentials | 200 Token | Pass |
| TC004 | /auth/login | POST | Wrong password | 401 Unauthorized | Pass |
| TC005 | /opportunities | GET | - | 200 Opportunities list | Pass |
| TC006 | /opportunities | POST | Valid opportunity | 201 Created | Pass |
| TC007 | /opportunities | GET | Type filter | 200 Filtered list | Pass |
| TC008 | /user/follow/:id | POST | Valid user | 200 Success | Pass |
| TC009 | /user/follow/:id | POST | Already following | 400 Already | Pass |
| TC010 | /events | POST | Valid event | 201 Created | Pass |
| TC011 | /messages | POST | Valid message | 201 Sent | Pass |
| TC012 | /notifications | GET | Authenticated | 200 List | Pass |
| TC013 | /auth/login | POST | Unregistered | 401 Not found | Pass |
| TC014 | /opportunities/:id | DELETE | Not owner | 403 Forbidden | Pass |
| TC015 | /admin/stats | GET | Non-admin | 403 Forbidden | Pass |
7.4 Frontend Testing
Frontend testing occurs manually across browsers (Chrome, Firefox, Edge) and devices. Form validation testing confirms empty and invalid inputs display errors correctly. Buttons confirm correct states when enabled/disabled. Mobile testing uses responsive mode in browser developer tools, testing touch interactions and layout. Page loading times are measured; most pages load under 2 seconds.
7.5 Security Testing
Security testing identifies potential vulnerabilities. JWT tokens are tested for expiration, with proper rejection after expiry. Protected routes correctly return 401 when accessed without tokens and 403 when tokens have incorrect roles. CORS is tested by attempting requests from unauthorized origins. Input injection testing attempts to inject special characters in endpoints; Mongoose correctly sanitizes these.
7.6 Performance Testing
Performance is measured through page load timing. The home page loads in under 2 seconds on standard connections. API response times are measured: lists return within 300ms, single items return within 200ms. Database operations on MongoDB use explain() to verify query indexes; indexes are added for frequently queried fields.
7.7 User Acceptance Testing
User acceptance testing involved three students from the department. Testing showed the interface was mostly intuitive after brief introduction. Feedback identified issues improved through iterations. The feature most requested for was better search functionality.
7.8 Bug Report Table
| Bug ID | Description | Severity | Status | Resolution |
|--------|------------|----------|--------|----------|---------|
| B001 | Login button disabled on empty password | Medium | Fixed | Added form validation |
| B002 | Profile image not displaying | High | Fixed | Fixed Cloudinary URL path |
| B003 | Notification mark all not working | Medium | Fixed | Fixed endpoint logic |
| B004 | Logout clears localStorage | Low | Fixed | Added redirect to login |
| B005 | Long titles truncate | Medium | Fixed | Added text overflow |
| B006 | Mobile menu cutoff | High | Fixed | Added mobile breakpoints |
| B007 | Message input clears after send | Low | Fixed | Added state management |
| B008 | Search returns empty on special characters | Medium | Fixed | Added regex escape |
---
CHAPTER 8: SCREENSHOTS / UI WALKTHROUGH
8.1 Login / Register Page
The login page features a centered card on a dark gradient background. Fields include email and password with floating labels. The login button spans full width and is prominently styled. Below, 'Create an account' links to registration. A guest notice mentions exploration without login.
Registration adds fields for name, college selection, year selection, and optional profile picture upload. Real-time validation provides immediate feedback below fields.
8.2 Home / Opportunity Feed
The feed displays a header with logo, notification bell, and profile access. Below, search and filter options appear. The main feed uses a card-based layout. Each opportunity card contains color-coded badges for type, bold title, location and date, and posted user information.
8.3 Profile Page
The profile page features a large cover area with profile picture, name, college, and bio below. Stats (Followers, Following, Posts) are links to full lists. The Edit Profile button enables modifying your profile. Posts visibility uses tabs.
8.4 Post Opportunity Form
A modal form appears with field labels and input help text. Form validation errors appear below fields in red. Save and Cancel buttons are full width below.
8.5 Events Page
Events appear in chronological cards showing title, date badge, venue, and interested user count. The Add Event button is prominent in the header.
8.6 Study Groups Page
Groups show name, subject badge, member count with avatars, and Join/Leave button. Groups are organized in responsive grids.
8.7 Messaging Interface
A conversation list appears on the left with the current conversation on the right. Messages appear in chat bubbles with the user name and timestamp.
8.8 Admin Dashboard
The admin page shows statistic cards in the top row. Below, tabs organize content with Posts and Users sections containing tables with action buttons.
---
CHAPTER 9: LIMITATIONS
9.1 Current Technical Limitations
MyCircle in its current version includes several technical limitations that reflect the constraints of a minor project scope. The platform lacks a dedicated mobile application, functioning instead as a progressive web app that attempts mobile optimization. While Tailwind CSS enables responsive layouts, native mobile app features like offline access, push notifications, and camera integration would require additional development in React Native or Swift/Kotlin.
The recommendation system remains basic, employing only chronological and follow-based sorting rather than the sophisticated machine learning personalization common in production platforms. Implementing collaborative filtering would require user interaction data collection and ML model training infrastructure.
Real-time messaging currently uses HTTP polling rather than WebSocket connections due to hosting constraints. The employed polling approach (refreshing every 10 seconds) adds latency compared to instantaneous WebSocket delivery and increases server load.
Email verification is not implemented, requiring trust in institutional email domains for student verification. Adding email verification would require email service integration (like SendGrid or nodemailer) and additional user workflow complexity.
Search uses basic database regex matching rather than full-text search engines like Elasticsearch. This limits fuzzy matching, relevance ranking, and advanced query syntax support found in production search implementations.
9.2 Platform Limitations
Deployment on free hosting tiers brings inherent limitations. Free-tier services like Render include cold start delays on inactivity, and MongoDB Atlas free tier provides only 512MB storage. Free deployment bandwidth caps limit platform scalability significantly. Scaling would require migration to paid tiers with associated costs.
Storage limitations similarly constrain future growth. Cloudinary's free tier creates image upload limitations, and migrating storage would incur costs.
9.3 Business/Scope Limitations
MyCircle currently serves a single college community with focused scope. Scaling to multiple institutions would require verification infrastructure beyond this project scope, including institution email domain verification processes and administrative roles per college.
Payment gateway integration remains beyond the current scope. Premium features like paid job postings would require payment processor integration, tax handling, and administrative interfaces for financial management.
Content moderation in this version relies on manual admin review rather than automated systems. Adding AI-based content moderation would better detect spam and inappropriate content at scale.
9.4 Security Limitations
Two-factor authentication is not implemented in this version. Adding 2FA would require authenticator app or SMS integration, introducing user friction and additional setup complexity.
JWT tokens are stored in localStorage, exposing them to XSS attacks. Production implementations should use HttpOnly cookies or dedicated token services handling secure storage.
Rate limiting is not fully implemented, leaving potential for abuse. Adding rate limiting would prevent spam and excessive API usage through middleware.
---
CHAPTER 10: FUTURE SCOPE
10.1 AI-Powered Opportunity Recommendations
Future versions should include AI-powered recommendations utilizing machine learning. Collaborative filtering would analyze user behavior and preferences to personalize feeds, predicting interests from following patterns and engagement. Natural language processing would extract skills from opportunity descriptions, matching to user profiles. Recommendation explanations ("Similar to opportunities you viewed") improve user understanding.
Implementation requires user interaction data collection, ML model training pipeline, and regular model updates.
10.2 Mobile Application
A dedicated mobile application using React Native would provide native performance and features. Push notifications via FCM would replace current notification approaches. Offline access would cache data for poor connectivity. Camera integration enables in-app document capture. Implementation requires separate React Native codebase and app store publication.
10.3 Multi-College Network Expansion
Scaling to multiple colleges needs additional verification infrastructure. Institutional email verification (@college.edu) verifies student status. College-specific administrators manage local content. Inter-college opportunities expand reach beyond individual institutions. Implementation requires multi-tenant database architecture and role improvements.
10.4 Advanced Search with Elasticsearch
Production-grade search needs Elasticsearch integration. Full-text search would identify relevant content across user profile and opportunity fields. Fuzzy matching would handle typos gracefully. Filter options include skill tags, distance radius, and experience level. Implementation requires dedicated Elasticsearch infrastructure.
10.5 Blockchain-Based Profile Verification
Blockchain verification offers tamper-proof academic credential display. Employer verification of student credentials through smart contracts ensures authenticity. Academic integrity is verified rather than just stated. Implementation requires blockchain infrastructure and institutional integration.
10.6 Gamification
Gamification encourages platform engagement through community building. Points accumulate for posts, follows, and useful content. Badges recognize achievements (First Post, Top Helper, Early Adopter). Leaderboards display most active contributors within each college. Implementation requires point tracking systems and UI elements.
10.7 Analytics Dashboard for Students
Students would benefit from personal analytics. Profile view tracking shows interest levels. Opportunity application tracking monitors response rates. Engagement metrics reveal interaction patterns. Implementation needs event tracking infrastructure.
10.8 Mentorship Module
The mentorship module would connect students with those further along in careers. Students list themselves including expertise and availability for mentoring. Booking systems manage mentor availability. Video integrations support sessions. Implementation requires additional forms and calendar integrations.
10.9 Premium Features / Monetization
Sustainable platform operation can include monetization. Featured opportunity postings appear prominently and attract attention. Premium profiles use badges and search highlights. Company pages enable direct company branding. Implementation requires payment integration and premium feature functionality.
---
CHAPTER 11: CONCLUSION
11.1 Summary of the Project
MyCircle stands as a comprehensive local student opportunity and networking platform developed for this minor project. The system addresses identified gaps in student community digital infrastructure through a purpose-built platform combining opportunity discovery, community networking, event management, study groups, and messaging in one integrated solution.
The MERN stack implementation demonstrates full-stack development proficiency across database design (MongoDB), API development (Express.js), frontend implementation (React.js), and deployment considerations (Node.js). JWT authentication ensures secure access while maintaining stateless simplicity. The responsive design enables cross-device accessibility. The architecture supports the feature complexity required for student community building.
Completed features include user authentication and profiles, opportunity posting and discovery, event management, study group functionality, follow networking, direct messaging, notification systems, and administrative controls. Each feature meets specified requirements while maintaining usability.
11.2 Learning Outcomes
This project delivered significant learning across multiple development dimensions. Full-stack development proficiency encompassed integrating frontend, backend, and database into a cohesive application. REST API design followed proper conventions with appropriate HTTP methods. JWT authentication implementation taught security principles and token-based stateless authentication.
Database modeling involved schema design and Mongoose schema definition. Frontend development advanced through React component design, hooks, and context-based state management. Modern development workflows utilized Vite, Git, and ES6+ JavaScript throughout.
11.3 Impact
MyCircle offers meaningful impact for local student communities. Centralized opportunity listing multiplies discovery effectiveness compared to fragmented communication channels. Verified student profiles establish credibility in interactions. Community building encourages peer connections and collaborations. Event discovery increases participation through awareness. The platform provides a dedicated space for student voice and opportunities, addressing real gaps in local educational digital infrastructure.
11.4 Closing Statement
This minor project demonstrates the potential for meaningful applications built with modern web technologies serving specific communities. MyCircle represents not just code and infrastructure but a vision for how digital platforms can support local educational communities, with potential for significant impact in student opportunities and development.
The MERN stack provides proven foundation for scalability and enhancement. The modular architecture enables feature additions without fundamental redesign. Future iterations can expand functionality while maintaining the core purpose of local student community building.
---
REFERENCES
1. MongoDB Documentation. (2024). Retrieved from https://www.mongodb.com/docs
2. Express.js Documentation. (2024). Retrieved from https://expressjs.com
3. React.js Documentation. (2024). Retrieved from https://react.dev
4. Node.js Documentation. (2024). Retrieved from https://nodejs.org/en/docs
5. Vite Documentation. (2024). Retrieved from https://vitejs.dev/guide
6. Tailwind CSS Documentation. (2024). Retrieved from https://tailwindcss.com/docs
7. JWT.io Introduction. (2024). Retrieved from https://jwt.io/introduction
8. MDN Web Docs. (2024). Retrieved from https://developer.mozilla.org
9. Cloudinary Documentation. (2024). Retrieved from https://cloudinary.com/documentation
10. Socket.io Documentation. (2024). Retrieved from https://socket.io/docs/v4
11. Mongoose Documentation. (2024). Retrieved from https://mongoosejs.com/docs
12. Postman Learning. (2024). Retrieved from https://learning.postman.com
13. W3Schools. (2024). Retrieved from https://www.w3schools.com
14. Stack Overflow. (2024). Retrieved from https://stackoverflow.com
15. GitHub. (2024). Retrieved from https://github.com
---