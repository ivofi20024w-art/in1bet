import { Router, Request, Response } from "express";
import { db } from "../../db";
import { users, bets, minesGames } from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { optionalAuthMiddleware, authMiddleware } from "../auth/auth.middleware";

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
        username: users.username,
        name: users.name,
        level: users.level,
        xp: users.xp,
        vipLevel: users.vipLevel,
        totalWagered: users.totalWagered,
        hideWins: users.hideWins,
        avatarUrl: users.avatarUrl,
        profileBackground: users.profileBackground,
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
        totalWins: sql<number>`COALESCE(SUM(CASE WHEN UPPER(${bets.status}) = 'WON' THEN 1 ELSE 0 END), 0)`,
        totalWinAmount: sql<number>`COALESCE(SUM(CASE WHEN UPPER(${bets.status}) = 'WON' THEN ${bets.winAmount}::numeric ELSE 0 END), 0)`,
        biggestWin: sql<number>`COALESCE(MAX(CASE WHEN UPPER(${bets.status}) = 'WON' THEN ${bets.winAmount}::numeric ELSE 0 END), 0)`,
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
        amount: sql<number>`${bets.winAmount}::numeric`,
        multiplier: sql<number>`ROUND(${bets.winAmount}::numeric / NULLIF(${bets.betAmount}::numeric, 0), 2)`,
        createdAt: bets.createdAt,
      })
      .from(bets)
      .where(and(eq(bets.userId, userId), sql`UPPER(${bets.status}) = 'WON'`))
      .orderBy(desc(bets.createdAt))
      .limit(10);

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
    const hideWinsActive = user.hideWins && !isOwner && !isAdmin;

    const winRate = Number(betsStats?.totalBets) > 0 
      ? Math.round((Number(betsStats?.totalWins) / Number(betsStats?.totalBets)) * 100) 
      : 0;

    const memberSince = user.createdAt ? new Date(user.createdAt) : new Date();
    const daysSinceJoin = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          level: user.level,
          xp: user.xp,
          vipLevel: user.vipLevel,
          hideWins: user.hideWins,
          avatarUrl: user.avatarUrl,
          profileBackground: user.profileBackground,
          createdAt: user.createdAt?.toISOString(),
          daysSinceJoin,
        },
        stats: {
          totalWagered: showDetails && !hideWinsActive ? Number(user.totalWagered) || 0 : null,
          totalBets: Number(betsStats?.totalBets) || 0,
          totalWins: hideWinsActive ? null : Number(betsStats?.totalWins) || 0,
          totalWinAmount: showDetails && !hideWinsActive ? Number(betsStats?.totalWinAmount) || 0 : null,
          biggestWin: showDetails && !hideWinsActive ? Number(betsStats?.biggestWin) || 0 : null,
          winRate: hideWinsActive ? null : winRate,
          totalGames: Number(betsStats?.totalBets || 0) + Number(gamesStats?.totalGames || 0),
          ranking: Number(rankResult?.ranking) || 999,
          favoriteGame: favoriteGame?.gameType || "Slots",
          favoriteGameRounds: Number(favoriteGame?.count) || 0,
        },
        recentWins: hideWinsActive ? [] : recentWins.map((w) => ({
          id: w.id,
          game: w.game || "Casino",
          multiplier: Number(w.multiplier) || 1,
          amount: showDetails ? Number(w.amount) || 0 : null,
          createdAt: w.createdAt?.toISOString() || new Date().toISOString(),
        })),
        isOwner,
      },
    });
  } catch (error) {
    console.error("[USER STATS] Error:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar estatísticas" });
  }
});

router.put("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userLevel = req.user!.level || 1;
    const { hideWins, avatarUrl, profileBackground } = req.body;

    const updateData: Record<string, any> = {};

    if (typeof hideWins === 'boolean') {
      updateData.hideWins = hideWins;
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl && userLevel < 50) {
        return res.status(403).json({ 
          success: false, 
          error: "Avatar personalizado requer nível 50+" 
        });
      }
      if (avatarUrl && !isValidImageUrl(avatarUrl)) {
        return res.status(400).json({ 
          success: false, 
          error: "URL de avatar inválida" 
        });
      }
      updateData.avatarUrl = avatarUrl || null;
    }

    if (profileBackground !== undefined) {
      if (profileBackground && userLevel < 50) {
        return res.status(403).json({ 
          success: false, 
          error: "Background personalizado requer nível 50+" 
        });
      }
      if (profileBackground && !isValidImageUrl(profileBackground)) {
        return res.status(400).json({ 
          success: false, 
          error: "URL de background inválida" 
        });
      }
      updateData.profileBackground = profileBackground || null;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Nenhum campo para atualizar" 
      });
    }

    updateData.updatedAt = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        hideWins: users.hideWins,
        avatarUrl: users.avatarUrl,
        profileBackground: users.profileBackground,
      });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("[USER PROFILE UPDATE] Error:", error);
    res.status(500).json({ success: false, error: "Erro ao atualizar perfil" });
  }
});

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const ext = parsed.pathname.toLowerCase();
    return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || 
           ext.endsWith('.gif') || ext.endsWith('.webp') ||
           url.includes('imgur.com') || url.includes('giphy.com') || 
           url.includes('tenor.com') || url.includes('discord');
  } catch {
    return false;
  }
}

export { router as userStatsRoutes };
