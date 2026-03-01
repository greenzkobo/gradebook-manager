import { Router } from "express";
import bcrypt from "bcryptjs";
import { sanitizeString, sanitizeRole, sanitizeOptionalString } from "../utils/sanitize";
import { storage } from "../storage";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authLimiter, async (req, res) => {
  try {
    const username = sanitizeString(req.body.username);
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: "Username must be between 3 and 50 characters" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
    }

    const password = req.body.password;
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const role = sanitizeRole(req.body.role);
    const teacherId = sanitizeOptionalString(req.body.teacherId);
    const studentId = sanitizeOptionalString(req.body.studentId);

    if (role === "teacher" && !teacherId) {
      return res.status(400).json({ error: "teacherId required for teacher accounts" });
    }
    if (role === "student" && !studentId) {
      return res.status(400).json({ error: "studentId required for student accounts" });
    }

    if (role === "teacher" && teacherId) {
      const teacher = await storage.getTeacher(teacherId);
      if (!teacher) {
        return res.status(400).json({ error: "Teacher not found" });
      }
    }
    if (role === "student" && studentId) {
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(400).json({ error: "Student not found" });
      }
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await storage.createUserWithRole({
      username,
      hashedPassword,
      role,
      teacherId,
      studentId,
    });

    req.session.userId = user.id;

    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Registration failed" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const username = sanitizeString(req.body.username);
    const password = req.body.password;
    if (typeof password !== "string" || password.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const oldSession = req.session;
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: "Session error" });
      }
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  if (!req.session.userId) {
    return res.status(200).json({ success: true });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ success: true });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Session expired" });
    }
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
