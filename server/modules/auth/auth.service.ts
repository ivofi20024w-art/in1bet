import bcrypt from "bcrypt";
import { storage, sanitizeUser } from "../../storage";
import { withRetry } from "../../db";
import { 
  registerUserSchema, 
  loginUserSchema, 
  isValidCPF,
  type RegisterUser, 
  type LoginUser,
  type SafeUser 
} from "@shared/schema";
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} from "./auth.middleware";

const SALT_ROUNDS = 10;

export interface AuthResponse {
  success: boolean;
  user?: SafeUser;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

// Register new user with CPF validation
export async function registerUser(data: RegisterUser): Promise<AuthResponse> {
  try {
    // Validate input
    const validationResult = registerUserSchema.safeParse(data);
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.errors[0]?.message || "Dados inválidos" 
      };
    }

    const { name, email, cpf, password, phone, birthDate } = validationResult.data;

    // Validate CPF
    if (!isValidCPF(cpf)) {
      return { success: false, error: "CPF inválido" };
    }

    // Check if email already exists (with retry for DNS issues)
    const existingEmail = await withRetry(() => storage.getUserByEmail(email));
    if (existingEmail) {
      return { success: false, error: "Este email já está cadastrado" };
    }

    // Check if CPF already exists (with retry for DNS issues)
    const existingCPF = await withRetry(() => storage.getUserByCPF(cpf));
    if (existingCPF) {
      return { success: false, error: "Este CPF já está cadastrado" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user (with retry for DNS issues)
    const user = await withRetry(() => storage.createUser({
      name,
      email,
      cpf,
      password: hashedPassword,
      phone: phone || null,
      birthDate: birthDate ? new Date(birthDate) : null,
    }));

    // Create wallet automatically (with retry for DNS issues)
    await withRetry(() => storage.createWallet({ userId: user.id }));

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token (with retry for DNS issues)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await withRetry(() => storage.createRefreshToken(user.id, refreshToken, expiresAt));

    return {
      success: true,
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    console.error("Register error details:", {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      stack: error?.stack
    });
    
    // Check for specific database errors
    if (error?.code === '23505') {
      // Unique constraint violation
      if (error?.detail?.includes('email')) {
        return { success: false, error: "Este email já está cadastrado" };
      }
      if (error?.detail?.includes('cpf')) {
        return { success: false, error: "Este CPF já está cadastrado" };
      }
      return { success: false, error: "Dados duplicados encontrados" };
    }
    
    if (error?.code === '23503') {
      return { success: false, error: "Erro de referência no banco de dados" };
    }
    
    if (error?.message?.includes('connect')) {
      return { success: false, error: "Erro de conexão com banco de dados" };
    }
    
    return { success: false, error: `Erro ao criar conta: ${error?.message || 'erro desconhecido'}` };
  }
}

// Login with email or CPF
export async function loginUser(data: LoginUser): Promise<AuthResponse> {
  try {
    // Validate input
    const validationResult = loginUserSchema.safeParse(data);
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.errors[0]?.message || "Dados inválidos" 
      };
    }

    const { identifier, password } = validationResult.data;

    // Find user by email or CPF (with retry for DNS issues)
    const user = await withRetry(() => storage.getUserByEmailOrCPF(identifier));
    if (!user) {
      return { success: false, error: "Email/CPF ou senha incorretos" };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { success: false, error: "Email/CPF ou senha incorretos" };
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token (with retry for DNS issues)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await withRetry(() => storage.createRefreshToken(user.id, refreshToken, expiresAt));

    return {
      success: true,
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Erro ao fazer login" };
  }
}

// Refresh access token
export async function refreshAccessToken(token: string): Promise<AuthResponse> {
  try {
    // Verify token
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return { success: false, error: "Token inválido" };
    }

    // Check if token exists in database
    const storedToken = await storage.getRefreshToken(token);
    if (!storedToken) {
      return { success: false, error: "Token não encontrado" };
    }

    // Check if expired
    if (new Date(storedToken.expiresAt) < new Date()) {
      await storage.deleteRefreshToken(token);
      return { success: false, error: "Token expirado" };
    }

    // Get user
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email);

    return {
      success: true,
      user: sanitizeUser(user),
      accessToken,
    };
  } catch (error) {
    console.error("Refresh token error:", error);
    return { success: false, error: "Erro ao renovar token" };
  }
}

// Logout - invalidate refresh token
export async function logoutUser(refreshToken: string): Promise<boolean> {
  try {
    await storage.deleteRefreshToken(refreshToken);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
}
