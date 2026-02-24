# Admin/Teacher: Student Management Implementation Plan

## Goal
Implement a database-driven Student List for the Teacher (Admin).
Allows tracking of all registered students.

## Proposed Changes

### 1. Backend API
**File:** `app/api/teacher/students/route.ts` [NEW]
- **GET**: Fetch all users where `role === "STUDENT"`.
- **Response**: `{ id, email, name, createdAt, _count: { enrolledCourses } }`.

### 2. Frontend UI
**File:** `app/(dashboard)/teacher/students/page.tsx` [NEW]
- Use `DataTable` (or simple list) to display students.
- Columns: Email, Join Date, Enrolled Content.

## Verification Plan

### Automated/Manual verification
1.  **Seed Data**: Ensure `student@example.com` exists.
2.  **Navigate**: Login as `teacher@example.com`, click **Students**.
3.  **Verify**: Table should show 1 student.
4.  **Register New**: Register a new user `student2@test.com`, verify they appear in the list.
