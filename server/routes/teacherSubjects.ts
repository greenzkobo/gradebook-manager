import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeUUID } from "../utils/sanitize";
import { storage } from "../storage";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const assignments = await storage.getAllTeacherSubjects();
  res.json(assignments);
});

router.get("/:teacherId", requireAuth, async (req, res) => {
  try {
    const teacherId = sanitizeUUID(req.params.teacherId);
    const assignments = await storage.getTeacherSubjects(teacherId);
    res.json(assignments);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const teacherId = sanitizeUUID(req.body.teacherId);
    const subjectId = sanitizeUUID(req.body.subjectId);

    const teacher = await storage.getTeacher(teacherId);
    if (!teacher) return res.status(400).json({ error: "Teacher not found" });
    const subject = await storage.getSubject(subjectId);
    if (!subject) return res.status(400).json({ error: "Subject not found" });

    const existing = await storage.getTeacherSubjects(teacherId);
    if (existing.some((ts) => ts.subjectId === subjectId)) {
      return res.status(400).json({ error: "Subject already assigned to this teacher" });
    }

    const assignment = await storage.assignSubjectToTeacher({ teacherId, subjectId });
    res.status(201).json(assignment);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to assign subject" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const deleted = await storage.removeTeacherSubject(id);
    if (!deleted) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
