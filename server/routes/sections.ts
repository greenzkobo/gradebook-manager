import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeString, sanitizeOptionalString, sanitizeUUID } from "../utils/sanitize";
import { storage } from "../storage";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const allSections = await storage.getSections();

  if (req.user?.role === "student" && req.user.studentId) {
    const allEnrollments = await storage.getEnrollments();
    const studentEnrollments = allEnrollments.filter((e) => e.studentId === req.user!.studentId);
    const enrolledSectionIds = studentEnrollments.map((e) => e.sectionId);
    return res.json(allSections.filter((s) => enrolledSectionIds.includes(s.id)));
  }

  if (req.user?.role === "teacher" && req.user.teacherId) {
    return res.json(allSections.filter((s) => s.teacherId === req.user!.teacherId));
  }

  res.json(allSections);
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const section = await storage.getSection(id);
    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }
    const sectionEnrollments = await storage.getEnrollmentsBySection(section.id);
    const enrolledCount = sectionEnrollments.filter((e) => e.status === "active").length;
    res.json({ ...section, enrolledCount });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const subjectId = sanitizeUUID(req.body.subjectId);
    const teacherId = sanitizeUUID(req.body.teacherId);
    const termId = sanitizeUUID(req.body.termId);
    const sectionName = sanitizeString(req.body.sectionName);
    const roomNumber = sanitizeOptionalString(req.body.roomNumber);

    if (!sectionName) return res.status(400).json({ error: "Section name is required" });

    const subject = await storage.getSubject(subjectId);
    if (!subject) return res.status(400).json({ error: "Subject not found" });
    const teacher = await storage.getTeacher(teacherId);
    if (!teacher) return res.status(400).json({ error: "Teacher not found" });
    const term = await storage.getTerm(termId);
    if (!term) return res.status(400).json({ error: "Term not found" });

    const section = await storage.createSection({ subjectId, teacherId, termId, sectionName, roomNumber });
    res.status(201).json(section);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to create section" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    await storage.deleteEnrollmentsBySection(id);
    const deleted = await storage.deleteSection(id);
    if (!deleted) {
      return res.status(404).json({ error: "Section not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
