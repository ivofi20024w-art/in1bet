
import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users, wallets } from "../shared/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

async function createTestAccounts() {
  console.log("Creating test accounts...");

  try {
    // 1. Test User
    const userEmail = "user@test.com";
    const userPassword = "password123";
    const userCpf = "11122233344";
    const hashedUserPassword = await bcrypt.hash(userPassword, SALT_ROUNDS);

    const [existingUser] = await db.select().from(users).where(eq(users.email, userEmail));
    if (!existingUser) {
      const [newUser] = await db.insert(users).values({
        name: "Test User",
        email: userEmail,
        password: hashedUserPassword,
        cpf: "111.222.333-44",
        isVerified: true,
        kycStatus: "verified"
      }).returning();
      
      await db.insert(wallets).values({ userId: newUser.id, balance: "10000" });
      console.log(`User created: ${userEmail} / ${userPassword}`);
    } else {
      console.log(`User ${userEmail} already exists`);
    }

    // 2. Admin User
    const adminEmail = "admin@test.com";
    const adminPassword = "adminpassword";
    const adminCpf = "55566677788";
    const hashedAdminPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail));
    if (!existingAdmin) {
      const [newAdmin] = await db.insert(users).values({
        name: "Admin User",
        email: adminEmail,
        password: hashedAdminPassword,
        cpf: "555.666.777-88",
        isAdmin: true,
        adminRole: "ADMIN",
        isVerified: true,
        kycStatus: "verified"
      }).returning();
      
      await db.insert(wallets).values({ userId: newAdmin.id, balance: "50000" });
      console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`Admin ${adminEmail} already exists`);
    }

    console.log("Success!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test accounts:", error);
    process.exit(1);
  }
}

createTestAccounts();
