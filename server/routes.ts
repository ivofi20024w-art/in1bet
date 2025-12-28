import type { Express } from "express";
import { createServer, type Server } from "http";

// Import module routes
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import walletRoutes from "./modules/wallet/wallet.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import adminRoutes from "./modules/admin/admin.routes";
import ondapayRoutes from "./modules/payments/ondapay/ondapay.routes";
import kycRoutes from "./modules/kyc/kyc.routes";
import withdrawalRoutes from "./modules/withdrawals/withdrawal.routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Global error handler for JSON parsing errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'JSON inválido' });
    }
    next(err);
  });

  // Webhook endpoint (no auth required - comes from OndaPay)
  app.use("/api", ondapayRoutes);

  // Register all API routes with /api prefix
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/kyc", kycRoutes);
  app.use("/api/withdrawals", withdrawalRoutes);
  app.use("/api/admin", adminRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  });

  return httpServer;
}
