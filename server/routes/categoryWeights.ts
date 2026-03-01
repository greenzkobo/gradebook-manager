import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeUUID, sanitizeGradeCategory, sanitizeInteger } from "../utils/sanitize";
import { storage } from "../storage";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const weights = await storage.getAllCategoryWeights();
  res.json(weights);
});

router.get("/:subjectId", requireAuth, async (req, res) => {
  try {
    const subjectId = sanitizeUUID(req.params.subjectId);
    const weights = await storage.getCategoryWeights(subjectId);
    res.json(weights);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/", requireAuth, requireRole("admin", "teacher"), async (req, res) => {
  try {
    const subjectId = sanitizeUUID(req.body.subjectId);
    const category = sanitizeGradeCategory(req.body.category);
    if (!category) return res.status(400).json({ error: "Category is required" });
    const weight = sanitizeInteger(req.body.weight, 1, 100);

    const subject = await storage.getSubject(subjectId);
    if (!subject) return res.status(400).json({ error: "Subject not found" });

    const existingWeights = await storage.getCategoryWeights(subjectId);
    const currentTotal = existingWeights
      .filter((w) => w.category !== category)
      .reduce((sum, w) => sum + w.weight, 0);
    if (currentTotal + weight > 100) {
      return res.status(400).json({ error: `Total weight would exceed 100%. Available: ${100 - currentTotal}%` });
    }

    const result = await storage.setCategoryWeight({ subjectId, category, weight });
    res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Failed to set category weight" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const deleted = await storage.deleteCategoryWeight(id);
    if (!deleted) {
      return res.status(404).json({ error: "Category weight not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
