import { Router, Request, Response } from "express";
import ondapayRoutes from "./ondapay/ondapay.routes";
import { authMiddleware } from "../auth/auth.middleware";

const router = Router();

router.use("/", ondapayRoutes);

router.post("/withdraw", authMiddleware, async (req: Request, res: Response) => {
  res.status(501).json({ 
    error: "Funcionalidade de saque em desenvolvimento",
    message: "PIX withdrawal coming soon" 
  });
});

export default router;
