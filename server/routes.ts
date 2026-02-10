import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { insertStudentSchema, insertSubjectSchema, insertGradeSchema, insertTeacherSchema, insertTeacherSubjectSchema, insertCategoryWeightSchema, insertAcademicYearSchema, insertTermSchema, insertSectionSchema, insertEnrollmentSchema, ENROLLMENT_STATUSES } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
];

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Please upload a document or image file."));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use("/uploads", (req, res, _next) => {
    const fileName = path.basename(req.path);
    const filePath = path.join(uploadsDir, fileName);
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  app.get("/api/health", async (_req, res) => {
    try {
      const result = await pool.query("SELECT NOW()");
      res.json({ status: "ok", timestamp: result.rows[0].now });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Database connection failed" });
    }
  });

  // Students API
  app.get("/api/students", async (_req, res) => {
    const students = await storage.getStudents();
    res.json(students);
  });

  app.get("/api/students/:id", async (req, res) => {
    const student = await storage.getStudent(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(student);
  });

  app.post("/api/students", async (req, res) => {
    try {
      const data = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(data);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const data = insertStudentSchema.parse(req.body);
      const student = await storage.updateStudent(req.params.id, data);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    await storage.deleteGradesByStudent(req.params.id);
    const deleted = await storage.deleteStudent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(204).send();
  });

  // Subjects API
  app.get("/api/subjects", async (_req, res) => {
    const subjects = await storage.getSubjects();
    res.json(subjects);
  });

  app.get("/api/subjects/:id", async (req, res) => {
    const subject = await storage.getSubject(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json(subject);
  });

  app.post("/api/subjects", async (req, res) => {
    try {
      const data = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(data);
      res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create subject" });
    }
  });

  app.put("/api/subjects/:id", async (req, res) => {
    try {
      const data = insertSubjectSchema.parse(req.body);
      const subject = await storage.updateSubject(req.params.id, data);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update subject" });
    }
  });

  app.delete("/api/subjects/:id", async (req, res) => {
    await storage.deleteGradesBySubject(req.params.id);
    await storage.removeTeacherSubjectsBySubject(req.params.id);
    await storage.deleteCategoryWeightsBySubject(req.params.id);
    const deleted = await storage.deleteSubject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.status(204).send();
  });

  // Grades API
  app.get("/api/grades", async (_req, res) => {
    const grades = await storage.getGrades();
    res.json(grades);
  });

  app.get("/api/grades/:id", async (req, res) => {
    const grade = await storage.getGrade(req.params.id);
    if (!grade) {
      return res.status(404).json({ error: "Grade not found" });
    }
    res.json(grade);
  });

  app.post("/api/grades", upload.single("file"), async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.score !== undefined) body.score = Number(body.score);
      if (body.maxScore !== undefined) body.maxScore = Number(body.maxScore);
      if (body.category === "") body.category = null;
      if (body.term === "") body.term = null;
      if (body.assignmentName === "") body.assignmentName = null;
      if (body.fileName === "") body.fileName = null;
      if (body.fileUrl === "") body.fileUrl = null;

      const data = insertGradeSchema.parse(body);
      const student = await storage.getStudent(data.studentId);
      if (!student) {
        return res.status(400).json({ error: "Student not found" });
      }
      const subject = await storage.getSubject(data.subjectId);
      if (!subject) {
        return res.status(400).json({ error: "Subject not found" });
      }

      if (req.file) {
        data.fileName = req.file.originalname;
        data.fileUrl = `/uploads/${req.file.filename}`;
      }

      const grade = await storage.createGrade(data);
      res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create grade" });
    }
  });

  app.post("/api/grades/bulk", upload.single("file"), async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.score !== undefined) body.score = Number(body.score);
      if (body.maxScore !== undefined) body.maxScore = Number(body.maxScore);
      if (body.category === "") body.category = null;
      if (body.term === "") body.term = null;
      if (body.assignmentName === "") body.assignmentName = null;
      if (body.fileName === "") body.fileName = null;
      if (body.fileUrl === "") body.fileUrl = null;

      const subject = await storage.getSubject(body.subjectId);
      if (!subject) {
        return res.status(400).json({ error: "Subject not found" });
      }

      if (req.file) {
        body.fileName = req.file.originalname;
        body.fileUrl = `/uploads/${req.file.filename}`;
      }

      const allStudents = await storage.getStudents();
      if (allStudents.length === 0) {
        return res.status(400).json({ error: "No students found" });
      }

      const createdGrades = [];
      for (const student of allStudents) {
        const gradeData = {
          ...body,
          studentId: student.id,
        };
        const data = insertGradeSchema.parse(gradeData);
        const grade = await storage.createGrade(data);
        createdGrades.push(grade);
      }

      res.status(201).json(createdGrades);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create grades" });
    }
  });

  app.put("/api/grades/:id", upload.single("file"), async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.score !== undefined) body.score = Number(body.score);
      if (body.maxScore !== undefined) body.maxScore = Number(body.maxScore);
      if (body.category === "") body.category = null;
      if (body.term === "") body.term = null;
      if (body.assignmentName === "") body.assignmentName = null;
      if (body.fileName === "") body.fileName = null;
      if (body.fileUrl === "") body.fileUrl = null;

      const data = insertGradeSchema.parse(body);
      const student = await storage.getStudent(data.studentId);
      if (!student) {
        return res.status(400).json({ error: "Student not found" });
      }
      const subject = await storage.getSubject(data.subjectId);
      if (!subject) {
        return res.status(400).json({ error: "Subject not found" });
      }

      if (req.file) {
        data.fileName = req.file.originalname;
        data.fileUrl = `/uploads/${req.file.filename}`;
      }

      const grade = await storage.updateGrade(req.params.id, data);
      if (!grade) {
        return res.status(404).json({ error: "Grade not found" });
      }
      res.json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update grade" });
    }
  });

  app.delete("/api/grades/:id", async (req, res) => {
    const grade = await storage.getGrade(req.params.id);
    if (grade?.fileUrl) {
      const filePath = path.join(process.cwd(), grade.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    const deleted = await storage.deleteGrade(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Grade not found" });
    }
    res.status(204).send();
  });

  // Category Weights API
  app.get("/api/category-weights", async (_req, res) => {
    const weights = await storage.getAllCategoryWeights();
    res.json(weights);
  });

  app.get("/api/category-weights/:subjectId", async (req, res) => {
    const weights = await storage.getCategoryWeights(req.params.subjectId);
    res.json(weights);
  });

  app.post("/api/category-weights", async (req, res) => {
    try {
      const data = insertCategoryWeightSchema.parse(req.body);
      if (data.weight < 1 || data.weight > 100) {
        return res.status(400).json({ error: "Weight must be between 1 and 100" });
      }
      const subject = await storage.getSubject(data.subjectId);
      if (!subject) {
        return res.status(400).json({ error: "Subject not found" });
      }
      const existingWeights = await storage.getCategoryWeights(data.subjectId);
      const currentTotal = existingWeights
        .filter((w) => w.category !== data.category)
        .reduce((sum, w) => sum + w.weight, 0);
      if (currentTotal + data.weight > 100) {
        return res.status(400).json({ error: `Total weight would exceed 100%. Available: ${100 - currentTotal}%` });
      }
      const weight = await storage.setCategoryWeight(data);
      res.status(201).json(weight);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to set category weight" });
    }
  });

  app.delete("/api/category-weights/:id", async (req, res) => {
    const deleted = await storage.deleteCategoryWeight(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Category weight not found" });
    }
    res.status(204).send();
  });

  // Teachers API
  app.get("/api/teachers", async (_req, res) => {
    const teachers = await storage.getTeachers();
    res.json(teachers);
  });

  app.get("/api/teachers/:id", async (req, res) => {
    const teacher = await storage.getTeacher(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.json(teacher);
  });

  app.post("/api/teachers", async (req, res) => {
    try {
      const data = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(data);
      res.status(201).json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create teacher" });
    }
  });

  app.put("/api/teachers/:id", async (req, res) => {
    try {
      const data = insertTeacherSchema.parse(req.body);
      const teacher = await storage.updateTeacher(req.params.id, data);
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update teacher" });
    }
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    await storage.removeTeacherSubjectsByTeacher(req.params.id);
    const deleted = await storage.deleteTeacher(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.status(204).send();
  });

  // Teacher-Subject Assignments API
  app.get("/api/teacher-subjects", async (_req, res) => {
    const assignments = await storage.getAllTeacherSubjects();
    res.json(assignments);
  });

  app.get("/api/teacher-subjects/:teacherId", async (req, res) => {
    const assignments = await storage.getTeacherSubjects(req.params.teacherId);
    res.json(assignments);
  });

  app.post("/api/teacher-subjects", async (req, res) => {
    try {
      const data = insertTeacherSubjectSchema.parse(req.body);
      const teacher = await storage.getTeacher(data.teacherId);
      if (!teacher) {
        return res.status(400).json({ error: "Teacher not found" });
      }
      const subject = await storage.getSubject(data.subjectId);
      if (!subject) {
        return res.status(400).json({ error: "Subject not found" });
      }
      const existing = await storage.getTeacherSubjects(data.teacherId);
      if (existing.some((ts) => ts.subjectId === data.subjectId)) {
        return res.status(400).json({ error: "Subject already assigned to this teacher" });
      }
      const assignment = await storage.assignSubjectToTeacher(data);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to assign subject" });
    }
  });

  app.delete("/api/teacher-subjects/:id", async (req, res) => {
    const deleted = await storage.removeTeacherSubject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    res.status(204).send();
  });

  // Academic Years API
  app.get("/api/academic-years", async (_req, res) => {
    const years = await storage.getAcademicYears();
    res.json(years);
  });

  app.get("/api/academic-years/:id", async (req, res) => {
    const year = await storage.getAcademicYear(req.params.id);
    if (!year) {
      return res.status(404).json({ error: "Academic year not found" });
    }
    res.json(year);
  });

  app.post("/api/academic-years", async (req, res) => {
    try {
      const data = insertAcademicYearSchema.parse(req.body);
      if (data.isActive) {
        await storage.deactivateAllAcademicYears();
      }
      const year = await storage.createAcademicYear(data);
      res.status(201).json(year);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create academic year" });
    }
  });

  app.put("/api/academic-years/:id", async (req, res) => {
    try {
      const data = insertAcademicYearSchema.parse(req.body);
      if (data.isActive) {
        await storage.deactivateAllAcademicYears(req.params.id);
      }
      const year = await storage.updateAcademicYear(req.params.id, data);
      if (!year) {
        return res.status(404).json({ error: "Academic year not found" });
      }
      res.json(year);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update academic year" });
    }
  });

  app.delete("/api/academic-years/:id", async (req, res) => {
    const termsForYear = await storage.getTermsByAcademicYear(req.params.id);
    if (termsForYear.length > 0) {
      return res.status(400).json({ error: "Cannot delete academic year with existing terms. Delete terms first." });
    }
    const deleted = await storage.deleteAcademicYear(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Academic year not found" });
    }
    res.status(204).send();
  });

  // Terms API
  app.get("/api/terms", async (_req, res) => {
    const allTerms = await storage.getTerms();
    res.json(allTerms);
  });

  app.post("/api/terms", async (req, res) => {
    try {
      const data = insertTermSchema.parse(req.body);
      const year = await storage.getAcademicYear(data.academicYearId);
      if (!year) {
        return res.status(400).json({ error: "Academic year not found" });
      }
      if (data.isActive) {
        await storage.deactivateAllTerms();
      }
      const term = await storage.createTerm(data);
      res.status(201).json(term);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create term" });
    }
  });

  app.delete("/api/terms/:id", async (req, res) => {
    const allSections = await storage.getSections();
    const sectionsForTerm = allSections.filter((s) => s.termId === req.params.id);
    if (sectionsForTerm.length > 0) {
      return res.status(400).json({ error: "Cannot delete term with existing sections. Delete sections first." });
    }
    const deleted = await storage.deleteTerm(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Term not found" });
    }
    res.status(204).send();
  });

  // Sections API
  app.get("/api/sections", async (_req, res) => {
    const allSections = await storage.getSections();
    res.json(allSections);
  });

  app.get("/api/sections/:id", async (req, res) => {
    const section = await storage.getSection(req.params.id);
    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }
    const sectionEnrollments = await storage.getEnrollmentsBySection(section.id);
    const enrolledCount = sectionEnrollments.filter((e) => e.status === "active").length;
    res.json({ ...section, enrolledCount });
  });

  app.post("/api/sections", async (req, res) => {
    try {
      const data = insertSectionSchema.parse(req.body);
      const subject = await storage.getSubject(data.subjectId);
      if (!subject) {
        return res.status(400).json({ error: "Subject not found" });
      }
      const teacher = await storage.getTeacher(data.teacherId);
      if (!teacher) {
        return res.status(400).json({ error: "Teacher not found" });
      }
      const term = await storage.getTerm(data.termId);
      if (!term) {
        return res.status(400).json({ error: "Term not found" });
      }
      const section = await storage.createSection(data);
      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create section" });
    }
  });

  app.delete("/api/sections/:id", async (req, res) => {
    await storage.deleteEnrollmentsBySection(req.params.id);
    const deleted = await storage.deleteSection(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Section not found" });
    }
    res.status(204).send();
  });

  // Enrollments API
  app.get("/api/enrollments", async (_req, res) => {
    const allEnrollments = await storage.getEnrollments();
    res.json(allEnrollments);
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const data = insertEnrollmentSchema.parse(req.body);
      if (!ENROLLMENT_STATUSES.includes(data.status as any)) {
        return res.status(400).json({ error: "Invalid status. Must be: active, dropped, or completed" });
      }
      const student = await storage.getStudent(data.studentId);
      if (!student) {
        return res.status(400).json({ error: "Student not found" });
      }
      const section = await storage.getSection(data.sectionId);
      if (!section) {
        return res.status(400).json({ error: "Section not found" });
      }
      const existingEnrollments = await storage.getEnrollmentsBySection(data.sectionId);
      if (existingEnrollments.some((e) => e.studentId === data.studentId && e.status === "active")) {
        return res.status(400).json({ error: "Student already enrolled in this section" });
      }
      const enrollment = await storage.createEnrollment(data);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  app.post("/api/enrollments/bulk", async (req, res) => {
    try {
      const { sectionId, studentIds, enrollDate, status } = req.body;
      if (!sectionId || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: "sectionId and studentIds array are required" });
      }
      const section = await storage.getSection(sectionId);
      if (!section) {
        return res.status(400).json({ error: "Section not found" });
      }
      const existingEnrollments = await storage.getEnrollmentsBySection(sectionId);
      const enrollmentDate = enrollDate || new Date().toISOString().split("T")[0];
      const enrollmentStatus = status || "active";
      if (!ENROLLMENT_STATUSES.includes(enrollmentStatus as any)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const created = [];
      for (const studentId of studentIds) {
        const student = await storage.getStudent(studentId);
        if (!student) continue;
        if (existingEnrollments.some((e) => e.studentId === studentId && e.status === "active")) continue;
        const data = insertEnrollmentSchema.parse({
          studentId,
          sectionId,
          enrollDate: enrollmentDate,
          status: enrollmentStatus,
        });
        const enrollment = await storage.createEnrollment(data);
        created.push(enrollment);
      }
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create enrollments" });
    }
  });

  app.delete("/api/enrollments/:id", async (req, res) => {
    const deleted = await storage.deleteEnrollment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    res.status(204).send();
  });

  return httpServer;
}
