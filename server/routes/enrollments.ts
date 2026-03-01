import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeUUID, sanitizeISODate, sanitizeStatus } from "../utils/sanitize";
import { storage } from "../storage";
import { insertEnrollmentSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const allEnrollments = await storage.getEnrollments();

  if (req.user?.role === "student" && req.user.studentId) {
    return res.json(allEnrollments.filter((e) => e.studentId === req.user!.studentId));
  }

  if (req.user?.role === "teacher" && req.user.teacherId) {
    const allSections = await storage.getSections();
    const teacherSectionIds = allSections
      .filter((s) => s.teacherId === req.user!.teacherId)
      .map((s) => s.id);
    return res.json(allEnrollments.filter((e) => teacherSectionIds.includes(e.sectionId)));
  }

  res.json(allEnrollments);
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const studentId = sanitizeUUID(req.body.studentId);
    const sectionId = sanitizeUUID(req.body.sectionId);
    const enrollDate = sanitizeISODate(req.body.enrollDate);
    const status = sanitizeStatus(req.body.status);

    const student = await storage.getStudent(studentId);
    if (!student) return res.status(400).json({ error: "Student not found" });
    const section = await storage.getSection(sectionId);
    if (!section) return res.status(400).json({ error: "Section not found" });

    const existingEnrollments = await storage.getEnrollmentsBySection(sectionId);
    if (existingEnrollments.some((e) => e.studentId === studentId && e.status === "active")) {
      return res.status(400).json({ error: "Student already enrolled in this section" });
    }

    const data = insertEnrollmentSchema.parse({ studentId, sectionId, enrollDate, status });
    const enrollment = await storage.createEnrollment(data);
    res.status(201).json(enrollment);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(400).json({ error: error.message || "Failed to create enrollment" });
  }
});

router.post("/bulk", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const sectionId = sanitizeUUID(req.body.sectionId);
    const studentIds = req.body.studentIds;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "studentIds array is required" });
    }
    const sanitizedStudentIds = studentIds.map((id: unknown) => sanitizeUUID(id));
    const enrollDate = req.body.enrollDate
      ? sanitizeISODate(req.body.enrollDate)
      : new Date().toISOString().split("T")[0];
    const status = req.body.status ? sanitizeStatus(req.body.status) : "active";

    const section = await storage.getSection(sectionId);
    if (!section) return res.status(400).json({ error: "Section not found" });

    const existingEnrollments = await storage.getEnrollmentsBySection(sectionId);

    const created = [];
    for (const studentId of sanitizedStudentIds) {
      const student = await storage.getStudent(studentId);
      if (!student) continue;
      if (existingEnrollments.some((e) => e.studentId === studentId && e.status === "active")) continue;
      const data = insertEnrollmentSchema.parse({
        studentId,
        sectionId,
        enrollDate,
        status,
      });
      const enrollment = await storage.createEnrollment(data);
      created.push(enrollment);
    }
    res.status(201).json(created);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(400).json({ error: error.message || "Failed to create enrollments" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = sanitizeUUID(req.params.id);
    const deleted = await storage.deleteEnrollment(id);
    if (!deleted) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
