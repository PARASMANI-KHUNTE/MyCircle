GURU GHASIDAS VISHWAVIDYALAYA, BILASPUR (C.G.)

(A Central University)

Department of Computer Science and Information Technology

MINOR PROJECT REPORT

Submitted in partial fulfillment of the requirements

for the award of the degree of

MASTER OF COMPUTER APPLICATIONS

On

MyCircle – A Local Student Opportunity & Networking Platform

Submitted By:

[STUDENT_NAME]

Roll No: [ROLL_NO]

Enrollment No: [ENROLLMENT_NO]

MCA 2nd Semester

Guided By:

[GUIDE_NAME]

Assistant Professor / Associate Professor

Department of Computer Science and IT

Academic Year: 2024–2025

CERTIFICATE OF APPROVAL

This is to certify that the Minor Project Report entitled "MyCircle – A Local Student Opportunity & Networking Platform" submitted by [STUDENT_NAME], Roll No. [ROLL_NO], Enrollment No. [ENROLLMENT_NO], a student of Master of Computer Applications (MCA), 2nd Semester, Department of Computer Science and Information Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.), is a bonafide record of the work carried out by the student under the supervision of [GUIDE_NAME].

The project has been completed in accordance with the academic guidelines prescribed by Guru Ghasidas Vishwavidyalaya and fulfills the requirements for the award of the degree of Master of Computer Applications. The work embodied in this report has not been submitted elsewhere, either in full or in part, for the award of any degree or diploma.

We, the undersigned, hereby approve this Minor Project Report and recommend it for acceptance.

Internal Examiner:					External Examiner:

_______________________				_______________________

Name & Designation					Name & Designation

Head of Department

Department of Computer Science and IT

Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)

Date: _______________

GUIDE CERTIFICATE

This is to certify that the Minor Project work entitled "MyCircle – A Local Student Opportunity & Networking Platform" has been carried out by [STUDENT_NAME] (Roll No: [ROLL_NO], Enrollment No: [ENROLLMENT_NO]), student of MCA 2nd Semester, Department of Computer Science and Information Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.), under my direct supervision and guidance.

The project has been completed as per the norms and guidelines laid down by the University. The student has worked diligently and sincerely on the project, and the results presented are genuine, original, and have not been copied or reproduced from any other source. To the best of my knowledge, this work has not been submitted, either wholly or in part, to any other university or institution for the award of any degree or diploma.

I recommend this Minor Project Report for evaluation and approval by the Department and the University.

Guide / Supervisor:

_______________________

[GUIDE_NAME]

Assistant Professor / Associate Professor

Department of Computer Science and IT

Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)

Date: _______________

SELF DECLARATION

I, [STUDENT_NAME], Roll No. [ROLL_NO], Enrollment No. [ENROLLMENT_NO], a student of Master of Computer Applications (MCA), 2nd Semester, Department of Computer Science and Information Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.), hereby declare that the Minor Project Report entitled "MyCircle – A Local Student Opportunity & Networking Platform" submitted in partial fulfillment of the requirements for the award of the degree of Master of Computer Applications is an authentic record of my own work carried out during the academic year 2024–2025.

I further declare that the information presented in this report is true and correct to the best of my knowledge, and no part of it has been submitted previously, either in full or in part, to any other university, institution, or organization for the award of any degree, diploma, or certificate. All sources of information used in this project have been duly acknowledged and referenced.

I understand that any misrepresentation or plagiarism will be treated as a serious academic offence and may result in the cancellation of my degree.

Place: Bilaspur

Date: _______________

_______________________

[STUDENT_NAME]

Roll No: [ROLL_NO]

Enrollment No: [ENROLLMENT_NO]

MCA 2nd Semester, GGU, Bilaspur

ACKNOWLEDGEMENT

The successful completion of this Minor Project Report would not have been possible without the guidance, encouragement, and support of several individuals, to whom I owe my deepest gratitude. I take this opportunity to express my sincere appreciation to all those who have contributed, directly or indirectly, to the realization of this project.

First and foremost, I express my heartfelt gratitude to my project guide, [GUIDE_NAME], Assistant Professor / Associate Professor, Department of Computer Science and Information Technology, Guru Ghasidas Vishwavidyalaya, for their invaluable guidance, continuous encouragement, and scholarly insights throughout the course of this project. Their constructive feedback and patient mentoring helped me navigate the challenges encountered during both the development and documentation phases of MyCircle.

I am also deeply grateful to the Head of the Department of Computer Science and Information Technology, and all the faculty members of the department, for providing an intellectually stimulating environment and equipping me with the academic foundation necessary to undertake a project of this scope. The lectures, seminars, and hands-on laboratory sessions conducted throughout the MCA curriculum were instrumental in building the technical competency required for full-stack web development.

I extend my sincere thanks to my classmates and friends who participated in the User Acceptance Testing (UAT) phase of MyCircle, providing honest feedback that significantly improved the usability and design of the platform. Their enthusiasm and collaborative spirit were a constant source of motivation. Finally, I owe an immeasurable debt of gratitude to my family, whose unwavering support, patience, and encouragement gave me the strength to persevere through the demanding hours of coding, debugging, and writing that this project demanded.

[STUDENT_NAME]

ABSTRACT

MyCircle is a full-stack web application developed using the MERN technology stack—MongoDB, Express.js, React.js, and Node.js—specifically designed to address the chronic lack of a centralized, local opportunity-discovery and peer-networking platform for students enrolled in colleges and universities across smaller Indian cities and towns. Despite the proliferation of mainstream social and professional networks, students at institutions like those affiliated with Guru Ghasidas Vishwavidyalaya, Bilaspur, continue to miss out on internships, freelance gigs, part-time jobs, campus hackathons, study groups, and collaborative academic opportunities, simply because no platform exists that caters to their hyper-local, institution-specific needs.

MyCircle fills this critical gap by providing a dedicated space where students can create verified institutional profiles, post and discover local opportunities across multiple categories (internships, gigs, jobs, barter, and rentals), follow peers, engage in real-time one-on-one messaging, and receive notifications about new activity within their academic circle. The platform incorporates JWT-based authentication for secure session management, bcrypt for password hashing, Cloudinary integration for cloud-based media storage, and Socket.io for real-time event-driven communication. The frontend is developed using React.js with Vite as the build tool, delivering a responsive, mobile-first user interface styled with Tailwind CSS. The backend is a stateless RESTful API built on Express.js, communicating with a MongoDB Atlas cloud database via the Mongoose ODM.

Key features of the current version include opportunity posting and browsing with advanced filters, a map-based spatial exploration view using Leaflet.js, a dynamic post lifecycle tracker, an AI-powered insights module, and a role-based access control system distinguishing between regular students and administrators. The project was developed iteratively following agile principles, with comprehensive API testing performed using Postman and multi-browser UI testing conducted to ensure cross-platform compatibility. MyCircle demonstrates a practical, scalable, and socially impactful application of modern web technologies in solving a real-world problem faced by the student community.

TABLE OF CONTENTS

Certificate of Approval	ii

Guide Certificate	iii

Self Declaration	iv

Acknowledgement	v

Abstract	vi

Table of Contents	vii

List of Figures	viii

List of Abbreviations	ix

CHAPTER 1: Introduction	1

1.1  Introduction to the Project	1

1.2  Problem Statement	3

1.3  Motivation	4

1.4  Project Scope	5

1.5  Organization of the Report	6

CHAPTER 2: Literature Review / Existing Systems	7

2.1  Overview of Existing Platforms	7

2.2  Comparative Analysis	9

2.3  Research Gap	10

2.4  Justification for Building MyCircle	11

CHAPTER 3: System Requirements	12

3.1  Functional Requirements	12

3.2  Non-Functional Requirements	14

3.3  Hardware Requirements	15

3.4  Software Requirements	16

CHAPTER 4: System Design	17

4.1  System Architecture	17

4.2  Architecture Diagram Description	18

4.3  Database Design	19

4.4  ER Diagram	22

4.5  Data Flow Diagram (DFD)	23

4.6  Use Case Diagram	25

4.7  Module Description	26

4.8  API Design	28

CHAPTER 5: Technology Stack	32

5.1  MongoDB	32

5.2  Express.js	33

5.3  React.js	34

5.4  Node.js	36

5.5  Vite	37

5.6  Tailwind CSS	38

5.7  JWT Authentication	39

5.8  Axios	40

5.9  Socket.io	41

5.10 Cloudinary	42

5.11 Git & GitHub	43

CHAPTER 6: Implementation & Feature Walkthrough	44

6.1  User Registration and Authentication	44

6.2  Student Profile Page	46

6.3  Opportunities Feed	47

6.4  Post an Opportunity	49

6.5  Campus Events	50

6.6  Study Groups	51

6.7  Follow / Unfollow System	52

6.8  Notifications	53

6.9  Messaging	54

6.10 Admin Panel	55

CHAPTER 7: Testing	57

7.1  Testing Strategy	57

7.2  Unit Testing	58

7.3  API Testing	59

7.4  Frontend Testing	62

7.5  Security Testing	63

7.6  Performance Testing	64

7.7  User Acceptance Testing	65

7.8  Bug Report Table	66

CHAPTER 8: Screenshots / UI Walkthrough	68

CHAPTER 9: Limitations	74

CHAPTER 10: Future Scope	77

CHAPTER 11: Conclusion	82

References	84

LIST OF FIGURES

Figure 4.1  –  System Architecture Diagram – 3-Tier Client-Server Model	18

Figure 4.2  –  Database Schema Overview – MongoDB Collections Relationship	19

Figure 4.3  –  Entity-Relationship (ER) Diagram – MyCircle Database	22

Figure 4.4  –  Level 0 DFD – Context Diagram (MyCircle System)	23

Figure 4.5  –  Level 1 DFD – Decomposed Process View	24

Figure 4.6  –  Use Case Diagram – Guest, Student, and Admin Actors	25

Figure 6.1  –  Login and Registration Page UI	44

Figure 6.2  –  Student Profile Page – View and Edit Modes	46

Figure 6.3  –  Opportunities Feed – List View with Filters	47

Figure 6.4  –  Map-Based Explore View – Leaflet Integration	48

Figure 6.5  –  Post an Opportunity – Multi-step Form UI	49

Figure 6.6  –  Campus Events Listing Page	50

Figure 6.7  –  Study Groups – Browse and Create Interface	51

Figure 6.8  –  Notification Bell and Dropdown Panel	53

Figure 6.9  –  Direct Messaging Interface – Chat Window	54

Figure 6.10  –  Admin Dashboard – User and Post Management	55

Figure 8.1  –  Screenshot Placeholder – Login/Register Page	68

Figure 8.2  –  Screenshot Placeholder – Home / Opportunity Feed	69

Figure 8.3  –  Screenshot Placeholder – Profile Page	70

Figure 8.4  –  Screenshot Placeholder – Post Opportunity Form	71

Figure 8.5  –  Screenshot Placeholder – Events Page	72

Figure 8.6  –  Screenshot Placeholder – Messaging Interface	73

LIST OF ABBREVIATIONS

CHAPTER 1: INTRODUCTION

1.1 Introduction to the Project

MyCircle is a community-driven, full-stack web application built on the MERN technology stack—MongoDB, Express.js, React.js, and Node.js—crafted specifically to serve the unmet networking and opportunity-discovery needs of students in local academic ecosystems. In an era when digital transformation has reshaped how professionals connect globally, students in tier-2 and tier-3 Indian cities still depend on informal WhatsApp groups, bulletin boards, and word-of-mouth to learn about internships, freelance projects, part-time jobs, hackathons, workshops, and study collaborations happening within their own campus and city. MyCircle is a deliberate, structured answer to this problem: a dedicated, verified, and hyper-local platform designed by a student, for students.

The name 'MyCircle' is intentional and symbolic—it represents the idea that every student already belongs to multiple overlapping circles: their college circle, their city circle, their subject-interest circle, and their peer-follow circle. The platform brings all of these together under a single, unified digital space. Unlike global platforms that aggregate opportunities from across the country or world (and thereby drown out local, relevant posts), MyCircle surfaces only what matters to the student based on their institution, city, and interests. This locality-first philosophy is the platform's defining differentiator.

The application supports two primary user roles: the Student and the Administrator. Students can register with institutional details, build a profile, post opportunities (internships, gigs, items for sale or rent), discover opportunities posted by peers, follow other students, communicate via a real-time direct messaging system, and receive event-driven notifications. The Admin role provides a governance layer with access to a management dashboard for user oversight, post moderation, and report handling. The frontend is a React.js Single Page Application (SPA) served by Vite, featuring a responsive, glassmorphism-inspired design system with smooth micro-animations powered by Framer Motion. The backend is a stateless RESTful API server built on Express.js, persisting all data in MongoDB Atlas via Mongoose, with JWT-based authentication securing all protected endpoints.

MyCircle is not merely an academic exercise—it represents a genuinely deployable product. Real students can sign up, post opportunities, and connect with peers in their city today. The system has been tested, deployed on a cloud platform, and iterated upon based on real user feedback. It demonstrates the practical application of modern full-stack web development principles to a socially meaningful problem, and serves as a comprehensive showcase of the skills acquired during the MCA programme at Guru Ghasidas Vishwavidyalaya.

1.2 Problem Statement

The core problem that MyCircle addresses can be stated as follows: students in local colleges and universities across India lack a centralized, verified, and community-specific digital platform to discover and post local academic and professional opportunities, connect with institutional peers, and collaborate on shared interests. This problem manifests in several interconnected ways that collectively impede student career development, academic collaboration, and campus community-building.

First, the most widely used professional networking platform, LinkedIn, caters primarily to working professionals and job-seekers in the formal, large-company sector. Its algorithm and user base are oriented towards multinational corporations, metro-city recruiters, and white-collar roles. A small startup in Bilaspur looking for a part-time graphic designer intern from the local MCA batch has no effective means to target the right student audience on LinkedIn. Conversely, the MCA student looking for a local internship is lost in a sea of pan-India listings that are geographically and contextually irrelevant. The platform is not designed for hyperlocal, informal-sector, or college-circle networking.

Second, existing opportunity-listing platforms such as Internshala and LinkedIn aggregators serve a discovery-only function—they list opportunities but provide no community infrastructure, no peer-to-peer following, no event management, no study-group formation, and no real-time communication. They are job boards, not networks. A student who finds an internship on Internshala cannot also see what events their college is hosting next weekend, join a Python study group, or message a senior alumnus in the same city for advice.

Third, the informal workaround that most student communities resort to—WhatsApp groups, Telegram channels, Facebook groups—suffers from fundamental structural problems: there is no content categorization, no search functionality, no user verification, no post lifecycle management, and no discoverability for students outside the group. A student who recently joined the college cannot discover the 47 unrelated WhatsApp groups they need to join to stay informed about campus life. There is no single source of truth. MyCircle was designed to be exactly that single source of truth—structured, searchable, verified, and community-owned.

1.3 Motivation

The motivation for building MyCircle emerged from a direct, personal observation of the opportunity-gap problem experienced by students at Guru Ghasidas Vishwavidyalaya. During the course of the MCA programme, it became evident that numerous valuable local opportunities—short-term freelance projects from local businesses, inter-department study collaborations, tech event announcements from nearby engineering colleges, and informal mentoring from senior students—were either never discovered by the students who needed them most, or were communicated so informally that they reached only a small subset of the intended audience. This recurring friction between opportunity availability and opportunity visibility was the primary motivational force behind MyCircle.

From a technical standpoint, the motivation was equally compelling. The MCA curriculum at GGU provides a rigorous grounding in computer science fundamentals, data structures, database management, software engineering, and programming languages. However, the practical synthesis of these skills into a production-ready, full-stack web application represents a qualitatively different and higher-order learning challenge—one that involves not just writing code, but making architectural decisions, managing a RESTful API, implementing security mechanisms, designing a database schema, deploying to the cloud, and iterating based on user feedback. Building MyCircle was thus not only a solution to a real problem, but also a deliberate, ambitious attempt to consolidate and demonstrate the full breadth of technical skills acquired during the programme.

There is also a broader motivational dimension rooted in the Indian higher education ecosystem. With over 900 universities and more than 40,000 colleges across India, the overwhelming majority of students study in institutions that lack robust career services, active alumni networks, and campus opportunity platforms. MyCircle represents a scalable template for how technology can democratize access to opportunities for students in these underserved academic ecosystems—not just in Bilaspur, but in every tier-2 and tier-3 city across the country.

1.4 Project Scope

The current version of MyCircle, as documented in this report, encompasses a well-defined and deliberately bounded set of features designed to deliver core value while remaining achievable within the timeframe and resources of a Minor Project. The following features are included in scope for this version: user registration and JWT-based login; student profile creation and editing with profile image upload via Cloudinary; opportunity posting and browsing across four categories (jobs, services, sell, and rent); map-based spatial exploration using Leaflet.js integrated with the browser Geolocation API; a post lifecycle tracker with expiry management; the follow/unfollow peer-connection system; real-time one-on-one direct messaging; an in-app notification system; and a role-based admin panel for platform governance.

The following features are explicitly out of scope for this version and are documented separately in the Future Scope chapter: a dedicated mobile application for iOS or Android (React Native is identified as the future framework); AI/ML-based personalized recommendation engines; multi-college institutional verification via institutional email domains (the current version uses self-declared college fields); a payment gateway for premium opportunity listings; a formal study group management module with group chat; email verification with OTP upon registration; and full Elasticsearch integration for advanced full-text search capabilities. These exclusions are not oversights but deliberate decisions to maintain project focus and ensure the in-scope features are implemented to a production-ready standard.

1.5 Organization of the Report

The remainder of this report is organized into ten chapters, each addressing a distinct aspect of the MyCircle project. Chapter 2 presents a Literature Review, analysing existing platforms and identifying the research gap that MyCircle fills. Chapter 3 details the System Requirements, covering both functional and non-functional requirements alongside hardware and software specifications. Chapter 4 presents the System Design, encompassing the architectural overview, database schema, ER Diagram, Data Flow Diagrams (DFD), Use Case Diagram, module descriptions, and the complete API endpoint catalogue. Chapter 5 provides an in-depth Technology Stack analysis, explaining the rationale for each technology selected and how they integrate within MyCircle's architecture. Chapter 6 offers a feature-by-feature Implementation Walkthrough, describing the UI, underlying logic, and API interactions for each major module. Chapter 7 documents the Testing strategy and results, including API test cases, frontend testing, security testing, performance benchmarks, User Acceptance Testing (UAT), and a bug report. Chapter 8 presents the UI Walkthrough with screenshot descriptions for each major page. Chapter 9 identifies the current Limitations of the platform, and Chapter 10 outlines the Future Scope for enhancement and expansion. Chapter 11 concludes the report with a summary, learning outcomes, and closing statement. The References section lists all academic, technical, and online sources consulted during the project.

CHAPTER 2: LITERATURE REVIEW / EXISTING SYSTEMS

2.1 Overview of Existing Platforms

A thorough examination of existing platforms that partially address student networking and opportunity discovery is essential to establish the context and necessity of MyCircle. This section evaluates four major categories of existing solutions: professional networking platforms (LinkedIn), opportunity-specific portals (Internshala), informal communication channels (WhatsApp groups), and college-specific institutional portals. Each category is analysed for its strengths, weaknesses, and specifically its failure to serve the hyperlocal, community-centric needs of students in smaller Indian cities.

LinkedIn, founded in 2003 and currently the world's largest professional network with over 900 million members globally, is the default recommendation for professional networking. However, LinkedIn's design philosophy, algorithm, and content ecosystem are fundamentally oriented towards formal, corporate, and professional contexts. The platform privileges users with established work histories, endorsements from industry professionals, and connections to corporate entities. For a second-year MCA student in Bilaspur seeking a local part-time gig or a peer study partner for a Database Management Systems examination, LinkedIn offers little practical utility. Search results are dominated by listings from major metropolitan areas, and the social graph is sparse among students from non-premier institutions. Furthermore, LinkedIn's premium features—which include InMail messaging to non-connections and advanced job search filters—are behind a subscription paywall that is financially prohibitive for most Indian students. The platform's community features (LinkedIn Groups) have largely stagnated, and there is no mechanism for hyperlocal, institution-specific content surfacing.

Internshala is India's leading internship-listing platform, with a user base primarily composed of undergraduate and postgraduate students. It provides a structured marketplace for internship and part-time job listings, with filters for location, stipend, and duration. While Internshala effectively addresses the opportunity-discovery dimension of the problem, it is fundamentally a job board, not a community platform. It offers no peer-to-peer follow system, no event management capability, no study group formation, and no real-time messaging between students. The listings are predominantly from companies seeking remote or metro-city candidates, and hyperlocal, informal opportunities from small local businesses that might be willing to hire a student from a nearby college are systematically absent. Internshala is a destination for formal internship applications, not a space for organic community interaction, collaborative learning, or peer-to-peer exchange.

WhatsApp groups represent the most widely used informal solution to campus networking in Indian colleges. Virtually every college has dozens of WhatsApp groups—department groups, batch groups, event announcement groups, study material sharing groups, and alumni groups. These groups are omnipresent but deeply inefficient as an information infrastructure. There is no content categorization, making it impossible to search for a specific opportunity posted three weeks ago. There is no discovery mechanism for students to find relevant groups outside their immediate social circle. Content is volatile, with messages quickly buried under subsequent conversation. There is no user verification, meaning that anyone added to a group is indistinguishable from a genuine student. Group management is burdensome, with admins manually approving members and moderating content. WhatsApp groups are communication tools, not opportunity platforms, and they function as a poor substitute for a purpose-built student community application.

Many universities and colleges maintain dedicated institutional portals or ERP systems for academic administration. However, these portals are overwhelmingly oriented towards administrative functions—fee payment, attendance records, examination results, and timetable management. Their social and community features, if any, are rudimentary and poorly adopted by students. The UX design of most institutional portals reflects their administrative, rather than community, purpose: they are functional but unappealing, with no social feed, no follow mechanism, no real-time features, and no mobile responsiveness. Furthermore, they are siloed—a student at GGU's engineering college cannot discover opportunities posted by a student at GGU's commerce department through the institutional portal.

2.2 Comparative Analysis

The following table presents a structured comparative analysis of MyCircle against the four categories of existing platforms, evaluated on nine criteria relevant to the needs of local college students.

2.3 Research Gap

The comparative analysis reveals a clear and significant research gap: no existing platform simultaneously offers hyperlocal geographic focus, multi-category opportunity posting, a peer-follow social graph, real-time messaging, event management, and map-based spatial discovery—all within a single, freely accessible, student-verified platform. LinkedIn comes closest to providing a comprehensive social and professional network, but its hyperlocal and student-specific relevance is minimal. Internshala addresses opportunity discovery but offers no community infrastructure. WhatsApp groups enable communication but are structurally unfit for content organization and discoverability. College portals serve administrative functions but not community-building.

The research gap can be precisely articulated as the absence of a platform that treats hyperlocal, institutional-community-specific student networking as a first-class problem, and builds every feature—from the social graph to the search filters to the map view—around the principle that what matters most to a student is what is happening within their academic circle, in their city, right now. MyCircle is explicitly designed to fill this gap.

2.4 Justification for Building MyCircle

The justification for building MyCircle, rather than adapting or extending an existing platform, is grounded in the architectural and philosophical incompatibility between the needs of local student communities and the designs of existing solutions. Adapting LinkedIn would require overriding its globally-oriented algorithm, its professional-context bias, and its premium-feature paywall—a set of changes that would fundamentally alter the product and are not feasible for a student project. Building a plugin or extension for Internshala is not possible given its closed-source architecture. Creating a WhatsApp-based bot or structured group would replicate the communication capability but solve none of the discoverability, categorization, or social-graph problems.

Building MyCircle from scratch using the MERN stack is therefore the most technically sound and practically impactful approach. It allows complete control over the data model, the API design, the user experience, and the feature set. It ensures that every design decision—from the choice of MongoDB's flexible document model to the implementation of JWT-based stateless authentication—is motivated by the specific requirements of a hyperlocal student community platform rather than by legacy constraints or commercial considerations. Furthermore, the act of building MyCircle from the ground up provides the developer with a comprehensive, hands-on learning experience spanning database design, API development, frontend engineering, authentication, cloud deployment, and real-time communication—precisely the breadth of practical skills that a full-stack MCA project is intended to cultivate.

CHAPTER 3: SYSTEM REQUIREMENTS

3.1 Functional Requirements

Functional requirements define the specific behaviours and capabilities that the MyCircle system must provide to its users. The following functional requirements have been identified through a combination of stakeholder analysis (student community needs), competitive benchmarking (as detailed in Chapter 2), and iterative design exploration conducted during the project's planning phase.

FR-01: User Registration — The system shall allow new users to register by providing their full name, email address, password, college name, city, and optionally a brief biography and profile photograph. The system shall validate that the email address is unique within the system before completing registration. Passwords shall be hashed using bcrypt before storage.

FR-02: User Authentication — The system shall authenticate registered users via email and password. Upon successful authentication, the system shall issue a JSON Web Token (JWT) containing the user's ID and role, which the client shall store and include in the Authorization header of all subsequent API requests to protected endpoints.

FR-03: Profile Management — Authenticated students shall be able to view and edit their profile information, including display name, biography, college, city, availability status, and profile photograph. Profile photographs shall be uploaded to Cloudinary, and the resulting URL shall be stored in the user document in MongoDB.

FR-04: Opportunity Posting — Authenticated students shall be able to create opportunity posts specifying: title, post type (job, service, sell, rent), description, location (manual text or geolocation coordinates), price or budget range (minimum and maximum), duration, availability, tags, associated images (up to 5), whether barter is accepted, and an expiry date. The system shall persist these posts in the Opportunities collection.

FR-05: Opportunity Discovery — The system shall provide an Explore feed displaying opportunity posts from across the platform, with support for filtering by post type, geographic proximity (using user-provided or GPS-detected location), search query (title and description text matching), and sorting by recency or distance.

FR-06: Map-Based Exploration — The system shall render a map view (powered by Leaflet.js and OpenStreetMap tiles) displaying geolocated opportunity posts as interactive markers. Each marker shall display a category emoji and price badge, and clicking a marker shall reveal a popup with post summary and a link to the full post details page.

FR-07: Follow/Unfollow System — Authenticated students shall be able to follow and unfollow other students. The follower and following counts shall be displayed on each user's profile page, along with paginated lists of followers and followees.

FR-08: Real-time Direct Messaging — Authenticated students shall be able to initiate and participate in one-on-one direct message conversations with other students. Messages shall be persisted in the Messages collection. The messaging interface shall display a chronological conversation thread with read/delivered status indicators.

FR-09: Notification System — The system shall generate and deliver in-app notifications for key user events, including new followers, likes and shares on the user's posts, new messages, and post expiry warnings. Notifications shall be marked as read when the user opens the notification panel.

FR-10: Admin Panel — Users with the Administrator role shall have access to a dedicated admin dashboard displaying platform-wide statistics (total users, total posts, total active sessions). Administrators shall be able to view, deactivate, or delete user accounts, and remove or flag opportunity posts that violate community guidelines.

3.2 Non-Functional Requirements

Non-functional requirements define the quality attributes and operational constraints of the MyCircle system. These requirements govern how the system performs its functions rather than what functions it performs.

NFR-01: Performance — The system shall deliver initial page load times of under three seconds on a standard broadband connection (10 Mbps+). API endpoints for opportunity listing shall respond within 500 milliseconds for datasets of up to 10,000 posts. The React frontend, built with Vite and leveraging code-splitting and lazy loading, shall minimize the initial JavaScript bundle size to improve Time to Interactive (TTI).

NFR-02: Security — All passwords shall be hashed using bcrypt with a minimum cost factor of 10. All protected API routes shall be guarded by JWT verification middleware. The system shall implement CORS policies restricting cross-origin requests to the designated frontend origin. Input sanitization shall be applied to all user-supplied data before it is processed by Mongoose queries, mitigating NoSQL injection risks. HTTPS shall be enforced on all production endpoints.

NFR-03: Scalability — The MongoDB document model shall be designed to support horizontal scaling via MongoDB Atlas's auto-scaling capabilities. The Express.js API server shall remain stateless (all state stored in MongoDB or JWTs), enabling horizontal scaling across multiple server instances behind a load balancer. The system shall be designed to accommodate a user base scaling from hundreds to tens of thousands without architectural changes.

NFR-04: Availability — The production deployment shall target 99%+ uptime, leveraging the reliability guarantees of the chosen cloud hosting platform (Render or Railway) and MongoDB Atlas. Graceful error handling shall ensure that individual component failures do not cascade into complete system unavailability.

NFR-05: Usability — The frontend shall implement a mobile-first responsive design, ensuring full functionality and aesthetic integrity on screen widths from 320px (small mobile) to 1920px (large desktop). The UI shall conform to WCAG 2.1 Level AA accessibility guidelines where feasible, including appropriate colour contrast ratios, keyboard navigability, and semantic HTML structure.

NFR-06: Maintainability — The codebase shall follow a modular architecture with clear separation of concerns: controllers, routes, models, middleware, and utility functions on the backend; pages, components, contexts, hooks, services, and utilities on the frontend. All API endpoints shall be documented in this report. Environment-specific configuration shall be managed via .env files and the platform's environment variable system.

3.3 Hardware Requirements

The following table specifies the hardware requirements for both the development environment (the machine used to build and test MyCircle) and the production deployment environment (the cloud server on which MyCircle is hosted).

3.4 Software Requirements

The following table catalogues all software tools, libraries, and platforms used in the development and deployment of MyCircle, along with the version used and the purpose each serves within the project.

CHAPTER 4: SYSTEM DESIGN

4.1 System Architecture

MyCircle is designed on a classic three-tier architecture, which separates the application into three distinct logical layers: the Presentation Tier (frontend client), the Logic Tier (backend API server), and the Data Tier (database). This separation of concerns ensures that each tier can be developed, tested, scaled, and maintained independently, providing a clean and modular system structure appropriate for a production-grade web application.

The Presentation Tier is a React.js Single Page Application (SPA) bundled and served by Vite. When a user navigates to the MyCircle web application in their browser, the browser downloads the JavaScript, CSS, and HTML assets from the CDN or hosting service. The React application then takes control of the browser, rendering the UI, managing client-side routing via React Router v6, and communicating with the backend API exclusively via HTTP/HTTPS requests sent through the Axios library. The SPA architecture means that subsequent page navigations do not require full page reloads—React dynamically updates only the components that have changed, delivering a fast, app-like user experience.

The Logic Tier is a stateless RESTful API server built on Node.js and Express.js. It receives HTTP requests from the React client, authenticates them via JWT middleware, processes the business logic (validating data, enforcing authorization rules, orchestrating data access), and returns JSON responses. Because the server is stateless—it stores no session information locally between requests—it is horizontally scalable: multiple server instances can run concurrently behind a load balancer, each independently processing requests. The Express.js application is organized into routes (defining endpoints), controllers (handling request/response logic), middleware (authentication, error handling, CORS), and utility modules (Cloudinary upload, token generation).

The Data Tier consists of two cloud-hosted services: MongoDB Atlas for structured document storage, and Cloudinary for binary media asset storage. MongoDB Atlas is a fully managed cloud database service that hosts the MyCircle MongoDB database across distributed server nodes, providing automatic backups, high availability, and seamless scaling. The Express.js server connects to MongoDB Atlas via Mongoose, an ODM that provides schema definition, validation, query building, and middleware hooks. Cloudinary handles all user-uploaded image assets—profile photos and post images—storing them on its globally distributed CDN and returning publicly accessible URLs that are then stored in the MongoDB documents.

4.2 Architecture Diagram Description

The system architecture of MyCircle, as represented in Figure 4.1, flows as follows. The User's Web Browser on the left side of the diagram represents the client layer. The browser loads the React SPA (JavaScript bundle built by Vite) and renders the UI. User interactions trigger Axios HTTP requests, which flow rightward over HTTPS to the Express.js API Server.

The Express.js API Server sits at the centre of the architecture. Incoming requests first pass through the CORS Middleware, which validates the request origin. Authenticated requests then pass through the JWT Authentication Middleware, which decodes and verifies the Authorization header token. Validated requests are routed to the appropriate Controller, which implements the business logic for the requested operation. The controller interacts with Mongoose Models to read or write data in MongoDB Atlas (data flowing to the right). For media uploads, the controller uses the Cloudinary SDK to upload binary data to Cloudinary's servers and receive a CDN URL. For real-time events, the Socket.io server (co-hosted on the Express.js process) emits events to connected clients.

MongoDB Atlas (top right) stores all structured application data across six primary collections: Users, Posts, Messages, Notifications, Conversations, and Requests. Cloudinary (bottom right) stores all media assets and serves them via its global CDN. The Socket.io layer (depicted as a bidirectional arrow between the browser and the Express server) maintains persistent WebSocket connections for real-time messaging and notification delivery.

4.3 Database Design

MyCircle uses MongoDB as its database management system, leveraging its document-oriented, schema-flexible NoSQL data model. Unlike relational databases (MySQL, PostgreSQL) which store data in fixed-schema tables with rows and columns, MongoDB stores data as BSON (Binary JSON) documents within collections. This model is particularly well-suited to MyCircle's requirements because the opportunity post document, for example, can contain nested objects (location coordinates), arrays (tags, images, likes), and optional fields (budgetMin, budgetMax, expiresAt) without requiring schema alterations or NULL placeholders for every row as would be needed in a relational system.

Mongoose, the Object Document Mapper used to interface between the Node.js application and MongoDB, provides schema definition, type enforcement, default values, validation, and middleware hooks (pre/post save, pre/post query) that give the flexible MongoDB document model a structured, application-level contract. Each Mongoose schema corresponds to a MongoDB collection. The following subsections describe each collection's schema in detail.

4.3.1 Users Collection

The Users collection stores the core identity and social graph information for every registered user on the platform. Each user document contains the following fields: _id (ObjectId, auto-generated primary key), displayName (String, required, the user's chosen public name), email (String, required, unique, indexed for fast authentication lookups), passwordHash (String, required, the bcrypt-hashed password), college (String, optional, the user's institution), city (String, optional, the user's city), bio (String, optional, a short personal description), profileImage (String, optional, Cloudinary CDN URL of the profile photo), role (String, enum ['user', 'admin'], default 'user'), followers (Array of ObjectId references to Users), following (Array of ObjectId references to Users), reputation (Object containing trustScore and averageRating sub-fields), isActive (Boolean, default true, set to false when an admin deactivates the account), and createdAt / updatedAt (Date, auto-managed by Mongoose timestamps).

4.3.2 Posts Collection

The Posts collection is the central data collection of MyCircle, storing all opportunity posts created by students. Each post document contains: _id (ObjectId), title (String, required), description (String, required), type (String, enum ['job', 'service', 'sell', 'rent'], required), location (String, human-readable location name), coordinates (Object with lat and lng sub-fields for geospatial queries), price (Number, optional), budgetMin (Number, optional), budgetMax (Number, optional), images (Array of Strings, Cloudinary URLs), tags (Array of Strings), user (ObjectId reference to Users, the post author), availability (String, optional), duration (Number, days), acceptsBarter (Boolean, default false), isUrgent (Boolean, default false), isActive (Boolean, default true), status (String, enum ['active', 'expired', 'completed', 'cancelled']), expiresAt (Date, computed from createdAt + duration), likes (Array of ObjectId references to Users who liked the post), shares (Number, share count), views (Number, view count), and createdAt / updatedAt timestamps.

4.3.3 Messages Collection

The Messages collection stores individual chat messages exchanged between users. Each message document contains: _id (ObjectId), conversation (ObjectId reference to Conversations), sender (ObjectId reference to Users), content (String, the message text), messageType (String, enum ['text', 'system', 'transaction'], default 'text'), isRead (Boolean, default false), createdAt (Date), and optionally transactionData (Object containing amount, description, and status sub-fields for in-chat transaction records).

4.3.4 Conversations Collection

The Conversations collection acts as a container for messaging threads between pairs of users. Each document contains: _id (ObjectId), participants (Array of two ObjectId references to Users), post (ObjectId reference to Posts, the opportunity that initiated the conversation), lastMessage (ObjectId reference to the most recent Message), lastMessageTime (Date), unreadCount (Object mapping user IDs to their respective unread message counts), and createdAt / updatedAt timestamps.

4.3.5 Notifications Collection

The Notifications collection stores in-app notifications for all user events. Each notification document contains: _id (ObjectId), recipient (ObjectId reference to Users), sender (ObjectId reference to Users, optional), type (String, enum ['follow', 'like', 'share', 'message', 'post_expiry', 'system']), message (String, the notification display text), relatedPost (ObjectId reference to Posts, optional), isRead (Boolean, default false), and createdAt timestamp.

4.3.6 Requests Collection

The Requests collection manages opportunity-application and peer-connection requests between students. Each request document contains: _id (ObjectId), fromUser (ObjectId reference to Users), toUser (ObjectId reference to Users), post (ObjectId reference to Posts), status (String, enum ['pending', 'approved', 'rejected', 'cancelled']), message (String, the applicant's introductory message), and createdAt / updatedAt timestamps. When a request is approved by the post owner, a Conversation document is automatically created between the two parties, enabling direct messaging.

4.4 ER Diagram

Figure 4.3 depicts the Entity-Relationship Diagram for the MyCircle database, illustrating the six primary entities and their relationships. The following description is intended to guide the manual drawing of the ER Diagram on plain paper or using a diagramming tool.

The USER entity is the central entity of the diagram, with attributes: UserID (PK), DisplayName, Email, PasswordHash, College, City, Bio, ProfileImage, Role, IsActive, CreatedAt. The USER entity has the following relationships: a USER can create zero or many POSTS (one-to-many, 'Posts' relationship); a USER can send zero or many MESSAGES (one-to-many); a USER can receive zero or many MESSAGES (one-to-many); a USER can follow zero or many other USERs, and be followed by zero or many USERs (many-to-many self-referencing, 'Follows' relationship); a USER can receive zero or many NOTIFICATIONS (one-to-many); a USER can be the initiator or recipient of zero or many REQUESTS (one-to-many).

The POST entity has attributes: PostID (PK), Title, Description, Type, Location, Coordinates, Price, BudgetMin, BudgetMax, Tags, Images, Duration, ExpiresAt, Status, IsActive, CreatedAt. Each POST is associated with exactly one USER (the author). A POST can have zero or many REQUESTS associated with it. A POST can be part of zero or many CONVERSATIONS (one-to-many).

The MESSAGE entity has attributes: MessageID (PK), Content, MessageType, IsRead, CreatedAt. Each MESSAGE belongs to exactly one CONVERSATION, is sent by exactly one USER (sender). The CONVERSATION entity has attributes: ConversationID (PK), LastMessageTime, UnreadCount. Each CONVERSATION has exactly two participants (USERs) and is optionally associated with one POST. The NOTIFICATION entity has attributes: NotificationID (PK), Type, Message, IsRead, CreatedAt. Each NOTIFICATION has one recipient USER and optionally one sender USER and one related POST. The REQUEST entity has attributes: RequestID (PK), Status, Message, CreatedAt. Each REQUEST is from one USER (fromUser) to another USER (toUser) and is associated with one POST.

4.5 Data Flow Diagram (DFD)

4.5.1 Level 0 DFD (Context Diagram)

The Level 0 DFD, also known as the Context Diagram (Figure 4.4), represents MyCircle as a single process — 'MyCircle Platform' — at the centre of the diagram. There are three external entities that interact with the system: Student User (the primary actor), Administrator, and External Services (Cloudinary for image hosting, MongoDB Atlas for cloud data persistence). The data flows are as follows: The Student User sends Registration Data, Login Credentials, Opportunity Post Data, Message Content, and Follow/Unfollow Requests to the MyCircle Platform. The MyCircle Platform returns Authentication Tokens, Opportunity Feed Data, Profile Data, Notification Data, and Chat Messages to the Student User. The Administrator sends Moderation Actions (delete post, deactivate user) and receives Platform Statistics and User/Post Lists. The MyCircle Platform sends Image Upload Requests to External Services (Cloudinary) and receives CDN Image URLs in return. The Platform sends Database Read/Write Queries to MongoDB Atlas and receives Document Data.

4.5.2 Level 1 DFD

The Level 1 DFD (Figure 4.5) decomposes the MyCircle Platform process into seven sub-processes, each with their associated data flows and data stores. The seven processes are: P1 (User Authentication), P2 (Profile Management), P3 (Opportunity Management), P4 (Social Graph Management), P5 (Messaging), P6 (Notification System), and P7 (Admin Panel).

P1 — User Authentication: receives Registration Data and Login Credentials from the Student User external entity. Writes new User documents to the DS1 (Users Data Store). Returns JWT Access Token to the client. P2 — Profile Management: receives Profile Update Data and Image Upload from the Student User. Reads from and writes to DS1 (Users Data Store). Sends image data to Cloudinary and receives CDN URL. P3 — Opportunity Management: receives Post Creation Data and Search/Filter Queries from the Student User. Reads from and writes to DS2 (Posts Data Store). Returns Opportunity Feed Data and Post Detail Data to the client. P4 — Social Graph Management: receives Follow/Unfollow Requests. Reads from and writes to DS1 (Users Data Store) to update follower/following arrays. Returns updated social graph data. P5 — Messaging: receives Message Content from Student User. Reads from and writes to DS3 (Messages Data Store) and DS4 (Conversations Data Store). Returns Conversation Thread Data to both the sender and recipient in real-time via Socket.io. P6 — Notification System: triggered by events from P3, P4, and P5. Writes notification documents to DS5 (Notifications Data Store). Delivers real-time notification events to the recipient client via Socket.io. P7 — Admin Panel: receives Moderation Actions from the Administrator. Reads from DS1 (Users), DS2 (Posts), DS5 (Notifications). Writes deactivation/deletion updates. Returns Platform Statistics to the Administrator.

4.6 Use Case Diagram

Figure 4.6 depicts the Use Case Diagram for MyCircle. The diagram contains three actors: Guest (unauthenticated visitor), Student (authenticated registered user), and Admin (authenticated administrator). The use cases are organized within the system boundary (a rectangle labelled 'MyCircle System').

Guest Actor Use Cases: (1) View Landing/Home Page, (2) Register New Account, (3) Log In with Credentials, (4) Browse Public Opportunity Feed (limited view). The Guest actor can only interact with the publicly accessible portions of the platform. All other operations require authentication.

Student Actor Use Cases (extends Guest): (5) View and Edit Own Profile, (6) Upload Profile Photo, (7) Create Opportunity Post, (8) Edit Own Opportunity Post, (9) Delete Own Opportunity Post, (10) Browse Opportunity Feed with Filters, (11) View Map-Based Opportunity Exploration, (12) View Full Opportunity Details, (13) Like an Opportunity Post, (14) Share an Opportunity Post, (15) Send Application Request for an Opportunity, (16) Follow Another Student, (17) Unfollow a Student, (18) View Follower/Following Lists, (19) Send Direct Message, (20) View Conversation Thread, (21) Receive Real-time Notifications, (22) Mark Notifications as Read, (23) View AI Insights for a Post, (24) View Post Analytics (own posts only).

Admin Actor Use Cases (extends Student): (25) View Admin Dashboard with Platform Statistics, (26) View All Users List, (27) Deactivate/Reactivate User Account, (28) Delete User Account, (29) View All Posts List, (30) Delete Any Post, (31) View Reported Content, (32) Manage Platform Settings. The Admin actor has all Student capabilities plus the additional governance capabilities listed above. The include relationship exists between 'Create Opportunity Post' and 'Upload Post Images' (image upload is an included sub-use-case of post creation). The extend relationship exists between 'Browse Opportunity Feed' and 'View Map Exploration' (map view is an optional extension of browsing).

4.7 Module Description

MyCircle's architecture is organized into eight functional modules, each encapsulating a cohesive set of features and corresponding backend routes, frontend pages, and database interactions. The following table provides a structured overview of each module.

4.8 API Design

MyCircle's backend implements a RESTful API, adhering to the principles of Representational State Transfer (REST). The API uses standard HTTP methods (GET, POST, PUT, PATCH, DELETE) to perform CRUD operations on resources. All requests and responses use the JSON content type. Protected endpoints require a valid JWT in the Authorization header (Bearer <token>). The base URL for all API endpoints is: https://mycircle-api.onrender.com/api (production) or http://localhost:5000/api (development).

The following table documents all major API endpoints implemented in the current version of MyCircle. For brevity, request body schemas are described in prose rather than full JSON Schema format. 'Y' in the Auth column indicates that a valid JWT Bearer token is required.

CHAPTER 5: TECHNOLOGY STACK

5.1 MongoDB

MongoDB is an open-source, cross-platform, document-oriented NoSQL database management system developed by MongoDB, Inc. Unlike traditional relational databases such as MySQL or PostgreSQL, which organize data into fixed-schema tables composed of rows and columns, MongoDB stores data as flexible BSON (Binary JSON) documents within collections. Each document is a self-contained JSON-like object that can have its own structure, allowing different documents within the same collection to have different fields. This schema flexibility is particularly valuable for a rapidly evolving application like MyCircle, where the opportunity post structure evolved significantly during development—adding fields like budgetMin, budgetMax, acceptsBarter, isUrgent, and coordinates—without requiring any database migration scripts or schema alteration commands.

For MyCircle, MongoDB was chosen over relational alternatives for three primary reasons. First, the data model of an opportunity post maps naturally to a document: a post has nested sub-objects (coordinates), arrays of primitives (tags, images, likes), and optional fields—all of which are elegantly represented as a single document rather than spread across multiple joined tables. Second, MongoDB's horizontal scaling architecture (sharding) and cloud-native offering (MongoDB Atlas) make it straightforward to scale from the small dataset of an initial launch to millions of documents without architectural changes. Third, the JavaScript/JSON alignment between MongoDB's document format and the Node.js/React application layers reduces the conceptual impedance mismatch, allowing developers to use the same data structures from the database through the API to the UI.

Mongoose, the ODM used to interface with MongoDB from Node.js, adds a structured application-level schema layer on top of MongoDB's flexible storage. Each Mongoose Schema defines the expected fields, their data types, validation rules, default values, and pre/post middleware hooks. For example, the Post schema defines the 'expiresAt' field as a Date, ensures 'title' is required and has a maximum length of 200 characters, and uses a pre-save hook to automatically compute the expiresAt value from createdAt and duration. MongoDB Atlas, MongoDB's fully managed cloud database service, hosts the MyCircle database, providing automatic daily backups, a free tier sufficient for development and early production, and a connection string that can be easily configured via environment variables.

5.2 Express.js

Express.js is a minimal, unopinionated web application framework for Node.js, designed to simplify the process of building server-side web applications and RESTful APIs. It provides a thin abstraction over Node.js's built-in HTTP module, adding essential capabilities such as routing, middleware composition, request/response object enhancements, and error handling, while leaving architectural decisions (like project structure and state management) entirely to the developer. This minimalism makes Express.js an excellent choice for building clean, modular REST APIs where the developer retains full control over the application's architecture.

The MyCircle Express.js server is organized using a layered architecture. The entry point (server.js) initializes the Express application, registers global middleware (CORS, body-parser for JSON, cookie-parser), establishes the MongoDB connection via Mongoose, initializes the Socket.io server on the same HTTP instance, and mounts the API routers. Each resource (auth, users, posts, conversations, notifications, requests, admin) has a dedicated router file that maps HTTP methods and URL patterns to controller functions. Controller functions handle the business logic for each route: they validate inputs, interact with Mongoose models, and return appropriate HTTP status codes and JSON response bodies. A centralized error-handling middleware at the bottom of the middleware stack catches any unhandled errors thrown by route handlers and formats them into consistent error response objects, preventing unhandled promise rejections from crashing the server.

The middleware architecture of the Express.js server in MyCircle follows a pipeline pattern. An incoming request passes sequentially through: (1) CORS middleware—validates the request origin against the allowed origins list; (2) Body Parser—parses the JSON request body into req.body; (3) Auth Middleware (on protected routes)—extracts and verifies the JWT from the Authorization header, attaches the decoded user object to req.user; (4) Route Handler / Controller—executes the business logic; (5) Response—sends the JSON response with the appropriate HTTP status code. If any middleware calls next(error), the request skips to the centralized error handler, which logs the error and sends a standardized error response.

5.3 React.js

React.js is an open-source JavaScript library developed by Meta for building user interfaces, particularly Single Page Applications (SPAs). React's core innovation is its component-based architecture, in which the UI is decomposed into small, reusable, self-contained components, each managing its own state and rendering logic. Components are composed into a tree hierarchy, and React's reconciliation algorithm (the Virtual DOM) efficiently updates only the parts of the actual DOM that have changed when state or props change, delivering high performance even in complex UIs.

In MyCircle, the React component hierarchy is organized as follows. The root App component renders the React Router configuration, wrapping all routes in a set of context providers (AuthContext, ThemeContext, ToastContext, SocketContext, CurrencySymbolContext). The router renders page-level components (Explore, PostDetails, Profile, Messages, Admin, etc.) based on the current URL. Page components compose UI components (PostCard, Button, Modal, Toast, etc.) from the shared component library. This hierarchical structure ensures that global state (authentication status, theme preference, socket connection) is available to any component in the tree via Context, while local state (form inputs, modal visibility, expanded card state) is managed at the appropriate component level using useState.

React hooks are used extensively throughout MyCircle. useState manages all local component state. useEffect handles side effects such as API data fetching on component mount and socket event subscription/unsubscription. useContext consumes global contexts (useAuth, useToast, useSocket). useCallback memoizes event handler functions to prevent unnecessary re-renders of child components. useMemo memoizes expensive computations (such as the lifecycle metadata calculation in PostCard). Custom hooks (useDialog, useCurrencySymbol) encapsulate reusable stateful logic. React Router v6's useNavigate and useParams hooks are used for programmatic navigation and URL parameter extraction respectively.

5.4 Node.js

Node.js is an open-source, cross-platform JavaScript runtime environment built on Chrome's V8 JavaScript engine. Its defining characteristic is a non-blocking, event-driven I/O model that allows it to handle thousands of concurrent connections efficiently without creating a new thread for each connection—unlike traditional multi-threaded server environments like Apache HTTP Server with PHP. This architecture makes Node.js particularly well-suited to I/O-bound applications such as RESTful API servers, where the server spends most of its time waiting for database queries, file system operations, or external API calls to complete.

For MyCircle, Node.js was the natural choice as the backend runtime for several reasons. Most fundamentally, it allows the entire application—both frontend and backend—to be written in JavaScript, reducing the cognitive overhead of context-switching between languages and enabling code sharing (for example, validation utility functions and constants can theoretically be shared between the client and server). The npm (Node Package Manager) ecosystem provides access to a vast library of open-source packages, including all the dependencies used in MyCircle (Express, Mongoose, jsonwebtoken, bcryptjs, Cloudinary SDK, Socket.io, etc.). The package.json file defines the project's metadata, dependency list, and npm scripts (npm run dev for development with nodemon auto-reload, npm start for production).

5.5 Vite

Vite is a next-generation frontend build tool developed by Evan You (the creator of Vue.js) that addresses the performance limitations of traditional bundler-based development tools like Create React App (which uses Webpack). Vite's fundamental innovation is its two-speed architecture: during development, it leverages the browser's native ES Module (ESM) support to serve source files directly to the browser without bundling, enabling near-instantaneous server startup and blazing-fast Hot Module Replacement (HMR). In production, Vite uses Rollup (a highly optimized bundler) to generate efficient, tree-shaken, code-split production bundles.

In the context of MyCircle, Vite dramatically improved the development experience compared to what Create React App would have provided. The development server starts in under 500 milliseconds regardless of the number of modules in the project, and HMR updates—where the browser instantly reflects code changes without a full page reload and without losing component state—typically complete in under 100 milliseconds. This fast feedback loop accelerated the UI development and debugging process significantly. Vite's production build generates an optimized bundle with automatic code-splitting (separate chunks for vendor libraries like React, Framer Motion, Leaflet, and the application code) and tree-shaking (removal of unused code from dependencies), resulting in smaller initial download sizes and faster page load times for end users.

5.6 Tailwind CSS

Tailwind CSS is a utility-first CSS framework that provides a comprehensive set of pre-defined CSS utility classes, each doing one specific thing (e.g., 'flex' applies 'display: flex', 'p-4' applies 'padding: 1rem', 'text-blue-500' applies a specific shade of blue as the text colour). Instead of writing custom CSS classes with multiple properties, developers compose UI by applying utility classes directly in their JSX markup. This approach eliminates the need for a separate CSS file for most component styling and prevents specificity conflicts and dead CSS accumulation.

MyCircle uses Tailwind CSS as its primary styling system, customized via the tailwind.config.js file to define the application's design tokens: a dark-mode-first colour palette with custom variables (--color-primary, --color-card, --color-background-secondary, etc.), custom border radii, custom font families (Inter), and custom animation keyframes. The responsive design is implemented using Tailwind's breakpoint prefixes (sm:, md:, lg:) applied directly to utility classes in JSX, enabling mobile-first responsive layouts without writing any media query CSS manually. The dark mode is toggled via a class applied to the HTML root element, which Tailwind detects to apply dark: variant classes.

5.7 JWT Authentication

JSON Web Tokens (JWT) are an open standard (RFC 7519) for securely transmitting information between parties as a JSON object. A JWT consists of three Base64URL-encoded parts separated by dots: the Header (specifying the algorithm and token type), the Payload (containing the claims—in MyCircle's case, the user's _id and role), and the Signature (a cryptographic hash of the header and payload using a secret key). The signature ensures that the token has not been tampered with.

In MyCircle's authentication flow, the sequence is as follows. The user submits their email and password to POST /api/auth/login. The server looks up the user by email, compares the submitted password against the stored bcrypt hash using bcrypt.compare(). If the comparison succeeds, the server generates a JWT using jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' }). The token is returned to the client in the login response body. The React application stores the JWT in localStorage and attaches it to all subsequent API requests via an Axios request interceptor that automatically adds the Authorization: Bearer <token> header. On the server, the auth middleware extracts the token from this header, verifies it using jwt.verify(), and attaches the decoded payload to req.user, making the authenticated user's ID and role available to all route handlers in the request pipeline. Passwords are hashed using bcryptjs with a salt rounds value of 10, ensuring that even if the database is compromised, raw passwords cannot be trivially recovered.

5.8 Axios

Axios is a popular promise-based HTTP client for JavaScript, available for both the browser and Node.js. In the MyCircle React application, Axios is configured as a singleton instance in the api.js utility file. This singleton sets the baseURL to the API server's URL (from an environment variable), allowing all API calls throughout the application to use relative paths (e.g., api.get('/posts') rather than specifying the full URL each time). An Axios request interceptor is registered on this instance to automatically attach the Authorization: Bearer <token> header to every outgoing request if a JWT is present in localStorage, eliminating the need to manually include the token in each individual API call. A response interceptor handles 401 Unauthorized responses globally, automatically logging out the user and redirecting them to the login page if their JWT has expired or been invalidated.

5.9 Socket.io

Socket.io is a JavaScript library that enables real-time, bidirectional, event-based communication between clients and servers. It builds on the WebSocket protocol, with automatic fallback to HTTP long-polling for environments where WebSockets are not supported. In MyCircle, Socket.io is used to deliver two categories of real-time events: direct message delivery (a message sent by one user is instantly pushed to the recipient's browser without polling) and notification delivery (when a user follows another user, likes a post, or sends a message, the recipient receives an in-app notification in real time).

The Socket.io server is initialized on the same HTTP server instance as the Express.js application. Upon connection, each authenticated client emits a 'join' event with their user ID, and the server adds their socket to a room named by their user ID. This allows the server to emit targeted events to a specific user's room (e.g., io.to(recipientUserId).emit('new_message', messageData)) without broadcasting to all connected clients. The React frontend connects to the Socket.io server via the SocketContext, which maintains a single socket connection for the authenticated session and exposes it to any component via the useSocket hook.

5.10 Cloudinary

Cloudinary is a cloud-based media management platform that provides services for image and video upload, storage, transformation, optimization, and delivery via a global CDN. In MyCircle, Cloudinary handles all user-generated image assets: profile photographs and opportunity post images. The image upload flow works as follows: the user selects an image in the React UI, which sends a multipart/form-data POST request to the Express.js server. The server uses Multer middleware to receive the file in memory (as a buffer), then calls the Cloudinary SDK's upload_stream() method to upload the buffer to Cloudinary. Cloudinary stores the image, applies automatic optimization (format conversion to WebP for modern browsers, quality compression), and returns a JSON response containing the secure CDN URL of the uploaded image. This URL is then stored in the MongoDB document (profileImage field for users, images array for posts). When the React frontend renders the image, it requests it directly from Cloudinary's global CDN, ensuring fast delivery regardless of the user's geographic location.

5.11 Git & GitHub

Git is a distributed version control system used to track changes in the MyCircle codebase throughout the development process. Every significant feature or bug fix was committed with a descriptive commit message, creating a complete audit trail of the project's evolution. GitHub was used as the remote repository hosting platform, providing a centralized location for the codebase, enabling collaboration, and serving as the deployment trigger for the cloud hosting platform (Render automatically redeploys the server when new commits are pushed to the main branch). The repository is organized as a monorepo containing three sub-directories: mycircleappsuite/server (Express.js backend), mycircleappsuite/web (React frontend), and mycircleappsuite/mobile (React Native mobile app, future scope). Branching was used during development to isolate feature work—for example, a 'feature/map-view' branch was used during the Leaflet map integration to avoid destabilizing the main branch.

CHAPTER 6: IMPLEMENTATION & FEATURE WALKTHROUGH

6.1 User Registration and Authentication

The authentication system is the foundational security layer of MyCircle. The registration flow begins with the Register page, which presents a clean, multi-field form collecting the user's Display Name, Email Address, Password, College Name, and City. Client-side validation is implemented using controlled React components: the email field validates format using a regular expression, the password field enforces a minimum length of 8 characters and provides a real-time strength indicator, and all required fields display inline error messages if submission is attempted while they are empty. The form uses a loading state to disable the submit button and show a spinner while the API call is in progress, preventing duplicate submissions.

Upon form submission, the React component calls api.post('/auth/register', formData). On the server, the auth controller first checks whether a user with the submitted email already exists in the Users collection. If so, it returns a 409 Conflict response. If not, it hashes the password using bcryptjs (await bcrypt.hash(password, 10)) and creates a new User document in MongoDB. The server then immediately issues a JWT so the user is logged in upon successful registration, avoiding the friction of a separate login step. The JWT is stored in the React application's AuthContext state and in localStorage for persistence across browser sessions.

The login flow mirrors the registration flow. The Login page presents a two-field form (email and password). Upon submission, the credentials are sent to POST /api/auth/login. The server retrieves the user by email, uses bcrypt.compare() to verify the password against the stored hash, and returns a signed JWT on success. Protected routes in React are implemented using a ProtectedRoute wrapper component that reads the authentication state from AuthContext and redirects unauthenticated users to the Login page. The Axios instance is configured with a response interceptor that catches 401 Unauthorized responses and automatically clears the stored token and redirects the user to login, handling token expiry gracefully without user confusion.

6.2 Student Profile Page

The Profile page serves as the student's public identity card within the MyCircle community. It displays the user's profile photograph (served from Cloudinary CDN), display name, college, city, biography, account creation date, and reputation metrics (trust score and average rating). The social graph is prominently displayed: follower and following counts are clickable, opening a modal that lists the respective users with their avatars and names. Below the social metrics, the profile displays all opportunity posts authored by the user in a responsive card grid, allowing visitors to quickly assess the user's posting history and community engagement.

The Edit Profile functionality is accessible only to the authenticated profile owner (determined by comparing the URL's userId parameter with the authenticated user's ID from AuthContext). Clicking the Edit button opens an inline edit form or modal that pre-populates all fields with the current profile data. The profile image upload field uses an HTML file input with an accept='image/*' attribute, and upon file selection, the component creates a FormData object containing the image file and the other profile fields, sending it to PUT /api/users/:id with the Content-Type: multipart/form-data header. The server processes the upload through Multer, uploads the image buffer to Cloudinary, and stores the returned CDN URL in the user document.

The follow/unfollow button on another user's profile is implemented as a single toggle button whose visual state (outlined 'Follow' vs. filled 'Following') is derived from whether the authenticated user's ID is present in the viewed profile's followers array. Clicking it calls POST /api/users/:id/follow, which uses a MongoDB $addToSet / $pull operation to atomically add or remove the follower relationship, preventing race conditions. The profile page's follower count and button state update optimistically in the UI without requiring a full page reload.

6.3 Opportunities Feed (Explore Page)

The Explore page is the most complex and feature-rich page in MyCircle. It is organized into two primary view modes: the List View (a responsive card grid of opportunity posts) and the Map View (an interactive Leaflet map with geolocated post markers). A view toggle at the top of the page switches between these two modes. The page also contains a comprehensive filter panel with controls for post type (Job, Service, Sell, Rent), search query (full-text match on title and description), and geographic proximity (a radius filter centered on the user's GPS location).

In List View, opportunities are displayed as PostCard components arranged in a responsive CSS Grid (1 column on mobile, 2 columns on tablet, 3 columns on desktop). Each PostCard shows the post's cover image (or a category emoji placeholder), post type badge, title, author avatar and name, posting date, location, price/budget badge, and a footer with action buttons (AI Insights, Like, Share, Analytics for own posts, and a More/Less toggle for the collapsible details section). The card is designed to be compact by default, showing only the most essential information, with Lifecycle, Budget Tags, and Edit/Delete controls hidden until the user clicks the 'More' chevron button. This collapsible architecture, implemented using Framer Motion's AnimatePresence, keeps the feed scannable and reduces visual clutter.

In Map View, the Leaflet map renders custom pin-shaped markers for each geolocated post. Each marker displays the category emoji and a price badge. Clicking a marker opens a popup with the post title, type badge, price, and a 'View Details' link. A glassmorphism-styled control panel overlaid on the map provides Zoom In/Out buttons, a Recenter button (which flies the map to the user's GPS location), and a Radius Toggle button (which shows/hides a semi-transparent circle indicating the search radius around the user). The map view is an excellent tool for students who want to discover what opportunities are physically close to them in their city.

6.4 Post an Opportunity

The Create Post page presents a multi-section form for creating a new opportunity post. The form is logically organized into sections: Basic Information (Title, Post Type selector, Description), Pricing (Price, Budget Min/Max, Accepts Barter toggle), Details (Duration, Availability, Tags input with comma-separated parsing), Location (a text field for location name plus an optional interactive Leaflet map for pin-pointing coordinates), Images (a multi-file upload field that previews selected images as thumbnails), and Settings (Is Urgent toggle, Expiry Duration). The Post Type selector uses a visual card-style selector where each type (Job, Service, Sell, Rent) is displayed with its emoji and label, and selecting a type highlights the corresponding card with a primary colour border.

Client-side validation ensures that Title, Post Type, and Description are provided before submission. The form uses a FormData object to package both the text fields and image files for transmission to POST /api/posts. On the server, the controller validates all required fields, uploads any provided images to Cloudinary (iterating through the array of file buffers), computes the expiresAt date from the duration value, and inserts the new post document into the Posts collection. Upon successful creation, the user is navigated to the new post's detail page, and a success toast notification confirms the action.

6.5 Campus Events

While a full Events module with dedicated database collection is identified as future scope, the current version of MyCircle supports event-type opportunities through the existing Posts collection with the 'service' or 'job' type. Upcoming iterations will introduce a dedicated Events collection with fields for event date, venue, organizer, and registration link. In the current version, students post campus events as opportunity cards with the relevant details in the description field and use tags to categorize the content as an event. The map view and proximity filter remain applicable, allowing students to discover events happening near their location.

6.6 Study Groups

Similar to Events, the Study Groups feature is identified as a future scope enhancement in the current version. Students currently leverage the Direct Messaging and the Requests system to form informal study collaborations. A dedicated Study Groups module—with its own collection, group creation form, member management, and group chat—is documented in Chapter 10 as a prioritized future enhancement. The architectural groundwork (Socket.io real-time layer, conversation infrastructure) is already in place to support group chat implementation.

6.7 Follow / Unfollow System

The social graph in MyCircle is built on a straightforward follow/unfollow mechanism. When Student A follows Student B, A's user document gains B's ObjectId in its 'following' array, and B's user document gains A's ObjectId in its 'followers' array. This bidirectional update is performed atomically using MongoDB's $addToSet operator (to prevent duplicate entries) in a single findByIdAndUpdate call per user document. The unfollow action uses $pull to remove the ObjectId from both arrays. Following another student does not require the followed user's approval—it is a one-directional follow model (similar to Twitter/Instagram) rather than a mutual-connection model (like LinkedIn). This design choice enables open content discovery: a student can follow any other student's posts without requiring reciprocation, encouraging broader community engagement.

The follow action also triggers a notification. When A follows B, the Notification controller creates a new document in the Notifications collection with type 'follow', recipient B, and sender A. The Socket.io server then emits a 'new_notification' event to B's socket room, causing B's notification bell to update in real-time without any polling.

6.8 Notifications

The Notifications system in MyCircle provides in-app, real-time alerts for user events. The notification bell icon in the navigation bar displays a badge with the count of unread notifications. Clicking the bell opens a dropdown panel listing the most recent notifications, each with an icon corresponding to its type (heart for like, user-plus for follow, message-circle for message, sparkles for AI insight), a descriptive text message, the sender's avatar, and the time elapsed since the notification was created. Clicking a notification marks it as read and navigates to the relevant content (the post that was liked, the profile of the new follower, etc.).

Notifications are generated on the server by the Notification service module, which is called by the relevant controllers (Posts controller for like/share events, Users controller for follow events, Conversations controller for message events). Each notification is persisted in MongoDB and simultaneously emitted to the recipient's Socket.io room. The frontend Socket context listens for 'new_notification' events and updates the notification count and list in real-time. The 'Mark All as Read' button calls PATCH /api/notifications/read-all, which uses a MongoDB updateMany() to set isRead: true on all notifications for the authenticated user.

6.9 Messaging

The messaging system in MyCircle enables one-on-one direct communication between students. A conversation is typically initiated from a post's detail page, where an interested student clicks 'Send Message' or 'Request', which creates a Conversation document linking the two users and the related post. The Messages page displays a list of all the authenticated user's conversations, each showing the other participant's avatar, name, the last message preview, and the time of the last message. Unread conversations are visually distinguished with a bold last-message preview and a coloured dot indicator.

The ChatWindow component renders the full conversation thread in a scrollable container, with messages from the authenticated user aligned to the right (in the primary colour bubble) and messages from the other participant aligned to the left (in a neutral card-coloured bubble). The message input at the bottom is a resizable textarea with a Send button. When the user sends a message, the component calls POST /api/conversations/:id/messages, which saves the message to MongoDB and emits a 'new_message' Socket.io event to the recipient's room. The recipient's ChatWindow (if open) receives the event and appends the new message to the thread in real-time. Read receipts are implemented: when a user opens a conversation, all messages from the other participant are marked as read via a PATCH request.

6.10 Admin Panel

The Admin Panel is accessible only to users with the 'admin' role, enforced by both the frontend ProtectedRoute (which checks the role from AuthContext) and the backend admin middleware (which verifies the role from the JWT payload). The Admin Dashboard presents a statistics overview: total registered users, total active posts, total conversations, and a trend indicator showing growth since the previous period. Below the statistics, the dashboard provides two management tabs: User Management and Post Management.

The User Management tab displays a paginated table of all registered users, with columns for avatar, name, email, college, role, registration date, and account status (active/deactivated). Each row has action buttons for Deactivate/Reactivate (which toggles the user's isActive flag, preventing login without deleting the account) and Delete (which permanently removes the user document). The Post Management tab displays a paginated table of all posts with columns for title, type, author, creation date, status, and view/like/share counts. Administrators can delete any post directly from this table. These moderation capabilities ensure that the platform remains free of spam, inappropriate content, and policy-violating posts, maintaining a safe and constructive community environment.

CHAPTER 7: TESTING

7.1 Testing Strategy

A comprehensive testing strategy was employed throughout the development of MyCircle to ensure the correctness, security, performance, and usability of all system components. The testing approach encompasses four levels: Unit Testing (verifying individual functions and modules in isolation), Integration Testing (verifying that modules interact correctly), System Testing (verifying the complete system against functional requirements), and User Acceptance Testing (verifying that the system meets the real-world needs of student users). Given the full-stack nature of the application, testing was performed on both the backend API layer and the frontend React layer, using a combination of automated tools (Postman, Jest concepts) and systematic manual testing procedures.

The testing lifecycle was integrated into the development workflow rather than treated as a separate post-development phase. API endpoints were tested with Postman immediately after implementation, before the corresponding frontend UI was built. Frontend components were tested in the browser's developer console and React DevTools as they were built. Security testing was performed before deployment. Performance benchmarks were measured after the initial deployment on the cloud platform. User Acceptance Testing was conducted with a small group of real student users after the platform reached a feature-complete state.

7.2 Unit Testing

Unit testing in MyCircle focused on verifying the correctness of individual utility functions and business logic modules. The bcrypt password hashing and verification cycle was tested by generating a hash for a known password and verifying that bcrypt.compare() returns true for the correct password and false for an incorrect one. The JWT generation and verification functions were tested by signing a payload and verifying that jwt.verify() correctly decodes the payload with the correct secret and throws a JsonWebTokenError with an incorrect secret. The formatMoney() utility function in the frontend was tested against edge cases: zero values (should return null), non-numeric inputs (should return null), and valid numeric inputs (should return the correctly formatted currency string). The lifecycleMeta computation (which calculates percentage of post lifetime remaining, the lifecycle stage label, and colour class) was tested against posts with various expiresAt values relative to the current date, including expired posts, nearly-expired posts, and fresh posts.

7.3 API Testing

API testing was performed using Postman, an industry-standard API development and testing tool. A Postman Collection named 'MyCircle API' was created containing all API endpoints organized into folders by resource (Auth, Users, Posts, Conversations, Notifications, Requests, Admin). Environment variables were configured in Postman for the base URL and the JWT token (populated automatically from the login response using a Postman test script: pm.environment.set('token', pm.response.json().token)). The following table documents a representative set of API test cases with their inputs, expected outputs, and results.

7.4 Frontend Testing

Frontend testing was conducted through systematic manual testing in Google Chrome (primary) and Mozilla Firefox (secondary), using the browser's built-in Developer Tools for debugging. The React Developer Tools browser extension was used to inspect component state, context values, and the component tree hierarchy. The following aspects of the frontend were systematically tested: (1) Form Validation — all forms (Register, Login, Create Post, Edit Profile) were tested with empty required fields, invalid email formats, passwords below the minimum length, and successful valid submissions to verify that validation messages appear and disappear correctly. (2) Responsive Layout — all pages were tested at multiple viewport widths (320px, 375px, 768px, 1024px, 1440px) using Chrome DevTools' device simulation mode, verifying that the responsive grid, navigation, and card layouts adapt correctly. (3) Navigation — all routes were tested for correct rendering, and protected routes were verified to redirect unauthenticated users to the Login page. (4) Toast Notifications — all success and error toast notifications were verified to appear with the correct message and dismiss automatically after the configured duration.

7.5 Security Testing

Security testing focused on four key areas. First, JWT token expiry was tested by manually modifying the JWT_EXPIRES_IN environment variable to a very short duration (30 seconds), logging in, waiting for expiry, and then attempting an authenticated API call. The Axios interceptor correctly caught the 401 response and redirected the user to the Login page. Second, unauthorized route access was tested by attempting to access protected API endpoints (POST /posts, GET /admin/stats) without an Authorization header, with an invalid token, and with an expired token—all correctly returned 401 or 403 responses. Third, NoSQL injection prevention was tested by submitting JSON injection payloads (e.g., { '$gt': '' } as the email field in the login request). Mongoose's type casting and validation correctly rejected these inputs before they reached the database query layer. Fourth, CORS policy was verified by making API requests from an origin not in the allowedOrigins list (simulated using a simple HTML file opened via file:// protocol), which was correctly blocked by the CORS middleware.

7.6 Performance Testing

Performance testing was conducted after deployment to the cloud hosting platform. Page load time was measured using Chrome DevTools' Network panel and the Lighthouse performance auditing tool. The initial page load (including React bundle download, parse, and first render) measured approximately 1.8 seconds on a standard broadband connection—well within the 3-second target defined in the non-functional requirements. Subsequent navigation between pages (client-side routing) was near-instantaneous (<100ms) due to the SPA architecture. API response times were measured using Postman's response time display: the GET /posts endpoint returned responses in 180–350ms for a dataset of 500 posts, which is within acceptable bounds for the development deployment tier. MongoDB Atlas query performance was monitored using the Atlas Performance Advisor, which confirmed that the indexes on email (Users collection) and the compound index on type+coordinates (Posts collection) were being effectively used by the most frequent query patterns.

7.7 User Acceptance Testing (UAT)

User Acceptance Testing was conducted with a group of 5 volunteer student participants recruited from the MCA and BCA programmes at GGU, Bilaspur. Each participant was given a brief introduction to MyCircle's purpose (without a detailed feature walkthrough) and asked to complete a set of predefined tasks: (1) Register a new account and set up a profile with a photo; (2) Create a new opportunity post (of any type); (3) Find an opportunity posted by another participant using the search and filter; (4) Send a message to another participant; (5) Follow another participant and check their profile. Participants completed these tasks while the developer observed, noting points of confusion, errors encountered, and time taken for each task.

Key findings from the UAT session included: (1) All 5 participants successfully completed Registration and Profile Setup, with an average time of 3.2 minutes. (2) 4 of 5 participants successfully created an opportunity post; 1 participant was initially confused by the 'Post Type' selector and required a brief explanation. (3) All participants successfully found opportunities using the search bar; the filter panel was used by 3 of 5 participants. (4) All participants successfully sent a message after a brief exploration of the Messages page. (5) All participants successfully followed another user. Post-session feedback highlighted two UI improvements that were subsequently implemented: adding a tooltip to the Post Type selector explaining each category, and making the 'More' collapse button on PostCards more visually prominent.

7.8 Bug Report Table

The following table documents bugs identified and resolved during the development and testing phases of MyCircle.

CHAPTER 8: SCREENSHOTS / UI WALKTHROUGH

Note to the student: Replace each [Screenshot Placeholder] section below with an actual screenshot captured from the running MyCircle application. Screenshots should be captured at 1280×800 resolution or higher and inserted as inline images in the final Word document. Each screenshot should be labelled with the figure number and caption as specified.

8.1 Login / Registration Page

[Figure 8.1 — Screenshot Placeholder: Login / Registration Page]

The Login and Registration page is the first screen that any visitor to MyCircle encounters. The layout features a split-panel design: the left half displays a visually rich hero panel with the MyCircle brand mark, a compelling tagline ('Your campus. Your circle. Your opportunities.'), and an abstract background gradient that reflects the platform's primary colour palette (deep indigo with accent violet tones). The right half contains the authentication form, which toggles between Login and Register modes via a tab interface. The Register form collects Display Name, Email, Password (with a real-time strength indicator bar), College Name, and City. The Login form shows Email and Password fields with a 'Forgot Password' link. Both forms feature a prominent primary-coloured CTA button, inline validation error messages rendered in red below each invalid field, and a loading spinner state that activates while the API call is in progress. The overall visual treatment—rounded input corners, subtle drop shadows, smooth tab transition animation—establishes the premium, modern aesthetic maintained throughout the application.

8.2 Home / Opportunity Feed (Explore Page — List View)

[Figure 8.2 — Screenshot Placeholder: Explore Page — List View]

The Explore page in List View presents the opportunity feed as a responsive card grid. At the top, a sticky search and filter bar contains a search input with a magnifying glass icon, a row of pill-shaped post type filter buttons (All, Jobs, Services, Sell, Rent), and a Filters toggle button that expands an advanced filter panel. The List/Map view toggle appears at the top right. Below the filter bar, opportunity PostCards are arranged in a 3-column grid on desktop. Each card displays a cover image (or category emoji on a gradient background for image-less posts), a type badge in the top-left of the image, a price badge in the bottom-right of the image, the post title in bold, the author's avatar and name, the posting date and location, and a compact footer with Like, Share, AI Insights, and More/Less toggle buttons. The collapsed card state keeps the feed compact; clicking 'More' smoothly expands the card to reveal Budget Tags, Lifecycle Progress, and (for own posts) Edit/Delete buttons. The visual hierarchy is clean, with the post title as the dominant typographic element and the footer buttons using muted tones that lighten on hover.

8.3 Map View (Explore Page — Map View)

[Figure 8.3 — Screenshot Placeholder: Explore Page — Map View]

The Map View mode of the Explore page renders an interactive Leaflet map occupying the full content area below the filter bar. The map uses OpenStreetMap tiles and is centred on the user's current GPS location (indicated by a pulsing blue dot with a radiating animation circle). Opportunity posts with GPS coordinates are rendered as custom pin-shaped markers: each marker has a teardrop shape filled with the category's accent colour, an emoji icon representing the post type (briefcase for jobs, wrench for services, tag for sell, house for rent), and a small price badge at the top-right. A glassmorphism-styled floating control panel in the bottom-right corner of the map contains three icon buttons: Zoom In (+), Zoom Out (−), and Recenter (target crosshair icon), plus a Radius Toggle (sparkles icon) that overlays a translucent circle showing the search radius. Clicking a marker opens a card-style popup with the post title, type badge, price, and a 'View Details' link that navigates to the full PostDetails page.

8.4 Student Profile Page

[Figure 8.4 — Screenshot Placeholder: Student Profile Page]

The Profile page is organized into two sections. The upper hero section spans the full width and features a gradient banner background, the user's circular profile photo (with a camera icon overlay for upload on the own profile), display name in large bold text, college and city below the name, and a row of social metrics (X Followers, X Following, X Posts) that are clickable to open the respective modal lists. For the authenticated user viewing their own profile, an 'Edit Profile' button appears; for other users, a Follow/Unfollow button appears in its place. The reputation badges (Trust Score and Average Rating) appear as small coloured chips below the social metrics. The lower section contains a grid of PostCards displaying all posts authored by the profile user, using the same compact, collapsible card design as the Explore feed. On mobile, the hero section stacks vertically and the card grid collapses to a single column.

8.5 Create / Edit Post Form

[Figure 8.5 — Screenshot Placeholder: Create Post Form]

The Create Post form page presents a clean, card-contained multi-section form with a sticky header showing the form title ('Create New Post') and a progress indicator. The Post Type selector appears as four visual cards arranged in a 2×2 grid, each with a large emoji, type label, and brief description; the selected type receives a primary-colour border and background highlight. Below the type selector, form fields are organized in logical groups with clear section labels: Basic Info (Title, Description), Pricing (Price, Budget Range with dual sliders for Min and Max, Accepts Barter toggle), Details (Duration in days, Availability, Tags with comma-separated input that renders tags as pill badges), Location (text field plus a compact embedded Leaflet map for coordinate selection), and Images (a drag-and-drop file upload zone that renders selected images as thumbnail previews with remove buttons). The form footer contains a Cancel button and a primary 'Publish Post' CTA button. All validation errors render as red helper text below the relevant field.

8.6 Messaging Interface

[Figure 8.6 — Screenshot Placeholder: Messages Page]

The Messages page uses a classic two-panel layout on desktop: the left panel lists all conversations, and the right panel shows the active chat thread. The conversations list displays each conversation as a row containing the other participant's avatar, display name, last message preview text, and last message timestamp. Conversations with unread messages are visually highlighted with a bold last-message preview and a small primary-coloured unread count badge. The right panel (ChatWindow) shows the conversation header (participant avatar, name, and a link to their profile), the scrollable message thread, and the message input area. Messages from the authenticated user appear on the right side in primary-coloured rounded bubbles; messages from the other participant appear on the left in card-coloured bubbles. System messages (e.g., 'Request approved — conversation started') appear centred in muted italic text. The message input is a textarea that auto-expands up to three lines, with a Send button (paper plane icon) that activates when the input is non-empty.

8.7 Admin Dashboard

[Figure 8.7 — Screenshot Placeholder: Admin Dashboard]

The Admin Dashboard is accessible exclusively to administrator accounts and presents a governance-focused interface. The page header clearly identifies the context with an 'Admin Panel' title and shield icon. Below the header, a statistics row displays four metric cards: Total Users (with a trend percentage vs. last week), Total Posts, Total Active Conversations, and Total Notifications Sent. Each metric card uses an icon, a large number in the primary font size, and a subtle background colour differentiated by metric type. Below the stats, two tabbed management tables are presented. The Users tab shows a searchable, paginated table with columns for avatar, user name, email, role badge (Admin or User), registration date, account status (Active/Inactive), and action buttons (Deactivate, Delete). The Posts tab shows a similar table with post title, type badge, author, creation date, status, and view/like counts, with a Delete action button. Each table supports search and sorting by relevant columns.

CHAPTER 9: LIMITATIONS

9.1 Current Technical Limitations

The most immediately apparent technical limitation of the current version of MyCircle is the absence of a dedicated mobile application. While the web application is fully responsive and functional on mobile browsers, a native or cross-platform mobile app (built using React Native, for example) would provide a significantly superior mobile user experience through device-native UI patterns, push notification support via Firebase Cloud Messaging, offline caching, camera and gallery integration for post image uploads, and access to the device's GPS without requiring browser permission prompts. The current mobile web experience, while functional, cannot fully replicate these capabilities.

A second technical limitation is the recommendation and content discovery algorithm. The current Explore feed displays posts in reverse-chronological order (most recent first), with no personalization based on the user's interests, follow graph, or browsing history. A machine learning-based recommendation engine—using collaborative filtering (recommending posts liked by users similar to the current user) or content-based filtering (recommending posts with tags similar to posts the user has interacted with)—would substantially improve the relevance of the feed. Implementing such a system would require a data pipeline for collecting interaction events, a model training environment, and a serving infrastructure for real-time recommendations, all of which are beyond the scope of the current Minor Project.

The full-text search capability in the current version is limited to basic MongoDB regex pattern matching on the title and description fields. This approach is inefficient for large datasets (regex queries cannot use standard MongoDB indexes) and does not support fuzzy matching, synonym expansion, or relevance-scored results. A production-grade search experience would require integration with a dedicated search engine such as Elasticsearch or MongoDB Atlas Search, which provides inverted-index-based full-text search with relevance ranking, autocomplete, and typo tolerance.

The JWT authentication tokens in the current implementation are stored in the browser's localStorage. While this is a common practice in SPAs, it creates a vulnerability to Cross-Site Scripting (XSS) attacks: if a malicious script is somehow injected into the page, it can read the localStorage token. The more secure alternative—storing the JWT in an HttpOnly cookie that JavaScript cannot access—is identified as a prioritized security enhancement for a future version. Additionally, token refresh logic (automatically issuing a new short-lived token before the current one expires, using a longer-lived refresh token) is not implemented in the current version, meaning users must re-login every 7 days.

9.2 Platform / Deployment Limitations

MyCircle is currently deployed on Render's free tier, which introduces a significant operational constraint: the server process spins down after 15 minutes of inactivity, and the first request after a spin-down incurs a 30–60 second cold start delay while the container reinitializes. For a production platform serving real users, this cold start latency is unacceptable—a user attempting to log in during a cold start would experience a 30+ second wait with no feedback. Resolving this requires upgrading to a paid hosting plan that keeps the server always-on, or implementing a 'keep-alive' ping mechanism (a scheduled request every 10 minutes to prevent spin-down).

The MongoDB Atlas free tier (M0 cluster) provides 512 MB of storage, which is sufficient for development and initial testing but will become a constraint as the platform grows. With an average post document size of approximately 2KB (including embedded image URLs and arrays), the free tier can accommodate approximately 256,000 posts before storage is exhausted. Scaling beyond the free tier requires upgrading to a paid Atlas cluster (M10 or above), which introduces monthly infrastructure costs. Similarly, Cloudinary's free tier provides 25 GB of storage and 25 GB of bandwidth per month—sufficient for a small pilot but limiting for a larger student community.

9.3 Business and Scope Limitations

The current version of MyCircle is designed as a single-community platform: all users can see all posts regardless of their college or city (with geographic filtering available but not enforced). While this open design maximizes content availability during the initial launch phase, it is architecturally incompatible with a multi-college, institution-specific community model where students at College A see a distinct feed from students at College B. Implementing true community isolation would require a community/tenant data model with institution-specific feeds and privacy boundaries, which represents a significant architectural enhancement beyond the current scope.

The platform currently lacks a payment infrastructure, which limits the potential for premium listing features, sponsored opportunities from local businesses, and a subscription model for advanced student profiles. Integrating a payment gateway (such as Razorpay or Stripe) for the Indian market would require PCI-DSS compliance considerations, KYC verification for business accounts, and significant additional development effort. Finally, content moderation in the current version is entirely manual—administrators must proactively review reported posts and user complaints. An automated content moderation layer (using ML-based content classification or keyword filtering) would significantly reduce the administrative burden as the platform scales.

9.4 Security Limitations

As noted in Section 9.1, the JWT storage in localStorage represents a potential XSS vulnerability. While MyCircle's React codebase does not use dangerouslySetInnerHTML or any mechanism that would allow XSS injection in the current implementation, a dependency vulnerability or future code change could introduce this risk. Migrating to HttpOnly cookie-based token storage is a security best practice that should be implemented before large-scale public deployment.

Two-Factor Authentication (2FA) is not implemented in the current version. For a platform dealing with student academic and personal information, 2FA via SMS OTP or TOTP (Time-based One-Time Password, e.g., Google Authenticator) would significantly strengthen account security against credential theft. Email verification upon registration is also absent—users can register with any email address without verifying ownership, which opens the platform to spam account creation and reduces the trustworthiness of user profiles. Both 2FA and email verification are prioritized security enhancements for the next version.

Rate limiting is partially implemented via the Express application but is not comprehensively enforced on all endpoints. The authentication endpoints (login, register) are the most critical targets for rate limiting to prevent brute-force attacks. A production deployment should use a dedicated rate-limiting middleware (express-rate-limit) with a Redis-backed store for accurate rate tracking across multiple server instances, combined with CAPTCHA verification on the registration and login forms after a threshold number of failed attempts.

CHAPTER 10: FUTURE SCOPE

MyCircle, in its current form, represents a solid and functional Minimum Viable Product (MVP) that delivers genuine value to its target user community. However, the platform's architecture has been designed with extensibility in mind, and numerous enhancement opportunities have been identified during the development and testing phases. This chapter outlines the most impactful future developments, organized by their potential impact on user experience, platform scale, and business sustainability.

10.1 AI-Powered Opportunity Recommendations

The most impactful user-experience enhancement for the next version of MyCircle is the implementation of a personalized content recommendation engine. Currently, the Explore feed sorts posts by recency, presenting the same content ordering to all users. A machine learning-based recommendation system would analyse each user's interaction history (posts viewed, liked, shared, requested, and bookmarked), their profile attributes (college, city, skills listed in bio), and their social graph (the posting patterns of users they follow) to generate a personalized feed ranking that surfaces the most relevant opportunities at the top.

The recommended approach is a hybrid recommendation system combining collaborative filtering (recommending opportunities that users with similar interaction patterns have engaged with) and content-based filtering (recommending posts with tags and types similar to those the current user has previously engaged with). The data pipeline would capture interaction events (view, like, share, request) as clickstream data, store them in a time-series collection, and periodically retrain a lightweight recommendation model (potentially using matrix factorization or a neural collaborative filtering approach). The model's outputs would be pre-computed recommendation vectors for each user, stored in Redis for low-latency retrieval during feed generation. An A/B testing framework would measure the recommendation system's impact on key engagement metrics (click-through rate, time-on-site, return visit rate).

10.2 Mobile Application (React Native)

A cross-platform mobile application built with React Native is the highest-priority feature request from the UAT participants. React Native allows the development of a single JavaScript codebase that compiles to native iOS and Android applications, leveraging the same React component paradigm and business logic already used in the web frontend. The MyCircle mobile app would provide the full feature set of the web application, enhanced by mobile-native capabilities: push notifications via Firebase Cloud Messaging (FCM) for real-time message and notification delivery even when the app is in the background; native camera and gallery integration for frictionless profile photo and post image upload; Expo Location API for seamless GPS access without browser permission prompts; and offline caching of the opportunity feed for browsing without internet connectivity.

The development strategy would be to first extract the business logic (API calls, data transformations, validation) from the web frontend into a shared library (using a monorepo structure with Turborepo or Nx), then build the React Native UI components that consume this shared logic. The existing Express.js API server and MongoDB database require no changes for mobile support—the mobile app would use the same REST API endpoints, authenticating with the same JWT mechanism.

10.3 Multi-College Network Expansion

Scaling MyCircle from a single-community platform to a verified multi-college network is the most architecturally significant future enhancement. The multi-college model would introduce the concept of a 'Circle'—an institution-specific community space with its own feed, members list, and admin. Students would verify their institutional affiliation by registering with their college-issued email address (e.g., @ggu.ac.in) and completing an email verification step. Each college would have its own designated Circle Admin role, responsible for moderating content and managing membership within their institution's circle.

The feed architecture would be extended to provide both a Global Feed (showing opportunities from all colleges in the student's city) and a My Circle Feed (showing opportunities exclusively from the student's institution). Inter-college opportunity discovery would be facilitated through city-level and interest-tag-level browsing, while maintaining the privacy boundary between institution-specific community discussions. This multi-college expansion represents MyCircle's path from a single-campus prototype to a nationally scalable student community platform.

10.4 Advanced Search with Elasticsearch / Atlas Search

The current string-matching search is replaced in the future version with full-text search powered by MongoDB Atlas Search (built on Apache Lucene), which provides inverted-index-based full-text search, relevance scoring, typo tolerance (fuzzy matching), autocomplete suggestions, and faceted search filtering. The Atlas Search integration requires creating a Search Index on the Posts collection (specifying which fields—title, description, tags—to index) and replacing the current regex-based query with an aggregation pipeline using the $search stage. The frontend search UI would be enhanced with an autocomplete dropdown showing suggested search terms as the user types, powered by the Atlas Search autocomplete analyzer.

10.5 Blockchain-Based Profile Verification

A longer-term vision for MyCircle involves leveraging blockchain technology to provide tamper-proof verification of student academic credentials. In this model, universities would issue digitally signed credential tokens (degree certificates, grade transcripts, course completion badges) on a public or consortium blockchain. Students could import these credentials into their MyCircle profile, where they would be displayed as verified badges. Potential employers or collaborators could verify the authenticity of a student's academic claims by querying the blockchain, without needing to contact the institution directly. Technologies such as the Ethereum blockchain with ERC-721 NFT-based credential tokens, or Hyperledger Fabric for a permissioned consortium chain among partner universities, represent viable implementation paths for this feature.

10.6 Gamification

Introducing gamification mechanics to MyCircle would significantly increase user engagement and reward positive community contributions. The proposed gamification system would assign points for specific user actions: posting a high-quality opportunity (verified by engagement metrics), successfully helping another student (evidenced by a positive review after a request is completed), receiving followers, having posts liked and shared, and contributing to community discussions. Points would accumulate into a visible 'Contribution Score' displayed on the user profile. Users who reach specific point thresholds would unlock digital badges (e.g., 'Top Contributor', 'Community Builder', 'Opportunity Magnet') displayed prominently on their profile. A college-level leaderboard would rank students by their contribution scores, creating healthy competition and social recognition that motivates sustained engagement.

10.7 Analytics Dashboard for Students

In the current version, post analytics (views, likes, shares, days active) are available only to post owners via the Analytics button on the PostCard. A dedicated Analytics Dashboard page would aggregate these metrics across all of the student's posts and profile, providing comprehensive insights into their community impact. The dashboard would display: total profile views over time (line chart), post performance comparison (bar chart comparing views and likes across all active posts), follower growth trend, and geographic distribution of viewers (map visualization). For students using MyCircle to market freelance services or promote events, these analytics would provide actionable insights into the reach and engagement of their postings.

10.8 Mentorship Module

A Mentorship Module would formalize the informal peer-learning relationships that students naturally seek to establish through the platform. Senior students and recent alumni could list themselves as available mentors in specific subjects, technologies, or career domains. Junior students could browse the mentor directory and book one-on-one video call or in-person meeting sessions using an integrated scheduling interface (similar to Calendly). After a mentorship session, both parties could leave ratings and reviews. The module would track mentorship hours as a community contribution metric, rewarding mentors with contribution score points and 'Mentor' badges. This transforms MyCircle from a purely opportunity-discovery platform into a comprehensive student development ecosystem.

10.9 Premium Features and Monetization

While MyCircle's core features are designed to remain free for all student users, a sustainable business model is essential for long-term platform operation and growth. The proposed monetization strategy has two primary revenue streams. First, Featured Listings: local businesses, startups, and companies seeking to recruit campus talent could pay a small fee to have their opportunity posts featured at the top of the Explore feed for a specified duration, clearly labelled as 'Sponsored' to maintain transparency with the student community. Second, Premium Student Profiles: a subscription tier (MyCircle Pro) could offer advanced features such as unlimited post images, priority placement in search results, direct analytics exports, and access to the full recruiter contact list. These revenue streams would fund infrastructure costs, development resources, and community management, ensuring the platform's sustainability without compromising the free core experience.

CHAPTER 11: CONCLUSION

11.1 Summary of the Project

MyCircle is a full-stack web application built on the MERN technology stack—MongoDB, Express.js, React.js, and Node.js—that addresses the chronic absence of a centralized, community-specific, and locally focused digital platform for students in Indian colleges and universities. The platform enables students to create verified profiles, post and discover opportunities across four categories (jobs, services, sell, and rent), connect socially through a follow/unfollow system, communicate via real-time direct messaging, and receive instant in-app notifications for community interactions. A map-based spatial exploration mode powered by Leaflet.js and the browser Geolocation API provides an intuitive geographic discovery experience unique among student platforms. The AI Insights module offers intelligent, context-aware analysis of opportunity posts, adding a layer of intelligent assistance not found in any comparable local student platform. A role-based admin panel provides platform governance and content moderation capabilities. The application is deployed on a cloud infrastructure (Render for the API server, MongoDB Atlas for the database, Cloudinary for media storage) and has been validated through comprehensive API testing, frontend testing, security testing, performance measurement, and User Acceptance Testing with real student participants.

11.2 Learning Outcomes

The development of MyCircle has been an exceptionally rich educational experience, consolidating and extending the theoretical knowledge gained throughout the MCA curriculum at Guru Ghasidas Vishwavidyalaya into a practical, production-deployed full-stack application. The key learning outcomes include: a deep understanding of RESTful API design principles and their implementation in Express.js, including middleware architecture, route organization, controller patterns, and error handling; hands-on proficiency with MongoDB document modelling and Mongoose ODM, including schema design, indexing, aggregation pipelines, and the trade-offs between embedding and referencing in a document database; practical experience with JWT-based stateless authentication, bcrypt password hashing, and the security considerations of web application development; mastery of React.js component architecture, the Hooks API, Context API for global state management, and React Router for client-side navigation; experience with Vite as a modern build tool, understanding its development-server and production-build pipeline; proficiency with Socket.io for building real-time, event-driven features such as chat and live notifications; experience with cloud platform deployment (Render, MongoDB Atlas, Cloudinary) and the operational considerations of managing a live web application; and the practical application of software engineering principles—modular architecture, iterative development, version control with Git, and user-centric testing—in the context of a real project with real users.

11.3 Impact

MyCircle has the potential to make a meaningful and measurable positive impact on the academic and professional development of students in local college communities. By providing a structured, searchable, and community-specific platform for opportunity discovery, it reduces the information asymmetry that currently causes students to miss out on relevant internships, gigs, and collaborative projects simply because they were not in the right WhatsApp group at the right time. By enabling peer-to-peer follow connections and direct messaging, it facilitates the organic formation of study groups, project collaborations, and mentoring relationships that would otherwise be constrained by the limits of informal social networks. By providing post analytics and AI insights, it empowers student opportunity-posters to understand their community's response to their offerings and improve the quality and relevance of their posts. The map-based discovery feature is particularly impactful for students in cities where public transport and walkability make geographic proximity a critical factor in opportunity feasibility.

11.4 Closing Statement

MyCircle represents more than the sum of its technical components. It is a demonstration that technology, thoughtfully designed and diligently implemented, can solve real problems faced by real communities—in this case, the student communities of India's vast and underserved tier-2 and tier-3 academic institutions. The skills, experiences, and lessons learned during its development form an invaluable foundation for a career in software engineering, and the platform itself stands as a testament to what a determined and resourceful MCA student can build. The developer is committed to continuing the platform's evolution beyond the academic context, incorporating the future enhancements documented in Chapter 10 and working towards a version of MyCircle that can genuinely serve the student communities of Bilaspur, Chhattisgarh, and ultimately, student communities across India.

REFERENCES

[1]  MongoDB, Inc. (2024). MongoDB Documentation. Retrieved from https://www.mongodb.com/docs

[2]  OpenJS Foundation. (2024). Express.js Documentation. Retrieved from https://expressjs.com

[3]  Meta Open Source. (2024). React.js Official Documentation. Retrieved from https://react.dev

[4]  OpenJS Foundation. (2024). Node.js Documentation. Retrieved from https://nodejs.org/en/docs

[5]  Evan You & Vite Contributors. (2024). Vite Official Guide. Retrieved from https://vitejs.dev/guide

[6]  Tailwind Labs. (2024). Tailwind CSS Documentation. Retrieved from https://tailwindcss.com/docs

[7]  Auth0. (2024). Introduction to JSON Web Tokens. Retrieved from https://jwt.io/introduction

[8]  Mozilla Foundation. (2024). MDN Web Docs — JavaScript Reference. Retrieved from https://developer.mozilla.org

[9]  Cloudinary. (2024). Cloudinary Developer Documentation. Retrieved from https://cloudinary.com/documentation

[10]  Socket.io Contributors. (2024). Socket.io Documentation v4. Retrieved from https://socket.io/docs/v4

[11]  Mongoose Contributors. (2024). Mongoose ODM Documentation. Retrieved from https://mongoosejs.com/docs

[12]  Postman, Inc. (2024). Postman Learning Center. Retrieved from https://learning.postman.com

[13]  W3Schools. (2024). Web Development Reference. Retrieved from https://www.w3schools.com

[14]  Stack Overflow. (2024). Community Q&A Platform. Retrieved from https://stackoverflow.com

[15]  GitHub, Inc. (2024). GitHub Documentation — Version Control and Deployment. Retrieved from https://docs.github.com

[16]  Framer. (2024). Framer Motion Documentation. Retrieved from https://www.framer.com/motion

[17]  Agafonkin, V. (2024). Leaflet.js Documentation. Retrieved from https://leafletjs.com/reference

[18]  React Training. (2024). React Router v6 Documentation. Retrieved from https://reactrouter.com

[19]  npm, Inc. (2024). npm Package Registry. Retrieved from https://www.npmjs.com

[20]  Render. (2024). Render Cloud Deployment Documentation. Retrieved from https://render.com/docs

[21]  Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). Database System Concepts (7th ed.). McGraw-Hill Education.

[22]  Pressman, R. S. & Maxim, B. R. (2019). Software Engineering: A Practitioner's Approach (9th ed.). McGraw-Hill Education.

| Abbreviation | Full Form |
| --- | --- |
| API | Application Programming Interface |
| MERN | MongoDB, Express.js, React.js, Node.js |
| JWT | JSON Web Token |
| REST | Representational State Transfer |
| CRUD | Create, Read, Update, Delete |
| UI | User Interface |
| UX | User Experience |
| HTTP | HyperText Transfer Protocol |
| HTTPS | HyperText Transfer Protocol Secure |
| DB | Database |
| JSON | JavaScript Object Notation |
| CORS | Cross-Origin Resource Sharing |
| SPA | Single Page Application |
| CDN | Content Delivery Network |
| MVC | Model-View-Controller |
| RBAC | Role-Based Access Control |
| ODM | Object Document Mapper |
| ORM | Object Relational Mapper |
| HMR | Hot Module Replacement |
| ESM | ECMAScript Modules |
| FCM | Firebase Cloud Messaging |
| UAT | User Acceptance Testing |
| DFD | Data Flow Diagram |
| ER | Entity Relationship |
| MCA | Master of Computer Applications |
| GGU | Guru Ghasidas Vishwavidyalaya |
| XSS | Cross-Site Scripting |
| 2FA | Two-Factor Authentication |
| ML | Machine Learning |
| URL | Uniform Resource Locator |

| Criteria | LinkedIn | Internshala | WhatsApp Groups | College Portals | MyCircle |
| --- | --- | --- | --- | --- | --- |
| Target Audience | Working Professionals | Students (formal internships) | Any group member | Enrolled students only | Local college students |
| Hyperlocal Focus | No | Partial | No (group-dependent) | No | Yes (city/college-level) |
| Opportunity Posting | Yes (formal jobs) | Yes (internships/jobs) | Informal | No | Yes (multi-category) |
| Peer Follow System | Yes (Connect) | No | No | No | Yes |
| Real-time Messaging | Yes (InMail, paid) | No | Yes | No | Yes (free) |
| Event Management | No | No | No | Limited | Yes |
| Verified Student Profiles | No | No | No | Yes (admin) | Yes (self-declared) |
| Map-Based Discovery | No | No | No | No | Yes (Leaflet.js) |
| Cost to Student | Free/Paid | Free | Free | Free | Free |

| Component | Development Machine (Minimum) | Production Server (Cloud) |
| --- | --- | --- |
| Processor | Intel Core i5 (8th Gen) / AMD Ryzen 5 or better | 2 vCPU (cloud instance, e.g., Render free tier) |
| RAM | 8 GB DDR4 minimum (16 GB recommended) | 512 MB – 2 GB (based on plan) |
| Storage | 256 GB SSD (for project files, Node modules) | Ephemeral cloud storage (stateless server) |
| Network | Broadband Internet (10 Mbps+) | Cloud datacenter network (Gbps) |
| Display | Full HD (1920×1080) recommended | N/A (headless server) |
| Operating System | Windows 10/11, macOS 12+, or Ubuntu 20.04+ | Linux (Ubuntu 20.04 LTS, managed by cloud provider) |
| Database | MongoDB Atlas (cloud-hosted, no local server required) | MongoDB Atlas M0 Free Tier (512 MB storage) |
| Media Storage | Cloudinary (cloud-hosted, no local disk needed) | Cloudinary Free Tier (25 GB storage, 25 GB bandwidth/month) |

| Software / Library | Version | Purpose |
| --- | --- | --- |
| Node.js | v18.17 LTS | JavaScript runtime for backend server |
| Express.js | v4.18 | Web framework for RESTful API |
| MongoDB | v6.0 (Atlas) | NoSQL cloud database |
| Mongoose | v7.4 | ODM for MongoDB schema and query management |
| React.js | v18.2 | Frontend UI library (component-based) |
| Vite | v5.0 | Frontend build tool and dev server |
| Tailwind CSS | v3.4 | Utility-first CSS framework for responsive design |
| Framer Motion | v10.16 | Animation library for React components |
| React Router | v6.15 | Client-side routing for React SPA |
| Axios | v1.5 | HTTP client for API requests from React |
| Socket.io | v4.6 | Real-time bidirectional event-based communication |
| jsonwebtoken | v9.0 | JWT generation and verification |
| bcryptjs | v2.4 | Password hashing and comparison |
| Cloudinary SDK | v1.41 | Image upload and CDN URL generation |
| Multer | v1.4 | Multipart form-data (file upload) middleware |
| Leaflet.js | v1.9 | Interactive map rendering |
| React Leaflet | v4.2 | React bindings for Leaflet |
| cors | v2.8 | CORS middleware for Express |
| dotenv | v16.3 | Environment variable management |
| Postman | v10.x | API endpoint testing |
| VS Code | v1.85+ | Primary IDE for frontend and backend development |
| Git | v2.43 | Version control system |
| GitHub | N/A | Remote repository and collaboration platform |
| MongoDB Compass | v1.41 | GUI for MongoDB database inspection and querying |
| Google Chrome / Firefox | Latest | Browser for frontend testing and DevTools debugging |

| Module | Description | Key Frontend Components | Key Backend Routes |
| --- | --- | --- | --- |
| Auth Module | Handles user registration, login, JWT issuance, and session management. Implements bcrypt hashing and JWT verification middleware. | LoginPage, RegisterPage, AuthContext, ProtectedRoute | /api/auth/register, /api/auth/login, /api/auth/me |
| User/Profile Module | Manages student profile display, editing, and social graph (followers/following). Handles profile image upload to Cloudinary. | ProfilePage, EditProfileModal, FollowersList | /api/users/:id, /api/users/:id/follow, /api/users/:id/followers |
| Opportunities Module | Core post management: creating, reading, updating, deleting opportunity posts. Includes the Explore feed with filters and map view. | Explore, PostCard, PostDetails, CreatePost, EditPost | /api/posts (CRUD), /api/posts/nearby, /api/posts/:id/like |
| Requests Module | Manages application requests from interested students to post owners. Triggers conversation creation on approval. | Requests, RequestCard | /api/requests, /api/requests/:id/approve, /api/requests/:id/reject |
| Messaging Module | Real-time one-on-one chat between students. Manages conversations and individual messages via Socket.io. | Messages, ChatWindow, ConversationList | /api/conversations, /api/conversations/:id/messages |
| Notifications Module | Generates, delivers, and manages in-app notifications for user events. Uses Socket.io for real-time delivery. | NotificationBell, NotificationPanel | /api/notifications, /api/notifications/read-all |
| Admin Module | Platform governance: user management, post moderation, statistics dashboard. | AdminDashboard, UserManagement, PostModeration | /api/admin/stats, /api/admin/users, /api/admin/posts |
| AI Insights Module | Provides AI-generated insights for post owners (market demand, price analysis) and viewers (post summary, context). Calls external AI API. | AIInsightsPanel (in PostCard) | /api/posts/:id/insights, /api/posts/:id/explanation |

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | /auth/register | Register a new user account. Body: displayName, email, password, college, city. | N |
| POST | /auth/login | Authenticate user with email/password. Returns JWT and user object. | N |
| GET | /auth/me | Retrieve the authenticated user's profile using their JWT. | Y |
| GET | /users/:id | Retrieve a specific user's public profile by their MongoDB ObjectId. | N |
| PUT | /users/:id | Update the authenticated user's profile (name, bio, college, city, profileImage URL). | Y |
| POST | /users/:id/follow | Toggle follow/unfollow for the user identified by :id. | Y |
| GET | /users/:id/followers | Retrieve paginated list of users who follow the specified user. | N |
| GET | /users/:id/following | Retrieve paginated list of users the specified user follows. | N |
| GET | /posts | Retrieve paginated, filterable list of opportunity posts. Query params: type, city, search, page, limit, sortBy. | N |
| POST | /posts | Create a new opportunity post. Body: title, type, description, location, coordinates, price, budgetMin, budgetMax, images, tags, duration, availability, acceptsBarter, isUrgent. | Y |
| GET | /posts/nearby | Retrieve posts within a radius of given coordinates. Query: lat, lng, radius. | N |
| GET | /posts/:id | Retrieve full details of a specific post by ID. Increments view count. | N |
| PUT | /posts/:id | Update an existing post (author only). Same body schema as POST /posts. | Y |
| DELETE | /posts/:id | Delete a post (author or admin only). Sets isActive to false. | Y |
| POST | /posts/:id/like | Toggle like/unlike on a post for the authenticated user. | Y |
| POST | /posts/:id/share | Record a share action and increment the post's share count. | Y |
| GET | /posts/:id/analytics | Retrieve view, like, share, and days-active statistics for a post (owner only). | Y |
| GET | /conversations | Retrieve all conversations for the authenticated user. | Y |
| POST | /conversations | Create a new conversation (or retrieve existing) between two users for a post. Body: recipientId, postId. | Y |
| GET | /conversations/:id/messages | Retrieve paginated message history for a specific conversation. | Y |
| POST | /conversations/:id/messages | Send a new message in a conversation. Body: content, messageType. | Y |
| GET | /notifications | Retrieve all unread and recent notifications for the authenticated user. | Y |
| PATCH | /notifications/read-all | Mark all notifications for the authenticated user as read. | Y |
| GET | /requests | Retrieve all requests (sent or received) for the authenticated user. | Y |
| POST | /requests | Create a new application request for an opportunity. Body: postId, toUserId, message. | Y |
| PATCH | /requests/:id/approve | Approve a received request, triggering conversation creation (post owner only). | Y |
| PATCH | /requests/:id/reject | Reject a received request (post owner only). | Y |
| GET | /admin/stats | Retrieve platform-wide statistics: total users, posts, conversations. Admin only. | Y |
| GET | /admin/users | Retrieve paginated list of all users. Admin only. | Y |
| PATCH | /admin/users/:id/deactivate | Deactivate or reactivate a user account. Admin only. | Y |
| DELETE | /admin/posts/:id | Hard-delete any post. Admin only. | Y |

| TC ID | Endpoint | Method | Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TC-01 | /auth/register | POST | Valid name, email, password, college, city | 201 Created, JWT token in response | 201 Created, JWT returned | PASS |
| TC-02 | /auth/register | POST | Existing email address | 409 Conflict, error message | 409 Conflict, 'Email already exists' | PASS |
| TC-03 | /auth/login | POST | Valid email and correct password | 200 OK, JWT token and user object | 200 OK, token and user returned | PASS |
| TC-04 | /auth/login | POST | Valid email, wrong password | 401 Unauthorized, error message | 401 Unauthorized, 'Invalid credentials' | PASS |
| TC-05 | /auth/login | POST | Non-existent email | 401 Unauthorized | 401 Unauthorized | PASS |
| TC-06 | /posts | GET | No query params (unauthenticated) | 200 OK, paginated posts array | 200 OK, 10 posts returned | PASS |
| TC-07 | /posts | GET | Query: type=job&city=Bilaspur | 200 OK, filtered posts (type=job, city=Bilaspur) | 200 OK, correct filtered results | PASS |
| TC-08 | /posts | POST | Valid post body, valid JWT in header | 201 Created, new post object | 201 Created, post document returned | PASS |
| TC-09 | /posts | POST | Missing title field, valid JWT | 400 Bad Request, validation error | 400 Bad Request, 'Title is required' | PASS |
| TC-10 | /posts | POST | No Authorization header | 401 Unauthorized | 401 Unauthorized, 'No token provided' | PASS |
| TC-11 | /posts/:id/like | POST | Valid post ID, valid JWT | 200 OK, updated likes array | 200 OK, user ID added to likes | PASS |
| TC-12 | /posts/:id/like | POST | Already liked post, same JWT | 200 OK (unlike), user ID removed from likes | 200 OK, like toggled off | PASS |
| TC-13 | /users/:id/follow | POST | Valid user ID, valid JWT | 200 OK, follow toggled | 200 OK, follower/following updated | PASS |
| TC-14 | /conversations | POST | Valid recipientId and postId, JWT | 201 Created or 200 OK (existing), conversation object | 200 OK, existing or new conversation | PASS |
| TC-15 | /conversations/:id/messages | POST | Message content, valid JWT | 201 Created, message object | 201 Created, message persisted | PASS |
| TC-16 | /notifications | GET | Valid JWT | 200 OK, notifications array | 200 OK, notifications returned | PASS |
| TC-17 | /notifications/read-all | PATCH | Valid JWT | 200 OK, all notifications marked read | 200 OK, unread count becomes 0 | PASS |
| TC-18 | /admin/stats | GET | Admin JWT | 200 OK, stats object (users, posts counts) | 200 OK, correct stats returned | PASS |
| TC-19 | /admin/stats | GET | Regular user JWT (non-admin) | 403 Forbidden | 403 Forbidden, 'Access denied' | PASS |
| TC-20 | /admin/posts/:id | DELETE | Admin JWT, valid post ID | 200 OK, post deleted | 200 OK, post removed from DB | PASS |

| Bug ID | Description | Severity | Status | Resolution |
| --- | --- | --- | --- | --- |
| BUG-01 | Filter function not defined error on Explore page after code refactor introduced escaped quotes in JSX | Critical | Resolved | Restored correct JSX syntax; re-validated all string interpolations in Explore.jsx |
| BUG-02 | Currency symbol showing hardcoded '₹' instead of dynamic symbol from CurrencySymbolContext in PostCard | High | Resolved | Integrated useCurrencySymbol hook; replaced all hardcoded currency characters |
| BUG-03 | cn() utility function not imported in Explore.jsx after map UX enhancement; 'cn is not defined' runtime error | Critical | Resolved | Added import { cn } from '../utils/cn' to Explore.jsx |
| BUG-04 | Duplicate import block in PostCard.jsx after multi-replace operation caused parse error | Critical | Resolved | Removed duplicated import lines; ensured single clean import block |
| BUG-05 | JWT token not attached to Axios requests after page refresh due to race condition in AuthContext initialization | High | Resolved | Added loading state to AuthContext; deferred API calls until auth state initialized |
| BUG-06 | Leaflet map markers not rendering on first load due to missing default icon image paths | Medium | Resolved | Added L.Icon.Default.mergeOptions() with explicit CDN URLs for marker icons |
| BUG-07 | Post cards showing 'undefined' for budget when only a single price value provided (no budgetMin/Max) | Medium | Resolved | Updated budgetLabel logic to fall back to price field when budget range fields are absent |
| BUG-08 | Socket.io 'new_message' event not received by recipient when conversation window not open | High | Resolved | Moved socket subscription to global SocketContext rather than ChatWindow component |
| BUG-09 | Admin dashboard accessible to regular users due to missing role check on frontend ProtectedRoute | High | Resolved | Added role === 'admin' check to ProtectedRoute; backend admin middleware also enforces role |
| BUG-10 | Profile image upload failing for large images (>5MB) due to missing Multer file size limit configuration | Medium | Resolved | Added limits: { fileSize: 5 * 1024 * 1024 } to Multer configuration; added client-side size validation |
