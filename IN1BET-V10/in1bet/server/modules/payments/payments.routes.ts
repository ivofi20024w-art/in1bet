import { Router, Request, Response } from "express";
import ondapayRoutes from "./ondapay/ondapay.routes";

const router = Router();

router.use("/", ondapayRoutes);

router.post("/withdraw", async (req: Request, res: Response) => {
  res.status(501).json({ 
    error: "Funcionalidade de saque em desenvolvimento",
    message: "PIX withdrawal coming soon" 
  });
});

export default router;
