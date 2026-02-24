# Project Plan: IELTS-Style Classroom Platform

## 1. Project Overview
A web application for managing classrooms and practicing IELTS-style tests.
**Roles:** Teacher, Student.
**Core Value:** Structured learning paths with conditional unlocking and diverse question interactions.

## 2. Scope

### MVP (Minimum Viable Product)
- **Authentication**: Email/Password login with Role-based access control (RBAC).
- **Course Management (Teacher)**:
    - Create Courses, Modules, Lessons.
    - Import Questions via CSV.
    - View Student Progress.
- **Learning Interface (Student)**:
    - View assigned courses.
    - Sequential access to lessons (Unlock logic).
    - Test Runner supporting 5 question types:
        1.  MCQ (Multiple Choice)
        2.  Gap Fill (Dropdown/Input)
        3.  Rearrangement (Drag & Drop sorting)
        4.  Drag & Drop (Categorization/Matching)
        5.  Typing (Short answer/Essay)
    - Listening (Audio player) & Reading (Split pane) capability.
- **Backend implementation**:
    - Auto-grading for objective questions.
    - Progress tracking.

### Nice-to-Have (Phase 2)
- Real-time classroom monitoring.
- Gamification (Badges, Leaderboards).
- AI Grading for writing tasks.
- Advanced Analytics/Charts.

## 3. Data Model Concepts (Prisma Draft Prep)

- **User**: id, email, role (TEACHER | STUDENT), password_hash.
- **Course**: id, title, description, teacher_id.
- **Module**: id, title, course_id, order_index.
- **Lesson**: id, title, module_id, content (rich text/video), type (LECTURE | QUIZ | TEST), prerequisite_id.
- **Question**: id, lesson_id, type, content (json), correct_answer (json), points.
- **Enrollment**: user_id, course_id.
- **Progress**: user_id, lesson_id, status (LOCKED | UNLOCKED | COMPLETED), score.
- **Submission**: id, progress_id, user_answers (json), graded_score.

## 4. API Contracts (Draft)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Courses (Teacher)
- `GET /api/teacher/courses`
- `POST /api/teacher/courses`
- `POST /api/teacher/courses/{id}/import-csv` (Multipart upload)

### Learning (Student)
- `GET /api/courses`: Enrolled courses.
- `GET /api/courses/{id}/curriculum`: Tree view of modules/lessons + status.
- `GET /api/lessons/{id}`: Content + Questions (if accessible).
- `POST /api/lessons/{id}/submit`: Submit answers for auto-grading.
- `GET /api/student/reports`: Overall progress.

## 5. UI Routes Map

### Public
- `/`: Landing + Login

### Teacher Dashboard (`/teacher`)
- `/teacher/courses`: List of created courses.
- `/teacher/courses/[id]`: Course editor (Curriculum builder).
- `/teacher/students`: Student list & progress.

### Student Dashboard (`/student`)
- `/student/dashboard`: Enrolled courses & active assignments.
- `/learn/[courseId]`: Course overview/path.
- `/learn/[courseId]/lesson/[lessonId]`: Test Runner / Content Viewer.
- `/student/history`: Past results.

## 6. Implementation Phases
1.  **Foundation**: Setup Next.js, Prisma, Auth.
2.  **Core Data**: Schema migration, Seeding script.
3.  **Teacher Features**: Course creation, CSV Import.
4.  **Student Features**: Logic for unlocking, Test Runner UI.
5.  **Polishing**: Drag-drop interactions, Audio players, Reports.
