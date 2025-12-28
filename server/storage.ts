import { 
  users, 
  wallets, 
  refreshTokens,
  type User, 
  type InsertUser, 
  type Wallet, 
  type InsertWallet,
  type SafeUser,
  type RefreshToken
} from "@shared/schema";
import { db } from "./db";
import { eq, or } from "drizzle-orm";

// Storage interface for database operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCPF(cpf: string): Promise<User | undefined>;
  getUserByEmailOrCPF(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Wallet operations
  getWalletByUserId(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: string, balance: string, lockedBalance?: string): Promise<Wallet | undefined>;
  
  // Refresh token operations
  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  getRefreshToken(token: string): Promise<RefreshToken | undefined>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteUserRefreshTokens(userId: string): Promise<void>;
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async getUserByCPF(cpf: string): Promise<User | undefined> {
    const cleanCPF = cpf.replace(/\D/g, '');
    const formattedCPF = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    const [user] = await db.select().from(users).where(
      or(eq(users.cpf, cleanCPF), eq(users.cpf, formattedCPF))
    );
    return user || undefined;
  }

  async getUserByEmailOrCPF(identifier: string): Promise<User | undefined> {
    const cleanIdentifier = identifier.replace(/\D/g, '');
    const isLikelyCPF = cleanIdentifier.length === 11;
    
    if (isLikelyCPF) {
      return this.getUserByCPF(identifier);
    }
    return this.getUserByEmail(identifier);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const cleanCPF = insertUser.cpf.replace(/\D/g, '');
    const formattedCPF = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        email: insertUser.email.toLowerCase(),
        cpf: formattedCPF,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Wallet operations
  async getWalletByUserId(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet || undefined;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db
      .insert(wallets)
      .values(wallet)
      .returning();
    return newWallet;
  }

  async updateWalletBalance(userId: string, balance: string, lockedBalance?: string): Promise<Wallet | undefined> {
    const updateData: Partial<Wallet> = { 
      balance, 
      updatedAt: new Date() 
    };
    if (lockedBalance !== undefined) {
      updateData.lockedBalance = lockedBalance;
    }
    
    const [wallet] = await db
      .update(wallets)
      .set(updateData)
      .where(eq(wallets.userId, userId))
      .returning();
    return wallet || undefined;
  }

  // Refresh token operations
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const [refreshToken] = await db
      .insert(refreshTokens)
      .values({ userId, token, expiresAt })
      .returning();
    return refreshToken;
  }

  async getRefreshToken(token: string): Promise<RefreshToken | undefined> {
    const [refreshToken] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token));
    return refreshToken || undefined;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }
}

export const storage = new DatabaseStorage();

// Helper to remove password from user object
export function sanitizeUser(user: User): SafeUser {
  const { password, ...safeUser } = user;
  return safeUser;
}
