import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeString, sanitizeOptionalString, sanitizeUUID } from "../utils/sanitize";
import { storage } from "../storage";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const subjects = await storage.getSubjects();
  res.json(subjects);
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const subject = await storage.getSubject(id);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json(subject);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const name = sanitizeString(req.body.name);
    const description = sanitizeOptionalString(req.body.description);

    if (!name) return res.status(400).json({ error: "Name is required" });

    const subject = await storage.createSubject({ name, description });
    res.status(201).json(subject);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to create subject" });
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const name = sanitizeString(req.body.name);
    const description = sanitizeOptionalString(req.body.description);

    if (!name) return res.status(400).json({ error: "Name is required" });

    const subject = await storage.updateSubject(id, { name, description });
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json(subject);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to update subject" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    await storage.deleteGradesBySubject(id);
    await storage.removeTeacherSubjectsBySubject(id);
    await storage.deleteCategoryWeightsBySubject(id);
    const deleted = await storage.deleteSubject(id);
    if (!deleted) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
