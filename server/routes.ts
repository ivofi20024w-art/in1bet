import type { Express } from "express";
import { createServer, type Server } from "http";
import { generalLimiter } from "./middleware/rateLimit";

// Import module routes
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import walletRoutes from "./modules/wallet/wallet.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import adminRoutes from "./modules/admin/admin.routes";
import ondapayRoutes from "./modules/payments/ondapay/ondapay.routes";
import kycRoutes from "./modules/kyc/kyc.routes";
import withdrawalRoutes from "./modules/withdrawals/withdrawal.routes";
import bonusRoutes from "./modules/bonus/bonus.routes";
import securityRoutes from "./modules/security/security.routes";
import { settingsRouter } from "./modules/settings";
import { initializeDefaultSettings } from "./modules/settings/settings.service";
import { affiliateRouter } from "./modules/affiliates";
import { bettingRouter } from "./modules/betting";
import { minesRouter, crashRouter, startCrashGameLoop, doubleRouter, startDoubleGameLoop, plinkoRouter } from "./modules/games";
import historyRoutes from "./modules/history/history.routes";
import playfiversRoutes from "./modules/playfivers/playfivers.routes";
import { supportRouter, initializeDefaultDepartments, initializeDefaultSlaRules, initializeDefaultTriageRules } from "./modules/support";
import levelRoutes from "./modules/levels/level.routes";
import rakebackRoutes from "./modules/rakeback/rakeback.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import missionRoutes from "./modules/missions/mission.routes";
import { initializeRakebackSettings } from "./modules/rakeback/rakeback.service";
import { initializeMissionTemplates } from "./modules/missions/mission.service";
import { sportsRouter, seedSportsData } from "./modules/sports";

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

  // Apply general rate limiting to all API routes
  app.use("/api", generalLimiter);

  // Webhook endpoint (no auth required - comes from OndaPay)
  app.use("/api", ondapayRoutes);

  // Register all API routes with /api prefix
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/kyc", kycRoutes);
  app.use("/api/withdrawals", withdrawalRoutes);
  app.use("/api/bonus", bonusRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin/security", securityRoutes);
  app.use("/api/admin/settings", settingsRouter);
  app.use("/api/affiliate", affiliateRouter);
  app.use("/api/bets", bettingRouter);
  app.use("/api/games/mines", minesRouter);
  app.use("/api/games/crash", crashRouter);
  app.use("/api/games/double", doubleRouter);
  app.use("/api/games/plinko", plinkoRouter);
  
  // Start game loops
  startCrashGameLoop();
  startDoubleGameLoop();
  
  app.use("/api/history", historyRoutes);
  app.use("/api/playfivers", playfiversRoutes);
  app.use("/api/support", supportRouter);
  app.use("/api/levels", levelRoutes);
  app.use("/api/rakeback", rakebackRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/missions", missionRoutes);
  app.use("/api/sports", sportsRouter);

  // Initialize default settings
  initializeDefaultSettings().catch(err => {
    console.error("Failed to initialize default settings:", err);
  });

  // Initialize support system defaults
  Promise.all([
    initializeDefaultDepartments(),
    initializeDefaultSlaRules(),
    initializeDefaultTriageRules(),
  ]).catch(err => {
    console.error("Failed to initialize support defaults:", err);
  });

  // Initialize rakeback and missions
  initializeRakebackSettings().catch(err => {
    console.error("Failed to initialize rakeback settings:", err);
  });
  initializeMissionTemplates().catch(err => {
    console.error("Failed to initialize mission templates:", err);
  });

  // Initialize sports data
  seedSportsData().catch(err => {
    console.error("Failed to seed sports data:", err);
  });

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
