import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeString, sanitizeUUID, sanitizeISODate } from "../utils/sanitize";
import { storage } from "../storage";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const allTerms = await storage.getTerms();
  res.json(allTerms);
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const academicYearId = sanitizeUUID(req.body.academicYearId);
    const name = sanitizeString(req.body.name);
    const startDate = sanitizeISODate(req.body.startDate);
    const endDate = sanitizeISODate(req.body.endDate);
    const isActive = Boolean(req.body.isActive);

    if (!name) return res.status(400).json({ error: "Name is required" });

    const year = await storage.getAcademicYear(academicYearId);
    if (!year) {
      return res.status(400).json({ error: "Academic year not found" });
    }
    if (isActive) {
      await storage.deactivateAllTerms();
    }
    const term = await storage.createTerm({ academicYearId, name, startDate, endDate, isActive });
    res.status(201).json(term);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to create term" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const allSections = await storage.getSections();
    const sectionsForTerm = allSections.filter((s) => s.termId === id);
    if (sectionsForTerm.length > 0) {
      return res.status(400).json({ error: "Cannot delete term with existing sections. Delete sections first." });
    }
    const deleted = await storage.deleteTerm(id);
    if (!deleted) {
      return res.status(404).json({ error: "Term not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
