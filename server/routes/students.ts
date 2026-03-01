import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeString, sanitizeOptionalString, sanitizeEmail, sanitizeUUID } from "../utils/sanitize";
import { storage } from "../storage";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  if (req.user?.role === "student") {
    if (req.user.studentId) {
      const student = await storage.getStudent(req.user.studentId);
      return res.json(student ? [student] : []);
    }
    return res.json([]);
  }
  const students = await storage.getStudents();
  res.json(students);
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const student = await storage.getStudent(id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const fullName = sanitizeString(req.body.fullName);
    const gradeLevel = sanitizeString(req.body.gradeLevel);
    const email = req.body.email ? sanitizeEmail(req.body.email) : null;

    if (!fullName) return res.status(400).json({ error: "Full name is required" });
    if (!gradeLevel) return res.status(400).json({ error: "Grade level is required" });

    const student = await storage.createStudent({ fullName, gradeLevel, email });
    res.status(201).json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to create student" });
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const fullName = sanitizeString(req.body.fullName);
    const gradeLevel = sanitizeString(req.body.gradeLevel);
    const email = req.body.email ? sanitizeEmail(req.body.email) : null;

    if (!fullName) return res.status(400).json({ error: "Full name is required" });
    if (!gradeLevel) return res.status(400).json({ error: "Grade level is required" });

    const student = await storage.updateStudent(id, { fullName, gradeLevel, email });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to update student" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    await storage.deleteGradesByStudent(id);
    const deleted = await storage.deleteStudent(id);
    if (!deleted) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
