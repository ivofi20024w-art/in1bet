import { db } from "../../db";
import {
  sportsLeagues,
  sportsTeams,
  sportsMatches,
  sportsOdds,
  sportsBetSlips,
  sportsBetSelections,
  users,
  transactions,
  TransactionType,
  type SportsLeague,
  type SportsTeam,
  type SportsMatch,
  type SportsOdd,
  type SportsBetSlip,
  type SportsBetSelection,
} from "@shared/schema";
import { eq, desc, and, or, gte, lte, sql, asc, inArray, isNotNull } from "drizzle-orm";
import { processBalanceChange } from "../wallet/wallet.service";
import { sendNotificationToUser } from "../notifications/notification.service";
import { randomUUID } from "crypto";

// ==========================================
// LEAGUES
// ==========================================

export async function getLeagues(sport?: string): Promise<SportsLeague[]> {
  let query = db.select().from(sportsLeagues).where(eq(sportsLeagues.isActive, true));
  
  if (sport) {
    query = db.select().from(sportsLeagues).where(
      and(eq(sportsLeagues.isActive, true), eq(sportsLeagues.sport, sport))
    );
  }
  
  return query.orderBy(desc(sportsLeagues.isPopular), asc(sportsLeagues.sortOrder));
}

export async function getPopularLeagues(): Promise<SportsLeague[]> {
  return db.select().from(sportsLeagues)
    .where(and(eq(sportsLeagues.isActive, true), eq(sportsLeagues.isPopular, true)))
    .orderBy(asc(sportsLeagues.sortOrder));
}

export async function createLeague(data: {
  name: string;
  country?: string;
  countryCode?: string;
  sport: string;
  logo?: string;
  isPopular?: boolean;
  sortOrder?: number;
}): Promise<SportsLeague> {
  const [league] = await db.insert(sportsLeagues).values({
    name: data.name,
    country: data.country,
    countryCode: data.countryCode,
    sport: data.sport,
    logo: data.logo,
    isPopular: data.isPopular ?? false,
    sortOrder: data.sortOrder ?? 0,
  }).returning();
  return league;
}

export async function updateLeague(id: string, data: Partial<{
  name: string;
  country: string;
  countryCode: string;
  sport: string;
  logo: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}>): Promise<SportsLeague | null> {
  const [league] = await db.update(sportsLeagues)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sportsLeagues.id, id))
    .returning();
  return league || null;
}

// ==========================================
// TEAMS
// ==========================================

export async function getTeams(sport?: string): Promise<SportsTeam[]> {
  if (sport) {
    return db.select().from(sportsTeams)
      .where(and(eq(sportsTeams.isActive, true), eq(sportsTeams.sport, sport)))
      .orderBy(asc(sportsTeams.name));
  }
  return db.select().from(sportsTeams)
    .where(eq(sportsTeams.isActive, true))
    .orderBy(asc(sportsTeams.name));
}

export async function createTeam(data: {
  name: string;
  shortName?: string;
  logo?: string;
  country?: string;
  sport: string;
}): Promise<SportsTeam> {
  const [team] = await db.insert(sportsTeams).values({
    name: data.name,
    shortName: data.shortName,
    logo: data.logo,
    country: data.country,
    sport: data.sport,
  }).returning();
  return team;
}

export async function updateTeam(id: string, data: Partial<{
  name: string;
  shortName: string;
  logo: string;
  country: string;
  isActive: boolean;
}>): Promise<SportsTeam | null> {
  const [team] = await db.update(sportsTeams)
    .set(data)
    .where(eq(sportsTeams.id, id))
    .returning();
  return team || null;
}

// ==========================================
// MATCHES
// ==========================================

export interface MatchWithDetails extends SportsMatch {
  league: SportsLeague;
  homeTeam: SportsTeam;
  awayTeam: SportsTeam;
  odds: SportsOdd[];
}

export async function getMatches(filters: {
  sport?: string;
  leagueId?: string;
  isLive?: boolean;
  status?: string;
  featured?: boolean;
  limit?: number;
}): Promise<MatchWithDetails[]> {
  const conditions = [];
  
  if (filters.sport) {
    conditions.push(eq(sportsMatches.sport, filters.sport));
  }
  if (filters.leagueId) {
    conditions.push(eq(sportsMatches.leagueId, filters.leagueId));
  }
  if (filters.isLive !== undefined) {
    conditions.push(eq(sportsMatches.isLive, filters.isLive));
    // For live filter, only show real matches with external IDs
    if (filters.isLive) {
      conditions.push(isNotNull(sportsMatches.externalId));
    }
  }
  if (filters.status) {
    conditions.push(eq(sportsMatches.status, filters.status));
  }
  if (filters.featured) {
    // Featured means: isFeatured=true OR isLive=true (live matches are always highlights)
    conditions.push(or(
      eq(sportsMatches.isFeatured, true),
      eq(sportsMatches.isLive, true)
    ));
    // Only show matches with real API data (has externalId)
    conditions.push(isNotNull(sportsMatches.externalId));
  }
  
  // Only show scheduled/live matches, with future start dates for scheduled
  conditions.push(or(
    eq(sportsMatches.status, "LIVE"),
    and(
      eq(sportsMatches.status, "SCHEDULED"),
      gte(sportsMatches.startsAt, new Date())
    )
  ));
  
  const matchRows = await db.select()
    .from(sportsMatches)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(sportsMatches.startsAt))
    .limit(filters.limit || 100);
  
  if (matchRows.length === 0) return [];
  
  const matchIds = matchRows.map(m => m.id);
  const leagueIds = Array.from(new Set(matchRows.map(m => m.leagueId)));
  const teamIds = Array.from(new Set(matchRows.flatMap(m => [m.homeTeamId, m.awayTeamId])));
  
  const [leagues, teams, odds] = await Promise.all([
    db.select().from(sportsLeagues).where(inArray(sportsLeagues.id, leagueIds)),
    db.select().from(sportsTeams).where(inArray(sportsTeams.id, teamIds)),
    db.select().from(sportsOdds).where(
      and(inArray(sportsOdds.matchId, matchIds), eq(sportsOdds.isActive, true))
    ),
  ]);
  
  const leagueMap = new Map(leagues.map(l => [l.id, l]));
  const teamMap = new Map(teams.map(t => [t.id, t]));
  
  return matchRows.map(match => ({
    ...match,
    league: leagueMap.get(match.leagueId)!,
    homeTeam: teamMap.get(match.homeTeamId)!,
    awayTeam: teamMap.get(match.awayTeamId)!,
    odds: odds.filter(o => o.matchId === match.id),
  }));
}

export async function getMatchById(id: string): Promise<MatchWithDetails | null> {
  const [match] = await db.select().from(sportsMatches).where(eq(sportsMatches.id, id));
  if (!match) return null;
  
  const [league] = await db.select().from(sportsLeagues).where(eq(sportsLeagues.id, match.leagueId));
  const [homeTeam] = await db.select().from(sportsTeams).where(eq(sportsTeams.id, match.homeTeamId));
  const [awayTeam] = await db.select().from(sportsTeams).where(eq(sportsTeams.id, match.awayTeamId));
  const odds = await db.select().from(sportsOdds)
    .where(and(eq(sportsOdds.matchId, id), eq(sportsOdds.isActive, true)));
  
  return { ...match, league, homeTeam, awayTeam, odds };
}

export async function createMatch(data: {
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  sport: string;
  startsAt: Date;
  isFeatured?: boolean;
}): Promise<SportsMatch> {
  const [match] = await db.insert(sportsMatches).values({
    leagueId: data.leagueId,
    homeTeamId: data.homeTeamId,
    awayTeamId: data.awayTeamId,
    sport: data.sport,
    startsAt: data.startsAt,
    isFeatured: data.isFeatured ?? false,
  }).returning();
  return match;
}

export async function updateMatchStatus(id: string, data: {
  status?: string;
  homeScore?: number;
  awayScore?: number;
  period?: string;
  minute?: number;
  result?: string;
}): Promise<SportsMatch | null> {
  const isLive = data.status === "LIVE";
  const [match] = await db.update(sportsMatches)
    .set({ 
      ...data, 
      isLive,
      updatedAt: new Date() 
    })
    .where(eq(sportsMatches.id, id))
    .returning();
  
  if (match && data.status === "FINISHED" && data.result) {
    await settleMatchBets(id, data.result);
  }
  
  return match || null;
}

// ==========================================
// ODDS
// ==========================================

export async function getOddsForMatch(matchId: string): Promise<SportsOdd[]> {
  return db.select().from(sportsOdds)
    .where(and(eq(sportsOdds.matchId, matchId), eq(sportsOdds.isActive, true)));
}

export async function createOdd(data: {
  matchId: string;
  marketType: string;
  selection: string;
  selectionName: string;
  odds: number;
  line?: number;
}): Promise<SportsOdd> {
  const [odd] = await db.insert(sportsOdds).values({
    matchId: data.matchId,
    marketType: data.marketType,
    selection: data.selection,
    selectionName: data.selectionName,
    odds: data.odds.toString(),
    line: data.line?.toString(),
  }).returning();
  return odd;
}

export async function updateOdd(id: string, data: Partial<{
  odds: number;
  line: number;
  isActive: boolean;
  isSuspended: boolean;
}>): Promise<SportsOdd | null> {
  const updateData: any = { updatedAt: new Date() };
  if (data.odds !== undefined) updateData.odds = data.odds.toString();
  if (data.line !== undefined) updateData.line = data.line.toString();
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isSuspended !== undefined) updateData.isSuspended = data.isSuspended;
  
  const [odd] = await db.update(sportsOdds)
    .set(updateData)
    .where(eq(sportsOdds.id, id))
    .returning();
  return odd || null;
}

export async function bulkCreateOdds(matchId: string, oddsData: Array<{
  marketType: string;
  selection: string;
  selectionName: string;
  odds: number;
  line?: number;
}>): Promise<SportsOdd[]> {
  if (oddsData.length === 0) return [];
  
  const values = oddsData.map(o => ({
    matchId,
    marketType: o.marketType,
    selection: o.selection,
    selectionName: o.selectionName,
    odds: o.odds.toString(),
    line: o.line?.toString(),
  }));
  
  return db.insert(sportsOdds).values(values).returning();
}

// ==========================================
// BETTING
// ==========================================

function generateBetNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomUUID().slice(0, 4).toUpperCase();
  return `BET-${timestamp}${random}`;
}

export async function placeBet(
  userId: string,
  data: {
    selections: Array<{
      matchId: string;
      oddId: string;
      odds: number;
    }>;
    stake: number;
    betType: string;
    useBonus?: boolean;
  }
): Promise<{ success: boolean; betSlip?: SportsBetSlip; error?: string }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return { success: false, error: "Usuário não encontrado" };
  }
  
  if (data.stake < 1) {
    return { success: false, error: "Aposta mínima: R$ 1,00" };
  }
  
  const oddIds = data.selections.map(s => s.oddId);
  const matchIds = data.selections.map(s => s.matchId);
  
  const [oddsDb, matchesDb] = await Promise.all([
    db.select().from(sportsOdds).where(inArray(sportsOdds.id, oddIds)),
    db.select().from(sportsMatches).where(inArray(sportsMatches.id, matchIds)),
  ]);
  
  const invalidOdd = oddsDb.find(o => !o.isActive || o.isSuspended);
  if (invalidOdd) {
    return { success: false, error: "Uma ou mais odds estão suspensas" };
  }
  
  const invalidMatch = matchesDb.find(m => m.status === "FINISHED" || m.status === "CANCELLED");
  if (invalidMatch) {
    return { success: false, error: "Uma ou mais partidas já terminaram" };
  }
  
  let totalOdds = 1;
  for (const selection of data.selections) {
    totalOdds *= selection.odds;
  }
  
  const potentialWin = data.stake * totalOdds;
  
  const balanceResult = await processBalanceChange(
    userId,
    -data.stake,
    "BET",
    `Aposta esportiva - ${data.selections.length} seleção(ões)`
  );
  
  if (!balanceResult.success) {
    return { success: false, error: balanceResult.error };
  }
  
  const betNumber = generateBetNumber();
  
  const [betSlip] = await db.insert(sportsBetSlips).values({
    betNumber,
    userId,
    betType: data.betType,
    totalOdds: totalOdds.toFixed(2),
    stake: data.stake.toFixed(2),
    potentialWin: potentialWin.toFixed(2),
    usedBonus: data.useBonus ?? false,
  }).returning();
  
  const selectionsToInsert = await Promise.all(data.selections.map(async (sel) => {
    const odd = oddsDb.find(o => o.id === sel.oddId)!;
    return {
      betSlipId: betSlip.id,
      matchId: sel.matchId,
      oddId: sel.oddId,
      marketType: odd.marketType,
      selection: odd.selection,
      selectionName: odd.selectionName,
      odds: sel.odds.toFixed(2),
    };
  }));
  
  await db.insert(sportsBetSelections).values(selectionsToInsert);
  
  return { success: true, betSlip };
}

export async function getUserBets(userId: string, status?: string): Promise<Array<SportsBetSlip & { selections: Array<SportsBetSelection & { match: SportsMatch; homeTeam: SportsTeam; awayTeam: SportsTeam }> }>> {
  const conditions = [eq(sportsBetSlips.userId, userId)];
  if (status) {
    conditions.push(eq(sportsBetSlips.status, status));
  }
  
  const betSlips = await db.select().from(sportsBetSlips)
    .where(and(...conditions))
    .orderBy(desc(sportsBetSlips.createdAt));
  
  if (betSlips.length === 0) return [];
  
  const betSlipIds = betSlips.map(b => b.id);
  const selections = await db.select().from(sportsBetSelections)
    .where(inArray(sportsBetSelections.betSlipId, betSlipIds));
  
  const matchIdsSet = Array.from(new Set(selections.map(s => s.matchId)));
  const matches = await db.select().from(sportsMatches)
    .where(inArray(sportsMatches.id, matchIdsSet));
  
  const teamIds = Array.from(new Set(matches.flatMap(m => [m.homeTeamId, m.awayTeamId])));
  const teams = await db.select().from(sportsTeams)
    .where(inArray(sportsTeams.id, teamIds));
  
  const matchMap = new Map(matches.map(m => [m.id, m]));
  const teamMap = new Map(teams.map(t => [t.id, t]));
  
  return betSlips.map(betSlip => ({
    ...betSlip,
    selections: selections
      .filter(s => s.betSlipId === betSlip.id)
      .map(s => {
        const match = matchMap.get(s.matchId)!;
        return {
          ...s,
          match,
          homeTeam: teamMap.get(match.homeTeamId)!,
          awayTeam: teamMap.get(match.awayTeamId)!,
        };
      }),
  }));
}

async function settleMatchBets(matchId: string, result: string) {
  const selections = await db.select().from(sportsBetSelections)
    .where(and(
      eq(sportsBetSelections.matchId, matchId),
      eq(sportsBetSelections.status, "PENDING")
    ));
  
  for (const selection of selections) {
    let selectionResult: string;
    
    if (selection.selection === result) {
      selectionResult = "WON";
    } else if (selection.selection === "DRAW" && result === "DRAW") {
      selectionResult = "WON";
    } else {
      selectionResult = "LOST";
    }
    
    await db.update(sportsBetSelections)
      .set({ status: selectionResult, result: selectionResult })
      .where(eq(sportsBetSelections.id, selection.id));
  }
  
  const affectedBetSlipIds = Array.from(new Set(selections.map(s => s.betSlipId)));
  
  for (const betSlipId of affectedBetSlipIds) {
    const [betSlip] = await db.select().from(sportsBetSlips)
      .where(eq(sportsBetSlips.id, betSlipId));
    
    const allSelections = await db.select().from(sportsBetSelections)
      .where(eq(sportsBetSelections.betSlipId, betSlipId));
    
    const pendingSelections = allSelections.filter(s => s.status === "PENDING");
    
    if (pendingSelections.length > 0) {
      continue;
    }
    
    const allWon = allSelections.every(s => s.status === "WON");
    const anyLost = allSelections.some(s => s.status === "LOST");
    
    let betStatus: string;
    let actualWin = 0;
    
    if (allWon) {
      betStatus = "WON";
      actualWin = parseFloat(betSlip.potentialWin);
      
      await processBalanceChange(
        betSlip.userId,
        actualWin,
        "WIN",
        `Aposta esportiva ganha - ${betSlip.betNumber}`
      );

      await sendNotificationToUser(betSlip.userId, {
        type: "BET_RESULT",
        title: "Aposta Ganha!",
        message: `Parabéns! Sua aposta ${betSlip.betNumber} foi vencedora. Você ganhou R$ ${actualWin.toFixed(2)}!`,
        icon: "trophy",
        actionUrl: "/sports/my-bets",
        priority: "HIGH",
      }).catch(err => console.error("[Notification] Failed to send bet win notification:", err));
    } else if (anyLost) {
      betStatus = "LOST";

      await sendNotificationToUser(betSlip.userId, {
        type: "BET_RESULT",
        title: "Aposta Encerrada",
        message: `Sua aposta ${betSlip.betNumber} foi encerrada. Boa sorte na próxima!`,
        icon: "x-circle",
        actionUrl: "/sports/my-bets",
      }).catch(err => console.error("[Notification] Failed to send bet loss notification:", err));
    } else {
      betStatus = "VOID";
      await processBalanceChange(
        betSlip.userId,
        parseFloat(betSlip.stake),
        "ROLLBACK",
        `Aposta esportiva cancelada - ${betSlip.betNumber}`
      );
    }
    
    await db.update(sportsBetSlips).set({
      status: betStatus,
      actualWin: actualWin.toFixed(2),
      settledAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(sportsBetSlips.id, betSlipId));
  }
}

// ==========================================
// SEED DATA
// ==========================================

export async function seedSportsData(): Promise<void> {
  const existingLeagues = await db.select().from(sportsLeagues).limit(1);
  if (existingLeagues.length > 0) {
    console.log("[SPORTS] Data already seeded");
    return;
  }
  
  console.log("[SPORTS] Seeding sports data...");
  
  const leaguesData = [
    { name: "Brasileirão Série A", country: "Brasil", countryCode: "BR", sport: "FOOTBALL", isPopular: true, sortOrder: 1 },
    { name: "Premier League", country: "Inglaterra", countryCode: "GB", sport: "FOOTBALL", isPopular: true, sortOrder: 2 },
    { name: "La Liga", country: "Espanha", countryCode: "ES", sport: "FOOTBALL", isPopular: true, sortOrder: 3 },
    { name: "Champions League", country: "Europa", countryCode: "EU", sport: "FOOTBALL", isPopular: true, sortOrder: 4 },
    { name: "Copa Libertadores", country: "América do Sul", countryCode: "SA", sport: "FOOTBALL", isPopular: true, sortOrder: 5 },
    { name: "NBA", country: "EUA", countryCode: "US", sport: "BASKETBALL", isPopular: true, sortOrder: 6 },
    { name: "NBB", country: "Brasil", countryCode: "BR", sport: "BASKETBALL", isPopular: false, sortOrder: 7 },
    { name: "UFC", country: "Internacional", countryCode: "XX", sport: "MMA", isPopular: true, sortOrder: 8 },
    { name: "CS2 Major", country: "Internacional", countryCode: "XX", sport: "ESPORTS", isPopular: true, sortOrder: 9 },
    { name: "Superliga Brasileira", country: "Brasil", countryCode: "BR", sport: "VOLLEYBALL", isPopular: false, sortOrder: 10 },
  ];
  
  const leagues = await db.insert(sportsLeagues).values(leaguesData).returning();
  const leagueMap = new Map(leagues.map(l => [l.name, l.id]));
  
  const teamsData = [
    { name: "Flamengo", shortName: "FLA", country: "Brasil", sport: "FOOTBALL" },
    { name: "Palmeiras", shortName: "PAL", country: "Brasil", sport: "FOOTBALL" },
    { name: "Corinthians", shortName: "COR", country: "Brasil", sport: "FOOTBALL" },
    { name: "São Paulo", shortName: "SAO", country: "Brasil", sport: "FOOTBALL" },
    { name: "Santos", shortName: "SAN", country: "Brasil", sport: "FOOTBALL" },
    { name: "Fluminense", shortName: "FLU", country: "Brasil", sport: "FOOTBALL" },
    { name: "Atlético-MG", shortName: "CAM", country: "Brasil", sport: "FOOTBALL" },
    { name: "Botafogo", shortName: "BOT", country: "Brasil", sport: "FOOTBALL" },
    { name: "Manchester City", shortName: "MCI", country: "Inglaterra", sport: "FOOTBALL" },
    { name: "Liverpool", shortName: "LIV", country: "Inglaterra", sport: "FOOTBALL" },
    { name: "Arsenal", shortName: "ARS", country: "Inglaterra", sport: "FOOTBALL" },
    { name: "Chelsea", shortName: "CHE", country: "Inglaterra", sport: "FOOTBALL" },
    { name: "Real Madrid", shortName: "RMA", country: "Espanha", sport: "FOOTBALL" },
    { name: "Barcelona", shortName: "BAR", country: "Espanha", sport: "FOOTBALL" },
    { name: "Bayern Munich", shortName: "BAY", country: "Alemanha", sport: "FOOTBALL" },
    { name: "PSG", shortName: "PSG", country: "França", sport: "FOOTBALL" },
    { name: "Los Angeles Lakers", shortName: "LAL", country: "EUA", sport: "BASKETBALL" },
    { name: "Golden State Warriors", shortName: "GSW", country: "EUA", sport: "BASKETBALL" },
    { name: "Miami Heat", shortName: "MIA", country: "EUA", sport: "BASKETBALL" },
    { name: "Boston Celtics", shortName: "BOS", country: "EUA", sport: "BASKETBALL" },
  ];
  
  const teams = await db.insert(sportsTeams).values(teamsData).returning();
  const teamMap = new Map(teams.map(t => [t.name, t.id]));
  
  const now = new Date();
  const matchesData = [
    {
      leagueId: leagueMap.get("Brasileirão Série A")!,
      homeTeamId: teamMap.get("Flamengo")!,
      awayTeamId: teamMap.get("Palmeiras")!,
      sport: "FOOTBALL",
      startsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      isFeatured: true,
    },
    {
      leagueId: leagueMap.get("Brasileirão Série A")!,
      homeTeamId: teamMap.get("Corinthians")!,
      awayTeamId: teamMap.get("São Paulo")!,
      sport: "FOOTBALL",
      startsAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      isFeatured: true,
    },
    {
      leagueId: leagueMap.get("Brasileirão Série A")!,
      homeTeamId: teamMap.get("Fluminense")!,
      awayTeamId: teamMap.get("Botafogo")!,
      sport: "FOOTBALL",
      startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      isFeatured: false,
    },
    {
      leagueId: leagueMap.get("Premier League")!,
      homeTeamId: teamMap.get("Manchester City")!,
      awayTeamId: teamMap.get("Liverpool")!,
      sport: "FOOTBALL",
      startsAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      isFeatured: true,
    },
    {
      leagueId: leagueMap.get("Premier League")!,
      homeTeamId: teamMap.get("Arsenal")!,
      awayTeamId: teamMap.get("Chelsea")!,
      sport: "FOOTBALL",
      startsAt: new Date(now.getTime() + 30 * 60 * 60 * 1000),
      isFeatured: false,
    },
    {
      leagueId: leagueMap.get("Champions League")!,
      homeTeamId: teamMap.get("Real Madrid")!,
      awayTeamId: teamMap.get("Bayern Munich")!,
      sport: "FOOTBALL",
      startsAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      isFeatured: true,
    },
    {
      leagueId: leagueMap.get("Champions League")!,
      homeTeamId: teamMap.get("Barcelona")!,
      awayTeamId: teamMap.get("PSG")!,
      sport: "FOOTBALL",
      startsAt: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      isFeatured: false,
    },
    {
      leagueId: leagueMap.get("NBA")!,
      homeTeamId: teamMap.get("Los Angeles Lakers")!,
      awayTeamId: teamMap.get("Golden State Warriors")!,
      sport: "BASKETBALL",
      startsAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      isFeatured: true,
    },
    {
      leagueId: leagueMap.get("NBA")!,
      homeTeamId: teamMap.get("Miami Heat")!,
      awayTeamId: teamMap.get("Boston Celtics")!,
      sport: "BASKETBALL",
      startsAt: new Date(now.getTime() + 32 * 60 * 60 * 1000),
      isFeatured: false,
    },
  ];
  
  const matches = await db.insert(sportsMatches).values(matchesData).returning();
  
  for (const match of matches) {
    const [homeTeam] = teams.filter(t => t.id === match.homeTeamId);
    const [awayTeam] = teams.filter(t => t.id === match.awayTeamId);
    
    const homeOdds = (1.5 + Math.random() * 2).toFixed(2);
    const drawOdds = (2.5 + Math.random() * 1.5).toFixed(2);
    const awayOdds = (1.8 + Math.random() * 2.5).toFixed(2);
    
    const oddsValues = [
      {
        matchId: match.id,
        marketType: "MATCH_WINNER",
        selection: "HOME",
        selectionName: `${homeTeam.name} vence`,
        odds: homeOdds,
      },
      {
        matchId: match.id,
        marketType: "MATCH_WINNER",
        selection: "DRAW",
        selectionName: "Empate",
        odds: drawOdds,
      },
      {
        matchId: match.id,
        marketType: "MATCH_WINNER",
        selection: "AWAY",
        selectionName: `${awayTeam.name} vence`,
        odds: awayOdds,
      },
      {
        matchId: match.id,
        marketType: "DOUBLE_CHANCE",
        selection: "HOME_DRAW",
        selectionName: `${homeTeam.shortName || homeTeam.name} ou Empate`,
        odds: (1.2 + Math.random() * 0.5).toFixed(2),
      },
      {
        matchId: match.id,
        marketType: "DOUBLE_CHANCE",
        selection: "AWAY_DRAW",
        selectionName: `${awayTeam.shortName || awayTeam.name} ou Empate`,
        odds: (1.3 + Math.random() * 0.6).toFixed(2),
      },
      {
        matchId: match.id,
        marketType: "OVER_UNDER",
        selection: "OVER_2.5",
        selectionName: "Mais de 2.5 gols",
        odds: (1.7 + Math.random() * 0.5).toFixed(2),
        line: "2.5",
      },
      {
        matchId: match.id,
        marketType: "OVER_UNDER",
        selection: "UNDER_2.5",
        selectionName: "Menos de 2.5 gols",
        odds: (1.9 + Math.random() * 0.4).toFixed(2),
        line: "2.5",
      },
      {
        matchId: match.id,
        marketType: "BOTH_TEAMS_SCORE",
        selection: "YES",
        selectionName: "Ambos marcam - Sim",
        odds: (1.6 + Math.random() * 0.4).toFixed(2),
      },
      {
        matchId: match.id,
        marketType: "BOTH_TEAMS_SCORE",
        selection: "NO",
        selectionName: "Ambos marcam - Não",
        odds: (2.0 + Math.random() * 0.5).toFixed(2),
      },
    ];
    
    await db.insert(sportsOdds).values(oddsValues);
  }
  
  console.log("[SPORTS] Data seeded successfully");
}
