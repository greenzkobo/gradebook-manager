import { eq, and } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  students,
  subjects,
  grades,
  categoryWeights,
  teachers,
  teacherSubjects,
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
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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
}

export const storage = new DatabaseStorage();
