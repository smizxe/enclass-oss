# Project Tasks: IELTS Study Platform

## Phase 1: Foundation & Teacher MVP (Completed)
- [x] **Project Setup**: Next.js 14, TypeScript, Tailwind, Shadcn UI.
- [x] **Database**: SQLite with Prisma (`User`, `Course`, `Module`, `Lesson`, `Question`).
- [x] **Authentication**: NextAuth.js (Email/Password) + Middleware Protection.
- [x] **Landing Page**: Basic Hero -> Login flow.
- [x] **Teacher Dashboard**:
    - [x] Sidebar Navigation.
    - [x] Course List (`GET /api/teacher/courses`).
    - [x] Create Course (`POST /api/teacher/courses`).
    - [x] Course Detail (View Modules/Lessons).
    - [x] Backend API for creating Modules/Lessons.
    - [x] CSV Import API Endpoint (Backend logic).
- [x] **Seed Data**: `teacher@example.com` and `student@example.com` + Demo Course.

## Phase 2: Student Learning & Test Runner (Current Priority)
- [x] **Student Dashboard**: List enrolled courses.
- [x] **Course Player Layout**: Sidebar for Curriculum, Main for Content.
- [x] **Question UI Components**:
    - [x] Multiple Choice (MCQ).
    - [x] Gap Fill (Input/Dropdown).
    - [x] Drag & Drop (Sortable).
- [x] **Test Engine Logic**:
    - [x] Fetching Questions.
    - [x] Submitting Answers (Simulation).

## Phase 3: Pivot to Class Model (Current Priority)
- [x] **Database Migration**:
    - [x] Rename `Course` -> `Class`.
    - [x] Add `createdById` to `User`.
    - [x] **Remove `Module`** and link `Assignment` directly to `Class`.
- [x] **Teacher: Student Management**:
    - [x] Create Student Account UI (`/teacher/students/create`).
    - [x] API for Teacher creating Students.
- [x] **Teacher: Class Management**:
    - [x] Create Class UI (renamed from Course).
    - [x] **Assign Students to Class** UI.
    - [x] List Classes (Grid View).
    - [x] **Direct Assignment Management** (No Modules).
- [x] **Assignments (MVP)**:
    - [x] Multiple Choice Editor.
    - [x] Form-style Viewer.
    - [x] Support "Written" (Essay) Assignment Type.
- [x] **Student Dashboard Refactor**:
    - [x] View Assigned Classes.
    - [x] View Pending Assignments.
