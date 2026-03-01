# GradeBook - School Grades Management System

## Overview
A web-based school grades management system that allows teachers and administrators to track student performance, manage subjects, and record grades efficiently. Features role-based authentication and authorization.

## Recent Changes
- March 2026: Added authentication system (login, register, logout, session management)
- March 2026: Added role-based access control (admin, teacher, student) with protected routes
- March 2026: Split routes into modular files with input sanitization and rate limiting
- March 2026: Added security middleware (rate limiting, XSS protection, input validation)
- February 2026: Added academic structure (academicYears, terms, sections, enrollments) with full CRUD API
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
- **Auth**: useAuth hook + ProtectedRoute component + usePermissions hook

### Backend (Express + Node.js)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL via Drizzle ORM (server/db.ts connection pool)
- **Storage**: DatabaseStorage class in server/storage.ts (implements IStorage interface with Drizzle queries)
- **Validation**: Zod schemas from drizzle-zod + server/utils/sanitize.ts (XSS, validator)
- **Auth**: express-session + connect-pg-simple (PostgreSQL session store)
- **Security**: bcryptjs password hashing, express-rate-limit, input sanitization (xss, validator)
- **Routes**: Modular route files in server/routes/ (auth, students, teachers, subjects, grades, academicYears, terms, sections, enrollments, categoryWeights, teacherSubjects)
- **Middleware**: server/middleware/auth.ts (requireAuth, requireRole, requireOwnerOrAdmin), server/middleware/rateLimiter.ts (authLimiter, readLimiter, writeLimiter, uploadLimiter)

### Data Models
- **Users**: id, username, password, role (admin/teacher/student), teacherId (optional), studentId (optional)
- **Students**: id, fullName, gradeLevel, email (optional)
- **Subjects**: id, name, description (optional)
- **Grades**: id, studentId, subjectId, assignmentName, score, maxScore, category, term, date, fileName, fileUrl
- **CategoryWeights**: id, subjectId, category, weight (percentage)
- **Teachers**: id, fullName, email (optional)
- **TeacherSubjects**: id, teacherId, subjectId (many-to-many assignments)
- **AcademicYears**: id, name, startDate, endDate, isActive (only one active at a time)
- **Terms**: id, academicYearId, name, startDate, endDate, isActive
- **Sections**: id, subjectId, teacherId, termId, sectionName, roomNumber (optional)
- **Enrollments**: id, studentId, sectionId, enrollDate, status (active/dropped/completed)

### Key Pages
1. **Login** (`/login`): Authentication form with username/password
2. **Register** (`/register`): Account creation with role selection and profile linking
3. **Dashboard** (`/`): Overview with statistics and recent grades (protected)
4. **Students** (`/students`): CRUD operations for student records (protected)
5. **Subjects** (`/subjects`): CRUD operations for course subjects (protected)
6. **Gradebook** (`/grades`): Record and manage student grades (protected)
7. **Teachers** (`/teachers`): Manage teachers and assign subjects (protected)

### API Endpoints
- `POST /api/auth/register` - Register new user (rate limited)
- `POST /api/auth/login` - Login with session creation (rate limited)
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/auth/me` - Get current authenticated user
- `GET/POST /api/students` - List/Create students (auth required, admin for create)
- `GET/PUT/DELETE /api/students/:id` - Student CRUD (admin for mutations)
- `GET/POST /api/subjects` - List/Create subjects (auth required, admin for create)
- `GET/PUT/DELETE /api/subjects/:id` - Subject CRUD (admin for mutations)
- `GET/POST /api/grades` - List/Create grades (role-filtered, admin/teacher for create)
- `POST /api/grades/bulk` - Bulk grade creation (admin/teacher)
- `GET/PUT/DELETE /api/grades/:id` - Grade CRUD (admin/teacher for mutations)
- `GET/POST /api/category-weights` - List/Set weights (admin/teacher for create)
- `GET /api/category-weights/:subjectId` - Get weights for a subject
- `DELETE /api/category-weights/:id` - Remove weight (admin only)
- `GET/POST /api/teachers` - List/Create teachers (auth required, admin for create)
- `GET/PUT/DELETE /api/teachers/:id` - Teacher CRUD (admin for mutations)
- `GET/POST /api/teacher-subjects` - List/Create assignments (admin for create)
- `GET /api/teacher-subjects/:teacherId` - Get assignments for a teacher
- `DELETE /api/teacher-subjects/:id` - Remove assignment (admin only)
- `GET/POST /api/academic-years` - List/Create academic years (admin for mutations)
- `GET/PUT/DELETE /api/academic-years/:id` - Academic year CRUD (admin only)
- `GET/POST /api/terms` - List/Create terms (admin for mutations)
- `DELETE /api/terms/:id` - Delete term (admin, cascade protection)
- `GET/POST /api/sections` - List/Create sections (role-filtered, admin for create)
- `DELETE /api/sections/:id` - Delete section (admin, auto-deletes enrollments)
- `GET/POST /api/enrollments` - List/Create enrollments (role-filtered, admin for create)
- `POST /api/enrollments/bulk` - Bulk enrollment (admin only)
- `DELETE /api/enrollments/:id` - Remove enrollment (admin only)

## Development Commands
- `npm run dev` - Start development server (frontend + backend)
- Frontend runs on port 5000 via Vite proxy

## User Preferences
- Professional blue color scheme
- Sidebar navigation pattern
- Dark mode support
