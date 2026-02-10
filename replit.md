# GradeBook - School Grades Management System

## Overview
A web-based school grades management system that allows teachers and administrators to track student performance, manage subjects, and record grades efficiently.

## Recent Changes
- February 2026: Added double-click inline editing for scores and assignment names in Gradebook
- February 2026: Added "Assign to All Students" bulk grade creation with file attachment sharing
- February 2026: Added assignment names to grades, shown in gradebook with inline rename support
- February 2026: Show assigned teacher name on subject filter tabs and when subject is selected
- February 2026: Added file uploads and assignment weighting to Gradebook
- February 2026: Renamed Grades tab to Gradebook with prominent subject filtering tabs
- February 2026: Added Teachers management with subject assignment (many-to-many)
- January 2026: Initial MVP implementation with students, subjects, and grades management

## Project Architecture

### Frontend (React + TypeScript)
- **Framework**: React with Vite, TypeScript
- **Routing**: wouter
- **State Management**: TanStack Query for server state
- **UI Components**: shadcn/ui with Tailwind CSS
- **Forms**: react-hook-form with zod validation

### Backend (Express + Node.js)
- **Framework**: Express.js with TypeScript
- **Storage**: In-memory storage (MemStorage class)
- **Validation**: Zod schemas from drizzle-zod

### Data Models
- **Students**: id, fullName, gradeLevel, email (optional)
- **Subjects**: id, name, description (optional)
- **Grades**: id, studentId, subjectId, assignmentName, score, maxScore, category, term, date, fileName, fileUrl
- **CategoryWeights**: id, subjectId, category, weight (percentage)
- **Teachers**: id, fullName, email (optional)
- **TeacherSubjects**: id, teacherId, subjectId (many-to-many assignments)

### Key Pages
1. **Dashboard** (`/`): Overview with statistics and recent grades
2. **Students** (`/students`): CRUD operations for student records
3. **Subjects** (`/subjects`): CRUD operations for course subjects
4. **Gradebook** (`/grades`): Record and manage student grades with subject filtering tabs, file uploads, assignment names, bulk assignment creation for all students, inline double-click editing of scores and names, teacher display per subject, and weighted grade calculations
5. **Teachers** (`/teachers`): Manage teachers and assign subjects to them

### API Endpoints
- `GET/POST /api/students` - List/Create students
- `GET/PUT/DELETE /api/students/:id` - Student CRUD
- `GET/POST /api/subjects` - List/Create subjects
- `GET/PUT/DELETE /api/subjects/:id` - Subject CRUD
- `GET/POST /api/grades` - List/Create grades (POST supports multipart/form-data for file uploads)
- `POST /api/grades/bulk` - Create grade for all students at once (multipart/form-data, shares file across entries)
- `GET/PUT/DELETE /api/grades/:id` - Grade CRUD (PUT supports file uploads)
- `GET/POST /api/category-weights` - List/Set category weights per subject
- `GET /api/category-weights/:subjectId` - Get weights for a subject
- `DELETE /api/category-weights/:id` - Remove a category weight
- `GET/POST /api/teachers` - List/Create teachers
- `GET/PUT/DELETE /api/teachers/:id` - Teacher CRUD
- `GET/POST /api/teacher-subjects` - List/Create teacher-subject assignments
- `GET /api/teacher-subjects/:teacherId` - Get assignments for a teacher
- `DELETE /api/teacher-subjects/:id` - Remove assignment

## Development Commands
- `npm run dev` - Start development server (frontend + backend)
- Frontend runs on port 5000 via Vite proxy

## User Preferences
- Professional blue color scheme
- Sidebar navigation pattern
- Dark mode support
