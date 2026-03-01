import bcrypt from "bcryptjs";
import { storage } from "../server/storage";
import { pool } from "../server/db";

async function seed() {
  const existingAdmins = await storage.getUsersByRole("admin");
  const hashedPassword = await bcrypt.hash("Admin@1234!", 12);

  const adminUser = existingAdmins.find((u) => u.username === "admin");

  if (adminUser) {
    await storage.updateUserPassword(adminUser.id, hashedPassword);
    console.log("Admin already exists — password reset to default.");
  } else {
    await storage.createUserWithRole({
      username: "admin",
      hashedPassword,
      role: "admin",
    });
    console.log("Admin created — username: admin / password: Admin@1234!");
  }

  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
