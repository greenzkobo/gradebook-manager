import xss from "xss";
import validator from "validator";
import { GRADE_CATEGORIES, USER_ROLES } from "@shared/schema";

const ENROLLMENT_STATUSES = ["active", "dropped", "completed"] as const;

export function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return xss(value.trim());
}

export function sanitizeOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return sanitizeString(value);
}

export function sanitizeEmail(value: unknown): string {
  const cleaned = sanitizeString(value);
  if (!validator.isEmail(cleaned)) {
    throw new Error("Invalid email format");
  }
  return validator.normalizeEmail(cleaned) || cleaned.toLowerCase().trim();
}

export function sanitizeInteger(value: unknown, min?: number, max?: number): number {
  const num = parseInt(String(value), 10);
  if (isNaN(num)) {
    throw new Error("Must be a valid integer");
  }
  if (min !== undefined && num < min) {
    throw new Error(`Must be at least ${min}`);
  }
  if (max !== undefined && num > max) {
    throw new Error(`Must be at most ${max}`);
  }
  return num;
}

export function sanitizeScore(score: unknown, maxScore: unknown): { score: number; maxScore: number } {
  const sanitizedMaxScore = sanitizeInteger(maxScore, 1, 1000);
  const sanitizedScore = sanitizeInteger(score, 0, sanitizedMaxScore);
  return { score: sanitizedScore, maxScore: sanitizedMaxScore };
}

export function sanitizeUUID(value: unknown): string {
  const cleaned = sanitizeString(value);
  if (!validator.isUUID(cleaned)) {
    throw new Error("Invalid ID format");
  }
  return cleaned;
}

export function sanitizeRole(value: unknown): "admin" | "teacher" | "student" {
  const cleaned = sanitizeString(value);
  if (!USER_ROLES.includes(cleaned as any)) {
    throw new Error("Invalid role");
  }
  return cleaned as "admin" | "teacher" | "student";
}

export function sanitizeGradeCategory(value: unknown): string | null {
  const cleaned = sanitizeOptionalString(value);
  if (cleaned !== null && !GRADE_CATEGORIES.includes(cleaned as any)) {
    throw new Error("Invalid grade category");
  }
  return cleaned;
}

export function sanitizeStatus(value: unknown): string {
  const cleaned = sanitizeString(value);
  if (!ENROLLMENT_STATUSES.includes(cleaned as any)) {
    throw new Error("Invalid status value");
  }
  return cleaned;
}

export function sanitizeISODate(value: unknown): string {
  const cleaned = sanitizeString(value);
  if (!validator.isISO8601(cleaned)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }
  return cleaned;
}
