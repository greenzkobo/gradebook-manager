import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { sanitizeUUID } from "../utils/sanitize";

declare global {
  namespace Express {
    interface Request {
      user?: import("@shared/schema").User;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Session invalid" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(500).json({ error: "Authentication check failed" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }
    next();
  };
}

export async function requireOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role === "admin") {
    return next();
  }

  try {
    const gradeId = req.params.id;
    if (!gradeId) {
      return next();
    }

    let validId: string;
    try {
      validId = sanitizeUUID(gradeId);
    } catch {
      return next();
    }

    const grade = await storage.getGrade(validId);
    if (!grade) {
      return next();
    }

    if (req.user.role === "student") {
      if (req.user.studentId && req.user.studentId === grade.studentId) {
        return next();
      }
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }

    if (req.user.role === "teacher") {
      if (req.user.teacherId) {
        const teacherSubjects = await storage.getTeacherSubjects(req.user.teacherId);
        const teacherSubjectIds = teacherSubjects.map((ts) => ts.subjectId);
        if (teacherSubjectIds.includes(grade.subjectId)) {
          return next();
        }
      }
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }

    return res.status(403).json({ error: "Access denied: insufficient permissions" });
  } catch {
    return next();
  }
}
