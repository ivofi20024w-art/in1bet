import { Router, Request, Response } from "express";
import { db } from "../../db";
import { users, bets, transactions, minesGames } from "@shared/schema";
import { eq, desc, sql, and, gt } from "drizzle-orm";
import { optionalAuthMiddleware } from "../auth/auth.middleware";

const router = Router();

router.get("/:userId/stats", optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    const isOwner = requestingUser?.id === userId;
    const isAdmin = requestingUser?.isAdmin === true;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        level: users.level,
        vipLevel: users.vipLevel,
        totalWagered: users.totalWagered,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado" });
    }

    const [betsStats] = await db
      .select({
        totalBets: sql<number>`COALESCE(COUNT(*), 0)`,
        totalWins: sql<number>`COALESCE(SUM(CASE WHEN ${bets.status} = 'won' THEN 1 ELSE 0 END), 0)`,
        totalWinAmount: sql<number>`COALESCE(SUM(CASE WHEN ${bets.status} = 'won' THEN ${bets.potentialWin} ELSE 0 END), 0)`,
      })
      .from(bets)
      .where(eq(bets.userId, userId));

    const [gamesStats] = await db
      .select({
        totalGames: sql<number>`COALESCE(COUNT(*), 0)`,
      })
      .from(minesGames)
      .where(eq(minesGames.userId, userId));

    const recentWins = await db
      .select({
        id: bets.id,
        game: bets.gameType,
        amount: bets.potentialWin,
        multiplier: sql<number>`ROUND(CAST(${bets.potentialWin} AS DECIMAL) / NULLIF(CAST(${bets.amount} AS DECIMAL), 0), 2)`,
        createdAt: bets.createdAt,
      })
      .from(bets)
      .where(and(eq(bets.userId, userId), eq(bets.status, "won")))
      .orderBy(desc(bets.createdAt))
      .limit(5);

    const gameCountQuery = await db
      .select({
        gameType: bets.gameType,
        count: sql<number>`COUNT(*)`,
      })
      .from(bets)
      .where(eq(bets.userId, userId))
      .groupBy(bets.gameType)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(1);

    const favoriteGame = gameCountQuery[0];

    const [rankResult] = await db
      .select({
        ranking: sql<number>`(SELECT COUNT(*) + 1 FROM users u2 WHERE u2.total_wagered > ${user.totalWagered || 0})`,
      })
      .from(users)
      .where(eq(users.id, userId));

    const showDetails = isOwner || isAdmin;

    res.json({
      success: true,
      data: {
        totalWagered: showDetails ? Number(user.totalWagered) || 0 : null,
        totalWins: Number(betsStats?.totalWins) || 0,
        totalGames: Number(betsStats?.totalBets || 0) + Number(gamesStats?.totalGames || 0),
        ranking: Number(rankResult?.ranking) || 999,
        favoriteGame: favoriteGame?.gameType || "Slots",
        favoriteGameRounds: Number(favoriteGame?.count) || 0,
        recentWins: recentWins.map((w) => ({
          game: w.game || "Casino",
          multiplier: Number(w.multiplier) || 1,
          amount: showDetails ? Number(w.amount) || 0 : null,
          createdAt: w.createdAt?.toISOString() || new Date().toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[USER STATS] Error:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar estatísticas" });
  }
});

export { router as userStatsRoutes };
