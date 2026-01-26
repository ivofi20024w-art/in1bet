import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../../storage";
import type { SafeUser } from "@shared/schema";

// JWT_SECRET must be set in production
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required for production security");
  }
  return secret;
}

const JWT_SECRET: string = getJwtSecret();

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Authentication middleware - protects routes
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    console.log(`[AUTH] ${req.method} ${req.path} - Authorization header: ${authHeader ? 'present' : 'missing'}`);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(`[AUTH] No Bearer token provided for ${req.path}`);
      res.status(401).json({ error: "Token de acesso não fornecido" });
      return;
    }

    const token = authHeader.split(" ")[1];
    console.log(`[AUTH] Token first 20 chars: ${token.substring(0, 20)}...`);
    
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log(`[AUTH] Token verified for user: ${decoded.userId}`);
    
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: "Usuário não encontrado" });
      return;
    }

    const { password, ...safeUser } = user;
    req.user = safeUser;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expirado" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }
    res.status(500).json({ error: "Erro de autenticação" });
  }
}

// Optional auth - doesn't require auth but attaches user if present
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await storage.getUser(decoded.userId);
    
    if (user) {
      const { password, ...safeUser } = user;
      req.user = safeUser;
    }
    
    next();
  } catch {
    next();
  }
}

// Generate access token (15 minutes)
export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "15m" });
}

// Generate refresh token (7 days)
export function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
}

// Verify refresh token
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
