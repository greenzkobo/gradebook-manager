import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";
import { sanitizeString, sanitizeOptionalString, sanitizeUUID, sanitizeScore, sanitizeGradeCategory, sanitizeISODate } from "../utils/sanitize";
import { storage } from "../storage";
import { insertGradeSchema } from "@shared/schema";
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

async function getTeacherSubjectIds(teacherId: string): Promise<string[]> {
  const assignments = await storage.getTeacherSubjects(teacherId);
  return assignments.map((a) => a.subjectId);
}

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const allGrades = await storage.getGrades();

    if (req.user?.role === "student") {
      const filtered = allGrades.filter((g) => g.studentId === req.user!.studentId);
      return res.json(filtered);
    }

    if (req.user?.role === "teacher" && req.user.teacherId) {
      const subjectIds = await getTeacherSubjectIds(req.user.teacherId);
      const filtered = allGrades.filter((g) => subjectIds.includes(g.subjectId));
      return res.json(filtered);
    }

    if (req.query.studentId) {
      const studentId = sanitizeUUID(req.query.studentId as string);
      return res.json(allGrades.filter((g) => g.studentId === studentId));
    }
    if (req.query.subjectId) {
      const subjectId = sanitizeUUID(req.query.subjectId as string);
      return res.json(allGrades.filter((g) => g.subjectId === subjectId));
    }

    res.json(allGrades);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const grade = await storage.getGrade(id);
    if (!grade) {
      return res.status(404).json({ error: "Grade not found" });
    }
    if (req.user?.role === "student" && grade.studentId !== req.user.studentId) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }
    res.json(grade);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/", requireAuth, requireRole("admin", "teacher"), uploadLimiter, upload.single("file"), async (req, res) => {
  try {
    const studentId = sanitizeUUID(req.body.studentId);
    const subjectId = sanitizeUUID(req.body.subjectId);
    const { score, maxScore } = sanitizeScore(req.body.score, req.body.maxScore);
    const assignmentName = sanitizeString(req.body.assignmentName || "");
    const category = sanitizeGradeCategory(req.body.category);
    const term = sanitizeOptionalString(req.body.term);
    const date = req.body.date ? sanitizeISODate(req.body.date) : null;

    if (req.user?.role === "teacher" && req.user.teacherId) {
      const subjectIds = await getTeacherSubjectIds(req.user.teacherId);
      if (!subjectIds.includes(subjectId)) {
        return res.status(403).json({ error: "Access denied: you are not assigned to this subject" });
      }
    }

    const student = await storage.getStudent(studentId);
    if (!student) return res.status(400).json({ error: "Student not found" });
    const subject = await storage.getSubject(subjectId);
    if (!subject) return res.status(400).json({ error: "Subject not found" });

    const body: any = {
      studentId,
      subjectId,
      score,
      maxScore,
      assignmentName: assignmentName || null,
      category,
      term,
      date,
      fileName: null,
      fileUrl: null,
    };

    if (req.file) {
      body.fileName = req.file.originalname;
      body.fileUrl = `/uploads/${req.file.filename}`;
    }

    const data = insertGradeSchema.parse(body);
    const grade = await storage.createGrade(data);
    res.status(201).json(grade);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(400).json({ error: error.message || "Failed to create grade" });
  }
});

router.post("/bulk", requireAuth, requireRole("admin", "teacher"), uploadLimiter, upload.single("file"), async (req, res) => {
  try {
    const subjectId = sanitizeUUID(req.body.subjectId);
    const { score, maxScore } = sanitizeScore(req.body.score, req.body.maxScore);
    const assignmentName = sanitizeString(req.body.assignmentName || "");
    const category = sanitizeGradeCategory(req.body.category);
    const term = sanitizeOptionalString(req.body.term);
    const date = req.body.date ? sanitizeISODate(req.body.date) : null;

    if (req.user?.role === "teacher" && req.user.teacherId) {
      const subjectIds = await getTeacherSubjectIds(req.user.teacherId);
      if (!subjectIds.includes(subjectId)) {
        return res.status(403).json({ error: "Access denied: you are not assigned to this subject" });
      }
    }

    const subject = await storage.getSubject(subjectId);
    if (!subject) return res.status(400).json({ error: "Subject not found" });

    let fileName: string | null = null;
    let fileUrl: string | null = null;
    if (req.file) {
      fileName = req.file.originalname;
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const allStudents = await storage.getStudents();
    if (allStudents.length === 0) {
      return res.status(400).json({ error: "No students found" });
    }

    const createdGrades = [];
    for (const student of allStudents) {
      const gradeData = insertGradeSchema.parse({
        studentId: student.id,
        subjectId,
        score,
        maxScore,
        assignmentName: assignmentName || null,
        category,
        term,
        date,
        fileName,
        fileUrl,
      });
      const grade = await storage.createGrade(gradeData);
      createdGrades.push(grade);
    }

    res.status(201).json(createdGrades);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(400).json({ error: error.message || "Failed to create grades" });
  }
});

router.put("/:id", requireAuth, requireRole("admin", "teacher"), uploadLimiter, upload.single("file"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const studentId = sanitizeUUID(req.body.studentId);
    const subjectId = sanitizeUUID(req.body.subjectId);
    const { score, maxScore } = sanitizeScore(req.body.score, req.body.maxScore);
    const assignmentName = sanitizeString(req.body.assignmentName || "");
    const category = sanitizeGradeCategory(req.body.category);
    const term = sanitizeOptionalString(req.body.term);
    const date = req.body.date ? sanitizeISODate(req.body.date) : null;

    if (req.user?.role === "teacher" && req.user.teacherId) {
      const subjectIds = await getTeacherSubjectIds(req.user.teacherId);
      if (!subjectIds.includes(subjectId)) {
        return res.status(403).json({ error: "Access denied: you are not assigned to this subject" });
      }
    }

    const student = await storage.getStudent(studentId);
    if (!student) return res.status(400).json({ error: "Student not found" });
    const subject = await storage.getSubject(subjectId);
    if (!subject) return res.status(400).json({ error: "Subject not found" });

    const body: any = {
      studentId,
      subjectId,
      score,
      maxScore,
      assignmentName: assignmentName || null,
      category,
      term,
      date,
      fileName: null,
      fileUrl: null,
    };

    if (req.file) {
      body.fileName = req.file.originalname;
      body.fileUrl = `/uploads/${req.file.filename}`;
    }

    const data = insertGradeSchema.parse(body);
    const grade = await storage.updateGrade(id, data);
    if (!grade) {
      return res.status(404).json({ error: "Grade not found" });
    }
    res.json(grade);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(400).json({ error: error.message || "Failed to update grade" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const grade = await storage.getGrade(id);
    if (grade?.fileUrl) {
      const filePath = path.join(process.cwd(), grade.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    const deleted = await storage.deleteGrade(id);
    if (!deleted) {
      return res.status(404).json({ error: "Grade not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
