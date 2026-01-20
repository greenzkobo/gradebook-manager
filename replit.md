# GradeBook - School Grades Management System

## Overview
A web-based school grades management system that allows teachers and administrators to track student performance, manage subjects, and record grades efficiently.

## Recent Changes
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
- **Grades**: id, studentId, subjectId, score, maxScore, term, date

### Key Pages
1. **Dashboard** (`/`): Overview with statistics and recent grades
2. **Students** (`/students`): CRUD operations for student records
3. **Subjects** (`/subjects`): CRUD operations for course subjects
4. **Grades** (`/grades`): Record and manage student grades with filters

### API Endpoints
- `GET/POST /api/students` - List/Create students
- `GET/PUT/DELETE /api/students/:id` - Student CRUD
- `GET/POST /api/subjects` - List/Create subjects
- `GET/PUT/DELETE /api/subjects/:id` - Subject CRUD
- `GET/POST /api/grades` - List/Create grades
- `GET/PUT/DELETE /api/grades/:id` - Grade CRUD

## Development Commands
- `npm run dev` - Start development server (frontend + backend)
- Frontend runs on port 5000 via Vite proxy

## User Preferences
- Professional blue color scheme
- Sidebar navigation pattern
- Dark mode support
