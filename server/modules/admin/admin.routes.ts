import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";

const router = Router();

// Admin module structure - will be expanded later

// All routes require authentication
router.use(authMiddleware);

// TODO: Add admin role check middleware

// GET /api/admin/stats - Get platform stats (placeholder)
router.get("/stats", async (req: Request, res: Response) => {
  res.status(501).json({ 
    error: "Área administrativa em desenvolvimento",
    message: "Admin features coming soon" 
  });
});

// GET /api/admin/users - List users (placeholder)
router.get("/users", async (req: Request, res: Response) => {
  res.status(501).json({ 
    error: "Área administrativa em desenvolvimento",
    message: "User management coming soon" 
  });
});

export default router;
