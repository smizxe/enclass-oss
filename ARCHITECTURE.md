# Architecture & System Design

## 1. Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS, Shadcn/UI (Radix Primitives)
- **Database**: PostgreSQL (Neon/Supabase recommended)
- **ORM**: Prisma
- **Auth**: NextAuth.js (v5 beta or v4) or custom JWT via middleware.
- **State Management**: React Query (TanStack Query) for server state, Zustand for client UI state (if complex).
- **Forms**: React Hook Form + Zod validation.

## 2. Directory Structure
```
/app
  /(auth)
    /login
    /register
  /(dashboard)
    /layout.tsx       <-- Role-based Sidebar
    /teacher
      /courses
      /students
    /student
      /dashboard
      /history
  /learn
    /[courseId]
      /lesson
        /[lessonId]   <-- Test Runner Environment (Full screen maybe)
  /api
    /...routes
/components
  /ui                 <-- Shadcn generic components
  /forms              <-- Reusable form parts
  /questions          <-- Question Type Components (MCQ, DragDrop, etc.)
  /layout             <-- Navbars, Sidebars
/lib
  prisma.ts
  auth.ts
  utils.ts
/prisma
  schema.prisma
```

## 3. Database Schema (Prisma Draft)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  TEACHER
  STUDENT
  ADMIN
}

enum LessonType {
  LECTURE
  QUIZ
  TEST
  ASSIGNMENT
}

enum QuestionType {
  MCQ
  GAP_FILL
  REARRANGEMENT
  DRAG_DROP
  TYPING
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  role          Role      @default(STUDENT)
  createdAt     DateTime  @default(now())
  
  coursesOwned  Course[]  @relation("TeacherCourses")
  enrollments   Enrollment[]
  dataset       Submission[]
}

model Course {
  id          String   @id @default(cuid())
  title       String
  description String?
  published   Boolean  @default(false)
  teacherId   String
  teacher     User     @relation("TeacherCourses", fields: [teacherId], references: [id])
  
  modules     Module[]
  enrollments Enrollment[]
}

model Module {
  id          String   @id @default(cuid())
  title       String
  orderIndex  Int
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  lessons     Lesson[]
}

model Lesson {
  id            String      @id @default(cuid())
  title         String
  content       String?     @db.Text // Markdown or HTML for lectures
  moduleId      String
  module        Module      @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  orderIndex    Int
  type          LessonType  @default(LECTURE)
  
  questions     Question[]
  progress      LessonProgress[]
}

model Question {
  id            String       @id @default(cuid())
  lessonId      String
  lesson        Lesson       @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  type          QuestionType
  content       Json         // { text: "...", options: [...] }
  correctAnswer Json         // Structure depends on type
  points        Int          @default(1)
}

model Enrollment {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id])
  joinedAt  DateTime @default(now())

  @@unique([userId, courseId])
}

model LessonProgress {
  id          String   @id @default(cuid())
  userId      String
  // User relation linking if needed, typically implicit via userId query or explicit
  lessonId    String
  lesson      Lesson   @relation(fields: [lessonId], references: [id])
  
  status      String   @default("LOCKED") // LOCKED, UNLOCKED, COMPLETED
  score       Int?
  submissions Submission[]
  
  @@unique([userId, lessonId])
}

model Submission {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  lessonProgressId String
  lessonProgress   LessonProgress @relation(fields: [lessonProgressId], references: [id])
  
  answers          Json     // User's answers
  score            Int
  submittedAt      DateTime @default(now())
}
```

## 4. Key Technical Decisions
- **NextAuth**: Use Credentials provider for simple email/pass.
- **CSV Import**: Use `papaparse` or `csv-parser` on backend to validate and batch create questions.
- **Question Components**:
    - Use a registry/map of `QuestionType -> Component`.
    - Each component accepts `data` (question content) and `onChange` (handler for user input).
- **Security**:
    - Middleware to protect `/teacher` routes.
    - API validation using Zod.
