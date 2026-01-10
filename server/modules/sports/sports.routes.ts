import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  getLeagues,
  getPopularLeagues,
  createLeague,
  updateLeague,
  getTeams,
  createTeam,
  updateTeam,
  getMatches,
  getMatchById,
  createMatch,
  updateMatchStatus,
  getOddsForMatch,
  createOdd,
  updateOdd,
  bulkCreateOdds,
  placeBet,
  getUserBets,
  seedSportsData,
} from "./sports.service";
import { syncPopularLeaguesFixtures } from "./api-football.service";
import {
  createSportsLeagueSchema,
  createSportsTeamSchema,
  createSportsMatchSchema,
  createSportsOddSchema,
  updateMatchStatusSchema,
  placeSportsBetSchema,
} from "@shared/schema";

const router = Router();

const adminCheck = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Erro ao verificar permissões" });
  }
};

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.get("/leagues", async (req: Request, res: Response) => {
  try {
    const sport = req.query.sport as string | undefined;
    const leagues = await getLeagues(sport);
    res.json({ success: true, data: leagues });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/leagues/popular", async (req: Request, res: Response) => {
  try {
    const leagues = await getPopularLeagues();
    res.json({ success: true, data: leagues });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/teams", async (req: Request, res: Response) => {
  try {
    const sport = req.query.sport as string | undefined;
    const teams = await getTeams(sport);
    res.json({ success: true, data: teams });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/matches", async (req: Request, res: Response) => {
  try {
    const filters = {
      sport: req.query.sport as string | undefined,
      leagueId: req.query.leagueId as string | undefined,
      isLive: req.query.live === "true" ? true : req.query.live === "false" ? false : undefined,
      status: req.query.status as string | undefined,
      featured: req.query.featured === "true",
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };
    const matches = await getMatches(filters);
    res.json({ success: true, data: matches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/matches/live", async (req: Request, res: Response) => {
  try {
    const matches = await getMatches({ isLive: true });
    res.json({ success: true, data: matches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/matches/featured", async (req: Request, res: Response) => {
  try {
    const matches = await getMatches({ featured: true, limit: 10 });
    res.json({ success: true, data: matches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/matches/:id", async (req: Request, res: Response) => {
  try {
    const match = await getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, error: "Partida não encontrada" });
    }
    res.json({ success: true, data: match });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/matches/:id/odds", async (req: Request, res: Response) => {
  try {
    const odds = await getOddsForMatch(req.params.id);
    res.json({ success: true, data: odds });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// AUTHENTICATED USER ROUTES
// ==========================================

router.post("/bet", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = placeSportsBetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error.errors[0]?.message || "Dados inválidos" 
      });
    }
    
    const result = await placeBet(req.user!.id, validation.data);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, data: result.betSlip });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/my-bets", authMiddleware, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const bets = await getUserBets(req.user!.id, status);
    res.json({ success: true, data: bets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

router.post("/admin/leagues", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = createSportsLeagueSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error.errors[0]?.message || "Dados inválidos" 
      });
    }
    
    const league = await createLeague(validation.data);
    res.json({ success: true, data: league });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/admin/leagues/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const league = await updateLeague(req.params.id, req.body);
    if (!league) {
      return res.status(404).json({ success: false, error: "Liga não encontrada" });
    }
    res.json({ success: true, data: league });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/admin/teams", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = createSportsTeamSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error.errors[0]?.message || "Dados inválidos" 
      });
    }
    
    const team = await createTeam(validation.data);
    res.json({ success: true, data: team });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/admin/teams/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const team = await updateTeam(req.params.id, req.body);
    if (!team) {
      return res.status(404).json({ success: false, error: "Time não encontrado" });
    }
    res.json({ success: true, data: team });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/admin/matches", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = createSportsMatchSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error.errors[0]?.message || "Dados inválidos" 
      });
    }
    
    const match = await createMatch({
      ...validation.data,
      startsAt: new Date(validation.data.startsAt),
    });
    res.json({ success: true, data: match });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/admin/matches/:id/status", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = updateMatchStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error.errors[0]?.message || "Dados inválidos" 
      });
    }
    
    const match = await updateMatchStatus(req.params.id, validation.data);
    if (!match) {
      return res.status(404).json({ success: false, error: "Partida não encontrada" });
    }
    res.json({ success: true, data: match });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/admin/odds", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = createSportsOddSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error.errors[0]?.message || "Dados inválidos" 
      });
    }
    
    const odd = await createOdd(validation.data);
    res.json({ success: true, data: odd });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/admin/odds/bulk", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { matchId, odds } = req.body;
    if (!matchId || !Array.isArray(odds)) {
      return res.status(400).json({ success: false, error: "Dados inválidos" });
    }
    
    const createdOdds = await bulkCreateOdds(matchId, odds);
    res.json({ success: true, data: createdOdds });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/admin/odds/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const odd = await updateOdd(req.params.id, req.body);
    if (!odd) {
      return res.status(404).json({ success: false, error: "Odd não encontrada" });
    }
    res.json({ success: true, data: odd });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/admin/seed", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    await seedSportsData();
    res.json({ success: true, message: "Dados de esportes criados com sucesso" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/admin/sync", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const result = await syncPopularLeaguesFixtures();
    res.json({ success: true, message: `Sincronizados ${result.synced} jogos`, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/sync", async (req: Request, res: Response) => {
  try {
    const result = await syncPopularLeaguesFixtures();
    res.json({ success: true, message: `Sincronizados ${result.synced} jogos`, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
