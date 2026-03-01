import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  students,
  subjects,
  grades,
  categoryWeights,
  teachers,
  teacherSubjects,
  academicYears,
  terms,
  sections,
  enrollments,
  type User,
  type InsertUser,
  type Student,
  type InsertStudent,
  type Subject,
  type InsertSubject,
  type Grade,
  type InsertGrade,
  type Teacher,
  type InsertTeacher,
  type TeacherSubject,
  type InsertTeacherSubject,
  type CategoryWeight,
  type InsertCategoryWeight,
  type AcademicYear,
  type InsertAcademicYear,
  type Term,
  type InsertTerm,
  type Section,
  type InsertSection,
  type Enrollment,
  type InsertEnrollment,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithRole(data: {
    username: string;
    hashedPassword: string;
    role: "admin" | "teacher" | "student";
    teacherId?: string | null;
    studentId?: string | null;
  }): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  getUsersByRole(role: string): Promise<User[]>;

  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: InsertStudent): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  getSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, subject: InsertSubject): Promise<Subject | undefined>;
  deleteSubject(id: string): Promise<boolean>;

  getGrades(): Promise<Grade[]>;
  getGrade(id: string): Promise<Grade | undefined>;
  getGradesByStudent(studentId: string): Promise<Grade[]>;
  getGradesBySubject(subjectId: string): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: string, grade: InsertGrade): Promise<Grade | undefined>;
  deleteGrade(id: string): Promise<boolean>;
  deleteGradesByStudent(studentId: string): Promise<void>;
  deleteGradesBySubject(subjectId: string): Promise<void>;

  getCategoryWeights(subjectId: string): Promise<CategoryWeight[]>;
  getAllCategoryWeights(): Promise<CategoryWeight[]>;
  setCategoryWeight(data: InsertCategoryWeight): Promise<CategoryWeight>;
  updateCategoryWeight(id: string, data: InsertCategoryWeight): Promise<CategoryWeight | undefined>;
  deleteCategoryWeight(id: string): Promise<boolean>;
  deleteCategoryWeightsBySubject(subjectId: string): Promise<void>;

  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, teacher: InsertTeacher): Promise<Teacher | undefined>;
  deleteTeacher(id: string): Promise<boolean>;

  getTeacherSubjects(teacherId: string): Promise<TeacherSubject[]>;
  getAllTeacherSubjects(): Promise<TeacherSubject[]>;
  assignSubjectToTeacher(assignment: InsertTeacherSubject): Promise<TeacherSubject>;
  removeTeacherSubject(id: string): Promise<boolean>;
  removeTeacherSubjectsByTeacher(teacherId: string): Promise<void>;
  removeTeacherSubjectsBySubject(subjectId: string): Promise<void>;

  getAcademicYears(): Promise<AcademicYear[]>;
  getAcademicYear(id: string): Promise<AcademicYear | undefined>;
  createAcademicYear(data: InsertAcademicYear): Promise<AcademicYear>;
  updateAcademicYear(id: string, data: InsertAcademicYear): Promise<AcademicYear | undefined>;
  deleteAcademicYear(id: string): Promise<boolean>;
  deactivateAllAcademicYears(exceptId?: string): Promise<void>;

  getTerms(): Promise<Term[]>;
  getTerm(id: string): Promise<Term | undefined>;
  getTermsByAcademicYear(academicYearId: string): Promise<Term[]>;
  createTerm(data: InsertTerm): Promise<Term>;
  deleteTerm(id: string): Promise<boolean>;
  deactivateAllTerms(exceptId?: string): Promise<void>;

  getSections(): Promise<Section[]>;
  getSection(id: string): Promise<Section | undefined>;
  createSection(data: InsertSection): Promise<Section>;
  deleteSection(id: string): Promise<boolean>;

  getEnrollments(): Promise<Enrollment[]>;
  getEnrollmentsBySection(sectionId: string): Promise<Enrollment[]>;
  createEnrollment(data: InsertEnrollment): Promise<Enrollment>;
  deleteEnrollment(id: string): Promise<boolean>;
  deleteEnrollmentsBySection(sectionId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`lower(${users.username}) = ${username.toLowerCase()}`);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createUserWithRole(data: {
    username: string;
    hashedPassword: string;
    role: "admin" | "teacher" | "student";
    teacherId?: string | null;
    studentId?: string | null;
  }): Promise<User> {
    const [user] = await db.insert(users).values({
      username: data.username,
      password: data.hashedPassword,
      role: data.role,
      teacherId: data.teacherId ?? null,
      studentId: data.studentId ?? null,
    }).returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        teacherId: users.teacherId,
        studentId: users.studentId,
      })
      .from(users)
      .where(eq(users.role, role));
    return rows as User[];
  }

  async getStudents(): Promise<Student[]> {
    return db.select().from(students);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: string, insertStudent: InsertStudent): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set(insertStudent)
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }

  async getSubjects(): Promise<Subject[]> {
    return db.select().from(subjects);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    return subject;
  }

  async updateSubject(id: string, insertSubject: InsertSubject): Promise<Subject | undefined> {
    const [subject] = await db
      .update(subjects)
      .set(insertSubject)
      .where(eq(subjects.id, id))
      .returning();
    return subject;
  }

  async deleteSubject(id: string): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.id, id)).returning();
    return result.length > 0;
  }

  async getGrades(): Promise<Grade[]> {
    return db.select().from(grades);
  }

  async getGrade(id: string): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.id, id));
    return grade;
  }

  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return db.select().from(grades).where(eq(grades.studentId, studentId));
  }

  async getGradesBySubject(subjectId: string): Promise<Grade[]> {
    return db.select().from(grades).where(eq(grades.subjectId, subjectId));
  }

  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const [grade] = await db.insert(grades).values(insertGrade).returning();
    return grade;
  }

  async updateGrade(id: string, insertGrade: InsertGrade): Promise<Grade | undefined> {
    const [grade] = await db
      .update(grades)
      .set(insertGrade)
      .where(eq(grades.id, id))
      .returning();
    return grade;
  }

  async deleteGrade(id: string): Promise<boolean> {
    const result = await db.delete(grades).where(eq(grades.id, id)).returning();
    return result.length > 0;
  }

  async deleteGradesByStudent(studentId: string): Promise<void> {
    await db.delete(grades).where(eq(grades.studentId, studentId));
  }

  async deleteGradesBySubject(subjectId: string): Promise<void> {
    await db.delete(grades).where(eq(grades.subjectId, subjectId));
  }

  async getCategoryWeights(subjectId: string): Promise<CategoryWeight[]> {
    return db.select().from(categoryWeights).where(eq(categoryWeights.subjectId, subjectId));
  }

  async getAllCategoryWeights(): Promise<CategoryWeight[]> {
    return db.select().from(categoryWeights);
  }

  async setCategoryWeight(data: InsertCategoryWeight): Promise<CategoryWeight> {
    const [existing] = await db
      .select()
      .from(categoryWeights)
      .where(
        and(
          eq(categoryWeights.subjectId, data.subjectId),
          eq(categoryWeights.category, data.category),
        ),
      );
    if (existing) {
      const [updated] = await db
        .update(categoryWeights)
        .set({ weight: data.weight })
        .where(eq(categoryWeights.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(categoryWeights).values(data).returning();
    return created;
  }

  async updateCategoryWeight(id: string, data: InsertCategoryWeight): Promise<CategoryWeight | undefined> {
    const [updated] = await db
      .update(categoryWeights)
      .set(data)
      .where(eq(categoryWeights.id, id))
      .returning();
    return updated;
  }

  async deleteCategoryWeight(id: string): Promise<boolean> {
    const result = await db.delete(categoryWeights).where(eq(categoryWeights.id, id)).returning();
    return result.length > 0;
  }

  async deleteCategoryWeightsBySubject(subjectId: string): Promise<void> {
    await db.delete(categoryWeights).where(eq(categoryWeights.subjectId, subjectId));
  }

  async getTeachers(): Promise<Teacher[]> {
    return db.select().from(teachers);
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db.insert(teachers).values(insertTeacher).returning();
    return teacher;
  }

  async updateTeacher(id: string, insertTeacher: InsertTeacher): Promise<Teacher | undefined> {
    const [teacher] = await db
      .update(teachers)
      .set(insertTeacher)
      .where(eq(teachers.id, id))
      .returning();
    return teacher;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id)).returning();
    return result.length > 0;
  }

  async getTeacherSubjects(teacherId: string): Promise<TeacherSubject[]> {
    return db.select().from(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
  }

  async getAllTeacherSubjects(): Promise<TeacherSubject[]> {
    return db.select().from(teacherSubjects);
  }

  async assignSubjectToTeacher(insert: InsertTeacherSubject): Promise<TeacherSubject> {
    const [assignment] = await db.insert(teacherSubjects).values(insert).returning();
    return assignment;
  }

  async removeTeacherSubject(id: string): Promise<boolean> {
    const result = await db.delete(teacherSubjects).where(eq(teacherSubjects.id, id)).returning();
    return result.length > 0;
  }

  async removeTeacherSubjectsByTeacher(teacherId: string): Promise<void> {
    await db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
  }

  async removeTeacherSubjectsBySubject(subjectId: string): Promise<void> {
    await db.delete(teacherSubjects).where(eq(teacherSubjects.subjectId, subjectId));
  }

  async getAcademicYears(): Promise<AcademicYear[]> {
    return db.select().from(academicYears);
  }

  async getAcademicYear(id: string): Promise<AcademicYear | undefined> {
    const [year] = await db.select().from(academicYears).where(eq(academicYears.id, id));
    return year;
  }

  async createAcademicYear(data: InsertAcademicYear): Promise<AcademicYear> {
    const [year] = await db.insert(academicYears).values(data).returning();
    return year;
  }

  async updateAcademicYear(id: string, data: InsertAcademicYear): Promise<AcademicYear | undefined> {
    const [year] = await db.update(academicYears).set(data).where(eq(academicYears.id, id)).returning();
    return year;
  }

  async deleteAcademicYear(id: string): Promise<boolean> {
    const result = await db.delete(academicYears).where(eq(academicYears.id, id)).returning();
    return result.length > 0;
  }

  async deactivateAllAcademicYears(exceptId?: string): Promise<void> {
    if (exceptId) {
      await db.update(academicYears).set({ isActive: false }).where(ne(academicYears.id, exceptId));
    } else {
      await db.update(academicYears).set({ isActive: false });
    }
  }

  async getTerms(): Promise<Term[]> {
    return db.select().from(terms);
  }

  async getTerm(id: string): Promise<Term | undefined> {
    const [term] = await db.select().from(terms).where(eq(terms.id, id));
    return term;
  }

  async getTermsByAcademicYear(academicYearId: string): Promise<Term[]> {
    return db.select().from(terms).where(eq(terms.academicYearId, academicYearId));
  }

  async createTerm(data: InsertTerm): Promise<Term> {
    const [term] = await db.insert(terms).values(data).returning();
    return term;
  }

  async deleteTerm(id: string): Promise<boolean> {
    const result = await db.delete(terms).where(eq(terms.id, id)).returning();
    return result.length > 0;
  }

  async deactivateAllTerms(exceptId?: string): Promise<void> {
    if (exceptId) {
      await db.update(terms).set({ isActive: false }).where(ne(terms.id, exceptId));
    } else {
      await db.update(terms).set({ isActive: false });
    }
  }

  async getSections(): Promise<Section[]> {
    return db.select().from(sections);
  }

  async getSection(id: string): Promise<Section | undefined> {
    const [section] = await db.select().from(sections).where(eq(sections.id, id));
    return section;
  }

  async createSection(data: InsertSection): Promise<Section> {
    const [section] = await db.insert(sections).values(data).returning();
    return section;
  }

  async deleteSection(id: string): Promise<boolean> {
    const result = await db.delete(sections).where(eq(sections.id, id)).returning();
    return result.length > 0;
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return db.select().from(enrollments);
  }

  async getEnrollmentsBySection(sectionId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.sectionId, sectionId));
  }

  async createEnrollment(data: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(data).returning();
    return enrollment;
  }

  async deleteEnrollment(id: string): Promise<boolean> {
    const result = await db.delete(enrollments).where(eq(enrollments.id, id)).returning();
    return result.length > 0;
  }

  async deleteEnrollmentsBySection(sectionId: string): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.sectionId, sectionId));
  }
}

export const storage = new DatabaseStorage();
