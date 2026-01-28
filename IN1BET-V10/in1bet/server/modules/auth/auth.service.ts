import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage, sanitizeUser } from "../../storage";
import { withRetry } from "../../db";
import { db } from "../../db";
import { users, passwordResetTokens } from "@shared/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { 
  registerUserSchema, 
  loginUserSchema, 
  forgotPasswordSchema,
  resetPasswordSchema,
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
import { applyWelcomeBonus } from "../bonus/bonus.service";
import { 
  getAffiliateLinkByCode, 
  createConversion, 
  checkForFraud 
} from "../affiliates/affiliate.service";

const SALT_ROUNDS = 10;

export interface AuthResponse {
  success: boolean;
  user?: SafeUser;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface DeviceInfo {
  userAgent?: string;
  ipAddress?: string;
}

function parseDeviceName(userAgent?: string): string {
  if (!userAgent) return "Dispositivo desconhecido";
  
  let browser = "Navegador";
  let os = "Sistema";
  
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";
  
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Linux") && !userAgent.includes("Android")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  
  return `${browser} / ${os}`;
}

// Register new user with CPF validation and optional referral tracking
export async function registerUser(
  data: RegisterUser, 
  referralCode?: string,
  registrationIp?: string,
  deviceInfo?: DeviceInfo
): Promise<AuthResponse> {
  try {
    // Validate input
    const validationResult = registerUserSchema.safeParse(data);
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.errors[0]?.message || "Dados inválidos" 
      };
    }

    const { username, name, email, cpf, password, phone, birthDate } = validationResult.data;

    // Validate CPF
    if (!isValidCPF(cpf)) {
      return { success: false, error: "CPF inválido" };
    }

    // Check if username already exists (with retry for DNS issues)
    const existingUsername = await withRetry(() => storage.getUserByUsername(username));
    if (existingUsername) {
      return { success: false, error: "Este nome de utilizador já está em uso" };
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
      username,
      name,
      email,
      cpf,
      password: hashedPassword,
      phone: phone || null,
      birthDate: birthDate ? new Date(birthDate) : null,
    }));

    // Create wallet automatically (with retry for DNS issues)
    await withRetry(() => storage.createWallet({ userId: user.id }));

    // Apply welcome bonus automatically (non-blocking)
    try {
      const bonusResult = await applyWelcomeBonus(user.id, cpf);
      if (bonusResult.success) {
        console.log(`Welcome bonus applied to user ${user.id}: R$ ${bonusResult.bonusAmount}`);
      }
    } catch (bonusError) {
      console.error("Failed to apply welcome bonus:", bonusError);
    }

    // Handle affiliate referral tracking
    if (referralCode) {
      try {
        const affiliateLink = await getAffiliateLinkByCode(referralCode);
        
        if (affiliateLink) {
          const fraudCheck = await checkForFraud(
            user.id,
            affiliateLink.affiliateId,
            registrationIp,
            cpf,
            email
          );

          if (fraudCheck.isFraud) {
            console.log(`[AFFILIATE] Fraud detected for user ${user.id}: ${fraudCheck.reasons.join(", ")}`);
          }

          const conversion = await createConversion(
            user.id,
            affiliateLink.affiliateId,
            affiliateLink.id,
            "CPA",
            registrationIp,
            undefined
          );

          if (fraudCheck.isFraud) {
            const { markConversionAsFraudSystem } = await import("../affiliates/affiliate.service");
            await markConversionAsFraudSystem(conversion.id, fraudCheck.reasons.join("; "));
          }

          await db
            .update(users)
            .set({
              affiliateId: affiliateLink.affiliateId,
              referralCode: referralCode,
              registrationIp: registrationIp,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          console.log(`[AFFILIATE] Conversion created for user ${user.id} via link ${referralCode}`);
        }
      } catch (affiliateError) {
        console.error("Failed to process affiliate referral:", affiliateError);
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token with device info
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await withRetry(() => storage.createRefreshToken(user.id, refreshToken, expiresAt, {
      userAgent: deviceInfo?.userAgent,
      ipAddress: deviceInfo?.ipAddress || registrationIp,
      deviceName: parseDeviceName(deviceInfo?.userAgent),
    }));

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
export async function loginUser(data: LoginUser, deviceInfo?: DeviceInfo): Promise<AuthResponse> {
  try {
    console.log("[LOGIN] Attempt started for identifier:", data?.identifier);
    
    // Validate input
    const validationResult = loginUserSchema.safeParse(data);
    if (!validationResult.success) {
      console.log("[LOGIN] Validation failed:", validationResult.error.errors);
      return { 
        success: false, 
        error: validationResult.error.errors[0]?.message || "Dados inválidos" 
      };
    }

    const { identifier, password } = validationResult.data;
    console.log("[LOGIN] Looking up user by identifier:", identifier);

    // Find user by email or CPF (with retry for DNS issues)
    const user = await withRetry(() => storage.getUserByEmailOrCPF(identifier));
    console.log("[LOGIN] User lookup result:", user ? `Found user ${user.id} (${user.email})` : "NOT FOUND");
    
    if (!user) {
      return { success: false, error: "Email/CPF ou senha incorretos" };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return { success: false, error: "Email/CPF ou senha incorretos" };
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.log("[LOGIN] User is blocked:", user.email, user.blockReason);
      return { success: false, error: "Sua conta foi bloqueada. Entre em contato com o suporte." };
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token with device info
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await withRetry(() => storage.createRefreshToken(user.id, refreshToken, expiresAt, {
      userAgent: deviceInfo?.userAgent,
      ipAddress: deviceInfo?.ipAddress,
      deviceName: parseDeviceName(deviceInfo?.userAgent),
    }));

    return {
      success: true,
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    console.error("Login error details:", {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
    });
    
    // Check for connection errors
    if (
      error?.code === 'EAI_AGAIN' ||
      error?.code === 'ECONNREFUSED' ||
      error?.message?.includes('connect') ||
      error?.message?.includes('getaddrinfo')
    ) {
      return { success: false, error: "Erro de conexão. Tente novamente em instantes." };
    }
    
    return { success: false, error: `Erro ao fazer login: ${error?.message || 'erro desconhecido'}` };
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

// Hash a token using SHA-256
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Generate a secure random token
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Request password reset - creates token and returns it (email would be sent separately)
export async function requestPasswordReset(identifier: string): Promise<{
  success: boolean;
  email?: string;
  token?: string;
  error?: string;
}> {
  try {
    const validationResult = forgotPasswordSchema.safeParse({ identifier });
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.errors[0]?.message || "Dados inválidos" 
      };
    }

    // Find user by email or CPF
    const user = await withRetry(() => storage.getUserByEmailOrCPF(identifier));
    
    // Always return success to prevent enumeration attacks
    if (!user) {
      console.log("[PASSWORD_RESET] User not found for identifier:", identifier);
      return { success: true }; // Don't reveal if user exists
    }

    // Invalidate any existing reset tokens for this user
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    // Generate secure token
    const plainToken = generateSecureToken();
    const tokenHash = hashToken(plainToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store hashed token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    console.log("[PASSWORD_RESET] Token created for user:", user.email);

    // Send email with reset link
    try {
      const { sendPasswordResetEmail, isEmailConfigured } = await import("../email/email.service");
      if (isEmailConfigured()) {
        await sendPasswordResetEmail(user.email, plainToken, user.name);
      }
    } catch (emailError) {
      console.error("[PASSWORD_RESET] Failed to send email:", emailError);
    }

    return {
      success: true,
      email: user.email,
    };
  } catch (error: any) {
    console.error("Password reset request error:", error);
    return { success: false, error: "Erro ao processar solicitação" };
  }
}

// Reset password using token
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validationResult = resetPasswordSchema.safeParse({ token, newPassword });
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.errors[0]?.message || "Dados inválidos" 
      };
    }

    // Hash the provided token
    const tokenHash = hashToken(token);

    // Find valid token
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );

    if (!resetToken) {
      return { success: false, error: "Token inválido ou expirado" };
    }

    // Get user
    const user = await storage.getUser(resetToken.userId);
    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    // Invalidate all refresh tokens (logout all devices)
    await storage.deleteUserRefreshTokens(user.id);

    console.log("[PASSWORD_RESET] Password reset completed for user:", user.email);

    return { success: true };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return { success: false, error: "Erro ao redefinir senha" };
  }
}

// Change password for authenticated user
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return { success: false, error: "Senha atual incorreta" };
    }

    // Check if new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return { success: false, error: "A nova senha deve ser diferente da atual" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Invalidate all refresh tokens (logout all devices)
    await storage.deleteUserRefreshTokens(userId);

    console.log("[PASSWORD_CHANGE] Password changed for user:", user.email);

    return { success: true };
  } catch (error: any) {
    console.error("Password change error:", error);
    return { success: false, error: "Erro ao alterar senha" };
  }
}
