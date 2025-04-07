# KonnektNotes

## Overview

KonnektNotes is a cross-platform, self-hosted notepad application designed for power users who require a secure, private, and versatile note-taking experience. It aims to run as a browser-based application on PCs (Windows/Mac/Linux) and eventually as a native Android app. The application synchronizes securely with a self-hosted server running on the user’s PC, ensuring all files (notes, checklists, graph data, images) are stored locally under the user's complete control and privacy.

## Vision & Final Goal

The ultimate vision for KonnektNotes is **to empower users with a secure, private, and flexible notepad solution that combines traditional note-taking with modern visualization and checklist management, all under their full control.**

This means providing:
*   **Cross-Platform Accessibility:** Seamless use via PC browsers and a dedicated Android app.
*   **Self-Hosting & Data Sovereignty:** Users host their own data on their PC.
*   **Secure Sync:** Encrypted, user-controlled synchronization between devices.
*   **Versatile Interface:** Multiple tabs for standard notes, checklists, and an interactive web graph for visualizing interconnected ideas with image support.
*   **Ease of Setup:** Straightforward installation and configuration.

## Core Features (Planned)

*   **Multi-Tab Interface:**
    *   **Notes Tab:** Rich text editing, tagging, search, version history, image attachments.
    *   **Checklist Tab:** Create/manage checklists, mark items complete, reorder, nesting, image attachments.
    *   **Web Graph Tab:** Visual nodes ("bubbles") containing text/images, connected by links to show relationships, zoom/pan, dynamic layout.
*   **Self-Hosted Server:** Runs on the user's PC (Windows/Mac/Linux), storing all data locally (SQLite database).
*   **Secure Synchronization:** End-to-end encrypted sync between the PC server and the Android client.
*   **Image/Screenshot Handling:** Attach images/screenshots to notes, checklist items, and graph nodes.
*   **User Authentication:** Secure login for the self-hosted instance.

## Current Status & Roadmap

This project is currently under development. Here's a breakdown of what's implemented and what's planned:

### Implemented Features (Based on Current Codebase)

*   **Backend Server (Node.js/Express):**
    *   Basic server setup (`server.ts`).
    *   Database schema defined using Knex migrations (SQLite). Tables exist for users, graphs, nodes, edges, notes, checklists, checklist items, and images.
    *   API endpoints (routes) and basic business logic (services, controllers) for core entities (Auth, Graphs, Nodes, Edges, Notes, Checklists, Items, Images).
    *   Basic user authentication middleware and routes.
    *   Initial setup for image uploads (Multer config, image routes/service).
    *   Initial setup for synchronization logic (sync routes/service).
*   **Frontend Web App (React/Vite):**
    *   Project setup with Vite and TypeScript.
    *   Basic application structure (`App.tsx`, `main.tsx`).
    *   Routing and core layout components (`MainLayout`, `PrivateRoute`).
    *   Authentication components (Login/Register forms, AuthContext).
    *   API client for communicating with the backend.
    *   Basic views for Notes (`NotesView`), Checklists (`ChecklistView`), and Graph (`GraphView`).
    *   Component for graph tabs (`GraphTabs`).
    *   Component for viewing rich text (`ReadOnlyLexicalViewer`).
    *   Component for image uploading (`ImageUploader`).

### Roadmap / To Be Implemented

*   **Core Functionality:**
    *   **Notes Tab:** Implement full rich text editing features, tagging, search, version history. Integrate image attachments fully.
    *   **Checklist Tab:** Implement item reordering, nesting, and image attachments.
    *   **Web Graph Tab:** Implement node creation/editing (text/images), link creation, zoom/pan, dynamic layout, export/print.
    *   **Image Handling:** Implement image display within content, basic editing (crop/resize).
*   **Android Application:** Develop the native Android client.
*   **Self-Hosting & Setup:**
    *   Create user-friendly installer packages or Docker container.
    *   Develop a guided setup wizard for server configuration and security (certificates).
*   **Synchronization:**
    *   Implement robust, secure end-to-end encryption.
    *   Develop reliable bi-directional sync logic.
    *   Implement conflict resolution strategies.
*   **UI/UX:**
    *   Refine overall design and user experience.
    *   Implement customizable themes (light/dark mode).
    *   Improve accessibility (keyboard shortcuts, screen reader compatibility).
*   **Non-Functional:**
    *   Implement comprehensive testing (unit, integration, E2E).
    *   Performance optimization.
    *   Add optional local file encryption.
    *   Improve error handling and reliability.
    *   Write user and developer documentation.
*   **Future Enhancements (Post-MVP):**
    *   iOS Support.
    *   Collaboration features.
    *   Advanced graph visualization/analytics.
    *   Plugin architecture.

## Technology Stack

*   **Backend:** Node.js, Express, Knex.js, SQLite
*   **Frontend (Web):** React, TypeScript, Vite
*   **Frontend (Mobile):** Android Native (Java/Kotlin) - *Planned*

---

This README provides a comprehensive overview based on the PRD and the current state inferred from the project files.
