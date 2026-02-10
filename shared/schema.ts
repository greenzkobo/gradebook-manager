import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  gradeLevel: text("grade_level").notNull(),
  email: text("email"),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
});

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

// Grades table
export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  assignmentName: text("assignment_name"),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull().default(100),
  category: text("category"),
  term: text("term"),
  date: text("date"),
  fileName: text("file_name"),
  fileUrl: text("file_url"),
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
});

export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;

export const GRADE_CATEGORIES = [
  "Homework",
  "Quiz",
  "Test",
  "Exam",
  "Project",
  "Assignment",
  "Classwork",
  "Participation",
] as const;

export type GradeCategory = (typeof GRADE_CATEGORIES)[number];

// Category weights per subject
export const categoryWeights = pgTable("category_weights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").notNull(),
  category: text("category").notNull(),
  weight: integer("weight").notNull(),
});

export const insertCategoryWeightSchema = createInsertSchema(categoryWeights).omit({
  id: true,
});

export type InsertCategoryWeight = z.infer<typeof insertCategoryWeightSchema>;
export type CategoryWeight = typeof categoryWeights.$inferSelect;

// Teachers table
export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email"),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
});

export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;

// Teacher-Subject assignments (many-to-many)
export const teacherSubjects = pgTable("teacher_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
});

export const insertTeacherSubjectSchema = createInsertSchema(teacherSubjects).omit({
  id: true,
});

export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;
export type TeacherSubject = typeof teacherSubjects.$inferSelect;

// Academic Years table
export const academicYears = pgTable("academic_years", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(false),
});

export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({
  id: true,
});

export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;
export type AcademicYear = typeof academicYears.$inferSelect;

// Terms table
export const terms = pgTable("terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  academicYearId: varchar("academic_year_id").notNull(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(false),
});

export const insertTermSchema = createInsertSchema(terms).omit({
  id: true,
});

export type InsertTerm = z.infer<typeof insertTermSchema>;
export type Term = typeof terms.$inferSelect;

// Sections table
export const sections = pgTable("sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  termId: varchar("term_id").notNull(),
  sectionName: text("section_name").notNull(),
  roomNumber: text("room_number"),
});

export const insertSectionSchema = createInsertSchema(sections).omit({
  id: true,
});

export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sections.$inferSelect;

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  sectionId: varchar("section_id").notNull(),
  enrollDate: text("enroll_date").notNull(),
  status: text("status").notNull().default("active"),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export const ENROLLMENT_STATUSES = ["active", "dropped", "completed"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];
