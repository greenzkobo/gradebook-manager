import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeString, sanitizeEmail, sanitizeUUID } from "../utils/sanitize";
import { storage } from "../storage";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  if (req.user?.role === "student") {
    return res.status(403).json({ error: "Access denied: insufficient permissions" });
  }
  const teachers = await storage.getTeachers();
  res.json(teachers);
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const teacher = await storage.getTeacher(id);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.json(teacher);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const fullName = sanitizeString(req.body.fullName);
    const email = req.body.email ? sanitizeEmail(req.body.email) : null;

    if (!fullName) return res.status(400).json({ error: "Full name is required" });

    const teacher = await storage.createTeacher({ fullName, email });
    res.status(201).json(teacher);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to create teacher" });
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const fullName = sanitizeString(req.body.fullName);
    const email = req.body.email ? sanitizeEmail(req.body.email) : null;

    if (!fullName) return res.status(400).json({ error: "Full name is required" });

    const teacher = await storage.updateTeacher(id, { fullName, email });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.json(teacher);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to update teacher" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    await storage.removeTeacherSubjectsByTeacher(id);
    const deleted = await storage.deleteTeacher(id);
    if (!deleted) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
