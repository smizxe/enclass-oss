# Online Study Platform (IELTS-Style)

A comprehensive classroom management and IELTS practice platform prototyped with Next.js 14, Prisma, and TailwindCSS.

## 🚀 Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Setup Database (SQLite)**
    ```bash
    npx prisma db push
    npx prisma db seed
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Login Credentials (Seed Data)**

    | Role | Email | Password |
    |------|-------|----------|
    | **Teacher** | `teacher@example.com` | `teacher123` |
    | **Student** | `student@example.com` | `student123` |

## 📂 Project Structure

- `app/`: Next.js App Router pages.
    - `(auth)`: Login routes.
    - `(dashboard)`: Protected dashboard routes.
    - `api/`: Backend API routes.
- `components/`: UI components (Shadcn/UI).
- `prisma/`: Database schema and seed script.
- `lib/`: Utilities and generic configurations.

## 🌟 Key Features (MVP)

- **Role-Based Access**: Separate Teacher and Student dashboards.
- **Course Builder**: Create courses, modules, and lessons.
- **CSV Import**: Bulk import questions into lessons.
- **Test Engine**: Support for MCQ, Gap Fill, Drag & Drop (Infrastructure ready).

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite (Local) / PostgreSQL (Production ready)
- **ORM**: Prisma
- **Styling**: TailwindCSS
- **Auth**: NextAuth.js
