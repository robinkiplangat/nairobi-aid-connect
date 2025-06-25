# SOS Nairobi: Product Requirements Document (PRD)
Version: 1.0
Date: June 25, 2024
Status: Draft


# 1. Introduction
## 1.1. Problem Statement
During periods of civil demonstration and unrest in Nairobi, there is a critical and often chaotic gap in coordinating aid. Individuals in need of urgent medical assistance, legal advice, or a safe haven struggle to connect with volunteers who are willing and able to help. Traditional communication channels can be unreliable, insecure, or monitored, putting vulnerable individuals at further risk. There is a need for a centralized, secure, and anonymous platform to bridge this gap safely and efficiently.

## 1.2. Proposed Solution: SOS Nairobi
SOS Nairobi is a web-based emergency response platform designed to provide a lifeline during civil demonstrations. It leverages AI-powered social media monitoring and a map-based interface to connect help seekers with verified volunteers in real-time. The platform is built on the principles of safety, anonymity, and simplicity, ensuring that users can request and offer help without compromising their identity or security.

This pilot version focuses on delivering the core functionality needed to make an immediate impact.

# 2. Target Audience
Help Seekers (Primary Users):

Who they are: Protesters, bystanders, and any individuals in Nairobi directly affected by the demonstrations who require immediate assistance.

Their needs: A fast, easy, and anonymous way to request help. They are highly concerned about their privacy and physical safety.

Help Providers (Secondary Users):

Who they are: Vetted and verified volunteers, including paramedics, doctors, lawyers, and general community helpers.

Their needs: A reliable system to find legitimate help requests, locate individuals in need, and coordinate a response securely.

Platform Administrators (Tertiary Users):

Who they are: A small, trusted team responsible for platform integrity.

Their needs: Tools to verify volunteers and monitor the platform for misuse.

# 3. Key Features (Pilot MVP)
## 3.1. Feature 1: Anonymous SOS Request & Live Map
Description: Allows users to anonymously request help and view needs on a live map of Nairobi. The core of the platform is to visualize need hotspots.

User Actions:

A user visits the site and can immediately see a map of Nairobi.

By clicking the "I NEED HELP" button, the user can select the type of assistance required (e.g., "Medical," "Legal," "Safe Shelter").

They are prompted to tap on the map to drop a pin at their approximate location. To protect privacy, the exact GPS coordinate is intentionally obfuscated and displayed as a general hotspot on the map.

An AI agent will also monitor public Twitter feeds for keywords related to distress signals in Nairobi (#KenyaDemocracy, #NairobiProtest, "need medic," etc.) and automatically create anonymous help pings on the map.

## 3.2. Feature 2: Secure Volunteer Response & Communication
Description: Provides a secure channel for verified volunteers to respond to requests.

User Actions:

A pre-verified volunteer clicks the "I CAN PROVIDE HELP" button.

They see the live map populated with anonymous help requests (pings).

The volunteer can click a ping to see the type of help needed and accept the request.

Accepting a request initiates a secure, end-to-end encrypted chat session between the volunteer and the help seeker.

All communication uses temporary, anonymous IDs. Chat logs are automatically deleted after 24 hours to ensure no data persists.

## 3.3. Feature 3: Real-Time Updates & Resource Hub
Description: A simple, curated feed for verified information and a library of essential resources.

User Actions:

The main page features a small, unobtrusive feed with real-time, verified updates (e.g., road closures, designated safe zones, updates from trusted NGOs).

A link to a static "Resource Library" provides crucial information, including basic first-aid instructions, legal rights summaries, and emergency contact numbers for organizations like Amnesty International and the Red Cross.

# 4. System Design & Technical Specifications
Frontend: A lightweight, single-page application (SPA) to ensure fast load times.

Framework: Standard HTML, CSS, JavaScript. No heavy frameworks to maximize speed and simplicity.

Map Library: Leaflet.js for its performance and ease of use.

Backend:

Language: Python

Framework: FastAPI for its high performance and asynchronous capabilities, which are ideal for real-time applications.

Database: MongoDB for its flexible, JSON-like document structure, perfect for storing varied data like geo-located requests and temporary chat messages.

Hosting & AI Infrastructure:

Cloud Provider: Google Cloud Platform (GCP).

Application Hosting: Deployed on Vertex AI, which provides a scalable and managed environment suitable for handling unpredictable traffic spikes.

AI Agents: Built using Google's Agent Development Kit. These agents will run as separate services, connecting to the Twitter API, processing text to identify distress signals, and pushing structured data (request type, location) into the MongoDB database.

Security & Anonymity Protocol:

Transport: All traffic enforced over HTTPS.

Chat: End-to-end encryption using the Signal Protocol or a similar library.

Data Storage: No personally identifiable information (PII) is ever stored. Location data is intentionally made imprecise.

User Identity: No user accounts or sign-ins for help seekers. Access is session-based. Volunteers are verified through a secure, off-platform manual process.

# 5. Wireframes (Stitch-Style Description)
Page: Landing Page

Layout: A two-column layout. The left column (60% width) is dominated by the interactive Nairobi map. The right column (40% width) contains the action panel.

Action Panel (Right Column):

Top: The platform title, "SOS Nairobi."

Middle: Two large, distinct buttons:

[ I NEED HELP ] (Perhaps in a red or high-alert color)

[ I CAN PROVIDE HELP ] (Perhaps in a blue or green color)

Bottom: A small, scrollable section for the "Real-Time Updates" feed.

Flow: Requesting Help

User clicks [ I NEED HELP ].

A modal window appears over the map.

Modal Content: "What do you need?" with buttons: [ Medical ], [ Legal ], [ Shelter ].

After selection, the modal updates: "Tap the map to show your approximate location."

User taps the map. A ping appears.

Confirmation: "Help request sent. A volunteer will contact you securely in this window." A temporary chat interface appears for that user's session.

Flow: Providing Help

User clicks [ I CAN PROVIDE HELP ].

A simple prompt asks for their pre-shared verification code.

On success, the map pings become active.

Volunteer clicks a ping. A small pop-up shows the request type (e.g., "Medical") and an [ Accept ] button.

Clicking [ Accept ] opens the secure chat interface, connecting them with the anonymous user.

# 6. Next Steps & Development Roadmap
Phase 1 (Immediate - The Next 24 Hours):

Set up core GCP infrastructure: Vertex AI and MongoDB instance.

Develop the front-end skeleton with the map and action buttons.

Implement the anonymous "Need Help" request flow, saving geo-data to MongoDB.

Build the secure chat functionality and the volunteer verification flow.

Goal: Launch a functional MVP.

Phase 2 (Enhancement - Days 2-3):

Develop and deploy the Twitter monitoring AI agent.

Populate the Resource Hub with verified information.

Refine the UI/UX based on initial usage and feedback.

# Phase 3 (Future):

Explore integration with other platforms (e.g., TikTok, if an API is feasible).

Strengthen security protocols, potentially investigating decentralized identity solutions.

Add features for organizing volunteer groups.