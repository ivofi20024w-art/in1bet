import { Router, Request, Response } from "express";
import { registerUser, loginUser, refreshAccessToken, logoutUser, requestPasswordReset, resetPasswordWithToken } from "./auth.service";
import { authMiddleware, setAuthCookies, clearAuthCookies, getRefreshToken } from "./auth.middleware";
import { authLimiter, registrationLimiter } from "../../middleware/rateLimit";
import { storage } from "../../storage";

const router = Router();

// POST /api/auth/register - Register new user
router.post("/register", registrationLimiter, async (req: Request, res: Response) => {
  try {
    console.log("Register request body:", JSON.stringify(req.body, null, 2));
    
    const referralCode = req.body.referralCode || req.query.ref as string;
    const registrationIp = req.headers["x-forwarded-for"] as string || req.ip;
    const userAgent = req.headers["user-agent"] as string;
    
    const result = await registerUser(req.body, referralCode, registrationIp, {
      userAgent,
      ipAddress: registrationIp,
    });
    
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    setAuthCookies(res, result.accessToken!, result.refreshToken!);

    res.status(201).json({
      message: "Conta criada com sucesso",
      user: result.user,
    });
  } catch (error) {
    console.error("Register route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/auth/login - Login with email or CPF
router.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    const userAgent = req.headers["user-agent"] as string;
    const ipAddress = req.headers["x-forwarded-for"] as string || req.ip;
    
    const result = await loginUser(req.body, { userAgent, ipAddress });
    
    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }

    setAuthCookies(res, result.accessToken!, result.refreshToken!);

    res.json({
      message: "Login realizado com sucesso",
      user: result.user,
    });
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const refreshToken = getRefreshToken(req);
    
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token não fornecido" });
      return;
    }

    const result = await refreshAccessToken(refreshToken);
    
    if (!result.success) {
      clearAuthCookies(res);
      res.status(401).json({ error: result.error });
      return;
    }

    setAuthCookies(res, result.accessToken!, refreshToken);

    res.json({
      user: result.user,
    });
  } catch (error) {
    console.error("Refresh route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/auth/logout - Logout and invalidate refresh token
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const refreshToken = getRefreshToken(req);
    
    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    clearAuthCookies(res);

    res.json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    console.error("Logout route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/auth/me - Get current user (protected)
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error("Me route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post("/forgot-password", authLimiter, async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    
    if (!identifier) {
      res.status(400).json({ error: "Email ou CPF obrigatório" });
      return;
    }

    const result = await requestPasswordReset(identifier);
    
    // Always return success to prevent enumeration attacks

    res.json({ 
      message: "Se o email/CPF estiver cadastrado, você receberá instruções para redefinir sua senha.",
      // For development testing only - remove in production
      ...(process.env.NODE_ENV !== "production" && result.token ? { resetToken: result.token } : {})
    });
  } catch (error) {
    console.error("Forgot password route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post("/reset-password", authLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      res.status(400).json({ error: "Token e nova senha obrigatórios" });
      return;
    }

    const result = await resetPasswordWithToken(token, newPassword);
    
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ message: "Senha redefinida com sucesso! Você pode fazer login com sua nova senha." });
  } catch (error) {
    console.error("Reset password route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/auth/sessions - List user's active sessions
router.get("/sessions", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const sessions = await storage.getUserSessions(userId);
    const currentToken = req.headers.authorization?.replace("Bearer ", "");
    
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      device: session.deviceName || "Dispositivo desconhecido",
      ip: session.ipAddress || "IP desconhecido",
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt || session.createdAt,
      isCurrent: session.token === currentToken,
    }));

    res.json({ success: true, sessions: formattedSessions });
  } catch (error) {
    console.error("Sessions route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// DELETE /api/auth/sessions/:sessionId - Revoke a specific session
router.delete("/sessions/:sessionId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    await storage.deleteRefreshTokenById(sessionId, userId);
    res.json({ success: true, message: "Sessão encerrada" });
  } catch (error) {
    console.error("Revoke session route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// DELETE /api/auth/sessions - Revoke all sessions except current
router.delete("/sessions", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    await storage.deleteUserRefreshTokens(userId);
    res.json({ success: true, message: "Todas as sessões encerradas" });
  } catch (error) {
    console.error("Revoke all sessions route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
