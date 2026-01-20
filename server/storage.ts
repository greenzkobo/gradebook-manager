import {
  type User,
  type InsertUser,
  type Student,
  type InsertStudent,
  type Subject,
  type InsertSubject,
  type Grade,
  type InsertGrade,
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private students: Map<string, Student>;
  private subjects: Map<string, Subject>;
  private grades: Map<string, Grade>;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.subjects = new Map();
    this.grades = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { ...insertStudent, id };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, insertStudent: InsertStudent): Promise<Student | undefined> {
    const existing = this.students.get(id);
    if (!existing) return undefined;
    const updated: Student = { ...insertStudent, id };
    this.students.set(id, updated);
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }

  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = randomUUID();
    const subject: Subject = { ...insertSubject, id };
    this.subjects.set(id, subject);
    return subject;
  }

  async updateSubject(id: string, insertSubject: InsertSubject): Promise<Subject | undefined> {
    const existing = this.subjects.get(id);
    if (!existing) return undefined;
    const updated: Subject = { ...insertSubject, id };
    this.subjects.set(id, updated);
    return updated;
  }

  async deleteSubject(id: string): Promise<boolean> {
    return this.subjects.delete(id);
  }

  async getGrades(): Promise<Grade[]> {
    return Array.from(this.grades.values());
  }

  async getGrade(id: string): Promise<Grade | undefined> {
    return this.grades.get(id);
  }

  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter((g) => g.studentId === studentId);
  }

  async getGradesBySubject(subjectId: string): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter((g) => g.subjectId === subjectId);
  }

  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const id = randomUUID();
    const grade: Grade = { ...insertGrade, id };
    this.grades.set(id, grade);
    return grade;
  }

  async updateGrade(id: string, insertGrade: InsertGrade): Promise<Grade | undefined> {
    const existing = this.grades.get(id);
    if (!existing) return undefined;
    const updated: Grade = { ...insertGrade, id };
    this.grades.set(id, updated);
    return updated;
  }

  async deleteGrade(id: string): Promise<boolean> {
    return this.grades.delete(id);
  }

  async deleteGradesByStudent(studentId: string): Promise<void> {
    const toDelete = Array.from(this.grades.entries())
      .filter(([, g]) => g.studentId === studentId)
      .map(([id]) => id);
    toDelete.forEach((id) => this.grades.delete(id));
  }

  async deleteGradesBySubject(subjectId: string): Promise<void> {
    const toDelete = Array.from(this.grades.entries())
      .filter(([, g]) => g.subjectId === subjectId)
      .map(([id]) => id);
    toDelete.forEach((id) => this.grades.delete(id));
  }
}

export const storage = new MemStorage();
