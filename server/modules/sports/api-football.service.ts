import { db } from "../../db";
import {
  sportsLeagues,
  sportsTeams,
  sportsMatches,
  sportsOdds,
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE_URL = "https://v3.football.api-sports.io";

interface ApiFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

interface ApiOdd {
  league: { id: number; name: string };
  fixture: { id: number };
  bookmakers: Array<{
    id: number;
    name: string;
    bets: Array<{
      id: number;
      name: string;
      values: Array<{
        value: string;
        odd: string;
      }>;
    }>;
  }>;
}

const POPULAR_LEAGUES = [
  { id: 71, name: "Brasileirão Série A", country: "Brazil", sport: "FOOTBALL", isPopular: true },
  { id: 39, name: "Premier League", country: "England", sport: "FOOTBALL", isPopular: true },
  { id: 140, name: "La Liga", country: "Spain", sport: "FOOTBALL", isPopular: true },
  { id: 2, name: "Champions League", country: "World", sport: "FOOTBALL", isPopular: true },
  { id: 13, name: "Copa Libertadores", country: "World", sport: "FOOTBALL", isPopular: true },
  { id: 135, name: "Serie A", country: "Italy", sport: "FOOTBALL", isPopular: true },
  { id: 78, name: "Bundesliga", country: "Germany", sport: "FOOTBALL", isPopular: true },
  { id: 61, name: "Ligue 1", country: "France", sport: "FOOTBALL", isPopular: true },
];

async function fetchFromApi(endpoint: string): Promise<any> {
  if (!API_FOOTBALL_KEY) {
    console.error("[API-Football] API key not configured");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": API_FOOTBALL_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });

    if (!response.ok) {
      console.error(`[API-Football] HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("[API-Football] API errors:", data.errors);
      return null;
    }

    return data.response;
  } catch (error) {
    console.error("[API-Football] Fetch error:", error);
    return null;
  }
}

export async function fetchLiveFixtures(): Promise<ApiFixture[]> {
  console.log("[API-Football] Fetching live fixtures...");
  const data = await fetchFromApi("/fixtures?live=all");
  return data || [];
}

export async function fetchUpcomingFixtures(leagueId?: number): Promise<ApiFixture[]> {
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  let endpoint = `/fixtures?from=${today}&to=${nextWeek}&status=NS`;
  if (leagueId) {
    endpoint += `&league=${leagueId}&season=2024`;
  }
  
  console.log("[API-Football] Fetching upcoming fixtures...", endpoint);
  const data = await fetchFromApi(endpoint);
  return data || [];
}

// Note: API-Football free plan only supports seasons 2022-2024 and has restrictions
// on parameters like 'next', 'last', and future date ranges. For production with
// current season data, upgrade to a paid API plan.
export async function fetchFixturesForLeague(leagueId: number, season: number = 2024): Promise<ApiFixture[]> {
  const from = "2024-08-01";
  const to = "2024-12-31";
  const endpoint = `/fixtures?league=${leagueId}&season=${season}&from=${from}&to=${to}`;
  
  console.log("[API-Football] Fetching fixtures for league", leagueId);
  const data = await fetchFromApi(endpoint);
  return data || [];
}

export async function fetchOddsForFixture(fixtureId: number): Promise<ApiOdd | null> {
  const data = await fetchFromApi(`/odds?fixture=${fixtureId}`);
  return data && data.length > 0 ? data[0] : null;
}

function mapApiStatus(status: string): string {
  const statusMap: Record<string, string> = {
    NS: "SCHEDULED",
    "1H": "LIVE",
    HT: "LIVE",
    "2H": "LIVE",
    ET: "LIVE",
    P: "LIVE",
    FT: "FINISHED",
    AET: "FINISHED",
    PEN: "FINISHED",
    BT: "LIVE",
    SUSP: "SUSPENDED",
    INT: "SUSPENDED",
    PST: "POSTPONED",
    CANC: "CANCELLED",
    ABD: "CANCELLED",
    AWD: "FINISHED",
    WO: "FINISHED",
    LIVE: "LIVE",
  };
  return statusMap[status] || "SCHEDULED";
}

async function getOrCreateLeague(apiLeague: ApiFixture["league"]): Promise<string> {
  const externalId = `apifootball_${apiLeague.id}`;
  
  const [existing] = await db.select()
    .from(sportsLeagues)
    .where(eq(sportsLeagues.externalId, externalId));
  
  if (existing) return existing.id;
  
  const popularLeague = POPULAR_LEAGUES.find(l => l.id === apiLeague.id);
  
  const [newLeague] = await db.insert(sportsLeagues).values({
    name: apiLeague.name,
    country: apiLeague.country,
    sport: "FOOTBALL",
    logo: apiLeague.logo,
    isPopular: popularLeague?.isPopular ?? false,
    externalId,
    sortOrder: popularLeague ? POPULAR_LEAGUES.indexOf(popularLeague) : 100,
  }).returning();
  
  return newLeague.id;
}

async function getOrCreateTeam(team: { id: number; name: string; logo: string }, country: string): Promise<string> {
  const externalId = `apifootball_${team.id}`;
  
  const [existing] = await db.select()
    .from(sportsTeams)
    .where(eq(sportsTeams.externalId, externalId));
  
  if (existing) return existing.id;
  
  const shortName = team.name.substring(0, 3).toUpperCase();
  
  const [newTeam] = await db.insert(sportsTeams).values({
    name: team.name,
    shortName,
    logo: team.logo,
    country,
    sport: "FOOTBALL",
    externalId,
  }).returning();
  
  return newTeam.id;
}

export async function syncFixturesToDatabase(fixtures: ApiFixture[]): Promise<number> {
  let synced = 0;
  
  for (const fixture of fixtures) {
    try {
      const externalId = `apifootball_${fixture.fixture.id}`;
      
      const [existingMatch] = await db.select()
        .from(sportsMatches)
        .where(eq(sportsMatches.externalId, externalId));
      
      const leagueId = await getOrCreateLeague(fixture.league);
      const homeTeamId = await getOrCreateTeam(fixture.teams.home, fixture.league.country);
      const awayTeamId = await getOrCreateTeam(fixture.teams.away, fixture.league.country);
      
      const status = mapApiStatus(fixture.fixture.status.short);
      const isLive = status === "LIVE";
      
      if (existingMatch) {
        await db.update(sportsMatches)
          .set({
            status,
            isLive,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            minute: fixture.fixture.status.elapsed,
            period: fixture.fixture.status.short,
            updatedAt: new Date(),
          })
          .where(eq(sportsMatches.id, existingMatch.id));
      } else {
        const [newMatch] = await db.insert(sportsMatches).values({
          leagueId,
          homeTeamId,
          awayTeamId,
          sport: "FOOTBALL",
          startsAt: new Date(fixture.fixture.date),
          status,
          isLive,
          homeScore: fixture.goals.home,
          awayScore: fixture.goals.away,
          minute: fixture.fixture.status.elapsed,
          period: fixture.fixture.status.short,
          externalId,
          isFeatured: POPULAR_LEAGUES.some(l => l.id === fixture.league.id),
        }).returning();
        
        await createDefaultOdds(newMatch.id, fixture.teams.home.name, fixture.teams.away.name);
      }
      
      synced++;
    } catch (error) {
      console.error(`[API-Football] Error syncing fixture ${fixture.fixture.id}:`, error);
    }
  }
  
  return synced;
}

async function createDefaultOdds(matchId: string, homeTeam: string, awayTeam: string) {
  const homeOdds = (1.5 + Math.random() * 2).toFixed(2);
  const drawOdds = (2.5 + Math.random() * 1.5).toFixed(2);
  const awayOdds = (2 + Math.random() * 3).toFixed(2);
  
  await db.insert(sportsOdds).values([
    {
      matchId,
      marketType: "MATCH_WINNER",
      selection: "HOME",
      selectionName: homeTeam,
      odds: homeOdds,
    },
    {
      matchId,
      marketType: "MATCH_WINNER",
      selection: "DRAW",
      selectionName: "Empate",
      odds: drawOdds,
    },
    {
      matchId,
      marketType: "MATCH_WINNER",
      selection: "AWAY",
      selectionName: awayTeam,
      odds: awayOdds,
    },
  ]);
}

export async function syncPopularLeaguesFixtures(): Promise<{ total: number; synced: number }> {
  console.log("[API-Football] Syncing popular leagues fixtures...");
  
  let totalFixtures: ApiFixture[] = [];
  
  for (const league of POPULAR_LEAGUES.slice(0, 3)) {
    try {
      const fixtures = await fetchFixturesForLeague(league.id, 2024);
      if (fixtures && fixtures.length > 0) {
        totalFixtures = [...totalFixtures, ...fixtures.slice(0, 10)];
        console.log(`[API-Football] Got ${fixtures.length} fixtures for ${league.name}`);
      }
    } catch (error) {
      console.error(`[API-Football] Error fetching fixtures for ${league.name}:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  try {
    const liveFixtures = await fetchLiveFixtures();
    if (liveFixtures && liveFixtures.length > 0) {
      totalFixtures = [...totalFixtures, ...liveFixtures];
      console.log(`[API-Football] Got ${liveFixtures.length} live fixtures`);
    }
  } catch (error) {
    console.error("[API-Football] Error fetching live fixtures:", error);
  }
  
  const uniqueFixtures = totalFixtures.filter((f, i, arr) => 
    arr.findIndex(x => x.fixture.id === f.fixture.id) === i
  );
  
  const synced = await syncFixturesToDatabase(uniqueFixtures);
  
  console.log(`[API-Football] Synced ${synced} fixtures total`);
  
  return { total: uniqueFixtures.length, synced };
}

export async function initializeApiFootball(): Promise<void> {
  if (!API_FOOTBALL_KEY) {
    console.log("[API-Football] API key not configured, skipping initialization");
    return;
  }
  
  console.log("[API-Football] Initializing...");
  
  try {
    const result = await syncPopularLeaguesFixtures();
    console.log(`[API-Football] Initial sync complete: ${result.synced} fixtures`);
  } catch (error) {
    console.error("[API-Football] Initialization error:", error);
  }
}
