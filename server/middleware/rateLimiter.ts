import rateLimit from "express-rate-limit";
import { PostgresStore } from "@acpr/rate-limit-postgresql";

function createStore(prefix: string) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }
    return new PostgresStore(
      { connectionString: process.env.DATABASE_URL },
      prefix,
    );
  } catch {
    // Fallback to default MemoryStore — use a persistent store in production
    return undefined;
  }
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("auth"),
});

export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("write"),
});

export const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("read"),
});

export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: "Too many file uploads. Please wait before uploading again." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("upload"),
});
