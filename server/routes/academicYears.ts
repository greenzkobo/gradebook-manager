import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeString, sanitizeUUID, sanitizeISODate } from "../utils/sanitize";
import { storage } from "../storage";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const years = await storage.getAcademicYears();
  res.json(years);
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const year = await storage.getAcademicYear(id);
    if (!year) {
      return res.status(404).json({ error: "Academic year not found" });
    }
    res.json(year);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const name = sanitizeString(req.body.name);
    const startDate = sanitizeISODate(req.body.startDate);
    const endDate = sanitizeISODate(req.body.endDate);
    const isActive = Boolean(req.body.isActive);

    if (!name) return res.status(400).json({ error: "Name is required" });

    if (isActive) {
      await storage.deactivateAllAcademicYears();
    }
    const year = await storage.createAcademicYear({ name, startDate, endDate, isActive });
    res.status(201).json(year);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to create academic year" });
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const name = sanitizeString(req.body.name);
    const startDate = sanitizeISODate(req.body.startDate);
    const endDate = sanitizeISODate(req.body.endDate);
    const isActive = Boolean(req.body.isActive);

    if (!name) return res.status(400).json({ error: "Name is required" });

    if (isActive) {
      await storage.deactivateAllAcademicYears(id);
    }
    const year = await storage.updateAcademicYear(id, { name, startDate, endDate, isActive });
    if (!year) {
      return res.status(404).json({ error: "Academic year not found" });
    }
    res.json(year);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to update academic year" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const termsForYear = await storage.getTermsByAcademicYear(id);
    if (termsForYear.length > 0) {
      return res.status(400).json({ error: "Cannot delete academic year with existing terms. Delete terms first." });
    }
    const deleted = await storage.deleteAcademicYear(id);
    if (!deleted) {
      return res.status(404).json({ error: "Academic year not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
