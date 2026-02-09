import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertSubjectSchema, insertGradeSchema, insertTeacherSchema, insertTeacherSubjectSchema, insertCategoryWeightSchema } from "@shared/schema";
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

  app.put("/api/grades/:id", upload.single("file"), async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.score !== undefined) body.score = Number(body.score);
      if (body.maxScore !== undefined) body.maxScore = Number(body.maxScore);
      if (body.category === "") body.category = null;
      if (body.term === "") body.term = null;
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

  return httpServer;
}
