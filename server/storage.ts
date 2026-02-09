import {
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private students: Map<string, Student>;
  private subjects: Map<string, Subject>;
  private grades: Map<string, Grade>;
  private teachers: Map<string, Teacher>;
  private teacherSubjects: Map<string, TeacherSubject>;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.subjects = new Map();
    this.grades = new Map();
    this.teachers = new Map();
    this.teacherSubjects = new Map();
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
    const student: Student = {
      id,
      fullName: insertStudent.fullName,
      gradeLevel: insertStudent.gradeLevel,
      email: insertStudent.email ?? null,
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, insertStudent: InsertStudent): Promise<Student | undefined> {
    const existing = this.students.get(id);
    if (!existing) return undefined;
    const updated: Student = {
      id,
      fullName: insertStudent.fullName,
      gradeLevel: insertStudent.gradeLevel,
      email: insertStudent.email ?? null,
    };
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
    const subject: Subject = {
      id,
      name: insertSubject.name,
      description: insertSubject.description ?? null,
    };
    this.subjects.set(id, subject);
    return subject;
  }

  async updateSubject(id: string, insertSubject: InsertSubject): Promise<Subject | undefined> {
    const existing = this.subjects.get(id);
    if (!existing) return undefined;
    const updated: Subject = {
      id,
      name: insertSubject.name,
      description: insertSubject.description ?? null,
    };
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
    const grade: Grade = {
      id,
      studentId: insertGrade.studentId,
      subjectId: insertGrade.subjectId,
      score: insertGrade.score,
      maxScore: insertGrade.maxScore ?? 100,
      term: insertGrade.term ?? null,
      date: insertGrade.date ?? null,
    };
    this.grades.set(id, grade);
    return grade;
  }

  async updateGrade(id: string, insertGrade: InsertGrade): Promise<Grade | undefined> {
    const existing = this.grades.get(id);
    if (!existing) return undefined;
    const updated: Grade = {
      id,
      studentId: insertGrade.studentId,
      subjectId: insertGrade.subjectId,
      score: insertGrade.score,
      maxScore: insertGrade.maxScore ?? 100,
      term: insertGrade.term ?? null,
      date: insertGrade.date ?? null,
    };
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

  async getTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const id = randomUUID();
    const teacher: Teacher = {
      id,
      fullName: insertTeacher.fullName,
      email: insertTeacher.email ?? null,
    };
    this.teachers.set(id, teacher);
    return teacher;
  }

  async updateTeacher(id: string, insertTeacher: InsertTeacher): Promise<Teacher | undefined> {
    const existing = this.teachers.get(id);
    if (!existing) return undefined;
    const updated: Teacher = {
      id,
      fullName: insertTeacher.fullName,
      email: insertTeacher.email ?? null,
    };
    this.teachers.set(id, updated);
    return updated;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    return this.teachers.delete(id);
  }

  async getTeacherSubjects(teacherId: string): Promise<TeacherSubject[]> {
    return Array.from(this.teacherSubjects.values()).filter(
      (ts) => ts.teacherId === teacherId
    );
  }

  async getAllTeacherSubjects(): Promise<TeacherSubject[]> {
    return Array.from(this.teacherSubjects.values());
  }

  async assignSubjectToTeacher(insert: InsertTeacherSubject): Promise<TeacherSubject> {
    const id = randomUUID();
    const assignment: TeacherSubject = {
      id,
      teacherId: insert.teacherId,
      subjectId: insert.subjectId,
    };
    this.teacherSubjects.set(id, assignment);
    return assignment;
  }

  async removeTeacherSubject(id: string): Promise<boolean> {
    return this.teacherSubjects.delete(id);
  }

  async removeTeacherSubjectsByTeacher(teacherId: string): Promise<void> {
    const toDelete = Array.from(this.teacherSubjects.entries())
      .filter(([, ts]) => ts.teacherId === teacherId)
      .map(([id]) => id);
    toDelete.forEach((id) => this.teacherSubjects.delete(id));
  }

  async removeTeacherSubjectsBySubject(subjectId: string): Promise<void> {
    const toDelete = Array.from(this.teacherSubjects.entries())
      .filter(([, ts]) => ts.subjectId === subjectId)
      .map(([id]) => id);
    toDelete.forEach((id) => this.teacherSubjects.delete(id));
  }
}

export const storage = new MemStorage();
