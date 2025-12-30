import { Router, Request, Response } from "express";
import { registerUser, loginUser, refreshAccessToken, logoutUser } from "./auth.service";
import { authMiddleware } from "./auth.middleware";

const router = Router();

// POST /api/auth/register - Register new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    console.log("Register request body:", JSON.stringify(req.body, null, 2));
    
    const referralCode = req.body.referralCode || req.query.ref as string;
    const registrationIp = req.headers["x-forwarded-for"] as string || req.ip;
    
    const result = await registerUser(req.body, referralCode, registrationIp);
    
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: "Conta criada com sucesso",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error("Register route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/auth/login - Login with email or CPF
router.post("/login", async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);
    
    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.json({
      message: "Login realizado com sucesso",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token não fornecido" });
      return;
    }

    const result = await refreshAccessToken(refreshToken);
    
    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.json({
      accessToken: result.accessToken,
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
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await logoutUser(refreshToken);
    }

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

export default router;
