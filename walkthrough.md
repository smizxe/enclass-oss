# Walkthrough: Student Learning & Test Runner

We have successfully implemented the **Student Dashboard** and **Interactive Test Engine**.

## 1. Accessing the Student View

1.  **Logout** from the Teacher account (if logged in).
2.  **Login** as a Student:
    *   **Email**: `student@example.com`
    *   **Password**: `student123`
3.  You will land on the **My Learning Path** dashboard.
    *   The "IELTS Masterclass Demo" course should be visible.
    *   Click **Start Learning**.

## 2. Experiencing the Test Engine

Once inside the Course Player:
1.  Navigate to **Module 1: Listening Strategies** in the sidebar.
2.  Click on **Multiple Choice Practice** (this is a Quiz lesson).
3.  You will see the **Quiz Runner** interface with 3 newly implemented question types:

### Question Types Implemented

| Type | Description | Interaction |
| :--- | :--- | :--- |
| **MCQ** | Multiple Choice Question | Select one correct option (`RadioGroup`). |
| **Gap Fill** | Fill in the blanks | Type answers into input boxes embedded in text. |
| **Sortable** | Rearrangement | Drag and drop items to reorder them vertically. |

## 3. Verification Steps

- [ ] **Start Quiz**: Verify the questions load correctly.
- [ ] **Interact**: 
    - Select an MCQ option.
    - Type "App" and "Server" into the Gap Fill blanks.
    - Drag "Planning" to the top in the Sortable list.
- [ ] **Submit**: Click the "Submit QUIZ" button (Simulates submission toast).

## 4. Technical Implementation

- **Components**: `McqQuestion`, `GapFillQuestion`, `SortableQuestion` (using `@hello-pangea/dnd`).
- **State Management**: `QuizRunner` aggregates answers from all child components.
- **Data Source**: Seeded via `prisma/seed.js` with JSON content.
