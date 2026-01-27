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

const isProduction = process.env.NODE_ENV === "production";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" as const : "lax" as const,
  path: "/",
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie("access_token", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

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

// Get access token from cookie or header (cookies preferred)
function getAccessToken(req: Request): string | null {
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

// Get refresh token from cookie or body
export function getRefreshToken(req: Request): string | null {
  if (req.cookies?.refresh_token) {
    return req.cookies.refresh_token;
  }
  return req.body?.refreshToken || null;
}

// Authentication middleware - protects routes
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getAccessToken(req);
    
    if (!token) {
      res.status(401).json({ error: "Token de acesso não fornecido" });
      return;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
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
    const token = getAccessToken(req);
    
    if (!token) {
      next();
      return;
    }

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
