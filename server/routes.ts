import type { Express } from "express";
import { type Server } from "http";
import { pool } from "./db";
import path from "path";
import fs from "fs";

import authRouter from "./routes/auth";
import studentsRouter from "./routes/students";
import teachersRouter from "./routes/teachers";
import subjectsRouter from "./routes/subjects";
import gradesRouter from "./routes/grades";
import academicYearsRouter from "./routes/academicYears";
import termsRouter from "./routes/terms";
import sectionsRouter from "./routes/sections";
import enrollmentsRouter from "./routes/enrollments";
import categoryWeightsRouter from "./routes/categoryWeights";
import teacherSubjectsRouter from "./routes/teacherSubjects";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use("/uploads", (req, res, _next) => {
    const fileName = path.basename(req.path);
    const filePath = path.join(uploadsDir, fileName);
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  app.get("/api/health", async (_req, res) => {
    try {
      const result = await pool.query("SELECT NOW()");
      res.json({ status: "ok", timestamp: result.rows[0].now });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Database connection failed" });
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/students", studentsRouter);
  app.use("/api/teachers", teachersRouter);
  app.use("/api/subjects", subjectsRouter);
  app.use("/api/grades", gradesRouter);
  app.use("/api/academic-years", academicYearsRouter);
  app.use("/api/terms", termsRouter);
  app.use("/api/sections", sectionsRouter);
  app.use("/api/enrollments", enrollmentsRouter);
  app.use("/api/category-weights", categoryWeightsRouter);
  app.use("/api/teacher-subjects", teacherSubjectsRouter);

  return httpServer;
}
