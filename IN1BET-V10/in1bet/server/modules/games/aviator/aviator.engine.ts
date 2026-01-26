import { WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";
import { db } from "../../../db";
import { aviatorRounds, aviatorBets } from "../../../../shared/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

const WAITING_DURATION = 15000;
const CRASH_DISPLAY_DURATION = 5000;
const GAME_TICK_MS = 50;

interface ProvablyFairData {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

interface GameState {
  roundId: number | null;
  status: "waiting" | "running" | "crashed";
  startTime: number;
  crashPoint: number;
  currentMultiplier: number;
  waitingStartTime: number;
  crashTime: number;
  provablyFair: ProvablyFairData | null;
}

export class AviatorEngine {
  private wss: WebSocketServer;
  private gameState: GameState;
  private nonce: number = 0;
  private currentServerSeed: string = "";
  private nextServerSeed: string = "";
  private nextServerSeedHash: string = "";

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ 
      noServer: true,
      perMessageDeflate: false 
    });
    
    server.on("upgrade", (request, socket, head) => {
      const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
      
      if (pathname === "/ws/aviator") {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit("connection", ws, request);
        });
      }
    });
    
    this.currentServerSeed = this.generateServerSeed();
    this.nextServerSeed = this.generateServerSeed();
    this.nextServerSeedHash = this.hashSeed(this.nextServerSeed);
    
    this.gameState = {
      roundId: null,
      status: "waiting",
      startTime: 0,
      crashPoint: 1.0,
      currentMultiplier: 1.0,
      waitingStartTime: Date.now(),
      crashTime: 0,
      provablyFair: null,
    };

    this.wss.on("connection", async (ws: WebSocket) => {
      console.log("[Aviator] Client connected to WebSocket");
      
      const history = await this.getRecentHistory();
      
      this.sendToClient(ws, {
        type: "state",
        data: {
          ...this.gameState,
          nextServerSeedHash: this.nextServerSeedHash,
          history,
        },
      });

      ws.on("close", () => {
        console.log("[Aviator] Client disconnected from WebSocket");
      });
    });

    this.startGameLoop();
  }

  private async getRecentHistory() {
    try {
      const rounds = await db
        .select()
        .from(aviatorRounds)
        .where(eq(aviatorRounds.status, "crashed"))
        .orderBy(desc(aviatorRounds.id))
        .limit(20);
      
      return rounds.map(r => ({
        crashPoint: parseFloat(r.crashPoint),
        roundId: r.id
      }));
    } catch (error) {
      return [];
    }
  }

  private broadcast(message: any) {
    const payload = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  private sendToClient(client: WebSocket, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private generateServerSeed(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private hashSeed(seed: string): string {
    return crypto.createHash("sha256").update(seed).digest("hex");
  }

  private generateClientSeed(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  private calculateCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number {
    const message = `${clientSeed}-${nonce}`;
    const hmac = crypto.createHmac("sha256", serverSeed).update(message).digest("hex");
    
    const h = parseInt(hmac.substring(0, 8), 16);
    
    const e = 0.01;
    
    const divisor = 1 - h / Math.pow(2, 32);
    
    if (divisor <= 0) {
      return 1.0;
    }
    
    const crashPoint = Math.max(1.0, (1 - e) / divisor);
    
    return Math.min(crashPoint, 100.0);
  }

  private calculateMultiplier(elapsedMs: number): number {
    const t = elapsedMs / 1000;
    return Math.exp(0.15 * t);
  }

  private startGameLoop() {
    console.log("[Aviator] Starting game loop");

    setInterval(async () => {
      const now = Date.now();

      if (this.gameState.status === "waiting") {
        const waitingElapsed = now - this.gameState.waitingStartTime;
        
        if (waitingElapsed >= WAITING_DURATION) {
          await this.startNewRound();
        } else {
          const remainingMs = WAITING_DURATION - waitingElapsed;
          this.broadcast({
            type: "countdown",
            data: { 
              remainingMs,
              nextServerSeedHash: this.nextServerSeedHash,
            },
          });
        }
      } else if (this.gameState.status === "running") {
        const elapsed = now - this.gameState.startTime;
        const currentMultiplier = this.calculateMultiplier(elapsed);

        this.gameState.currentMultiplier = currentMultiplier;

        if (currentMultiplier >= this.gameState.crashPoint) {
          await this.crashGame();
        } else {
          this.broadcast({
            type: "multiplier",
            data: {
              multiplier: currentMultiplier,
              roundId: this.gameState.roundId,
            },
          });
        }
      } else if (this.gameState.status === "crashed") {
        const crashElapsed = now - this.gameState.crashTime;
        
        if (crashElapsed >= CRASH_DISPLAY_DURATION) {
          this.gameState = {
            roundId: null,
            status: "waiting",
            startTime: 0,
            crashPoint: 1.0,
            currentMultiplier: 1.0,
            waitingStartTime: Date.now(),
            crashTime: 0,
            provablyFair: null,
          };
          
          this.broadcast({
            type: "new_round_starting",
            data: {
              nextServerSeedHash: this.nextServerSeedHash,
            },
          });
        }
      }
    }, GAME_TICK_MS);
  }

  private async startNewRound() {
    this.nonce++;
    
    const revealedServerSeed = this.currentServerSeed;
    this.currentServerSeed = this.nextServerSeed;
    this.nextServerSeed = this.generateServerSeed();
    this.nextServerSeedHash = this.hashSeed(this.nextServerSeed);
    
    const clientSeed = this.generateClientSeed();
    const crashPoint = this.calculateCrashPoint(this.currentServerSeed, clientSeed, this.nonce);
    
    const provablyFairData: ProvablyFairData = {
      serverSeed: this.currentServerSeed,
      serverSeedHash: this.hashSeed(this.currentServerSeed),
      clientSeed,
      nonce: this.nonce,
    };
    
    console.log(`[Aviator] Starting new round #${this.nonce} with crash point: ${crashPoint.toFixed(2)}x`);

    const [round] = await db.insert(aviatorRounds).values({
      crashPoint: crashPoint.toFixed(2),
      status: "running",
      serverSeedHash: provablyFairData.serverSeedHash,
      clientSeed: provablyFairData.clientSeed,
      nonce: provablyFairData.nonce,
    }).returning();

    this.gameState = {
      roundId: round.id,
      status: "running",
      startTime: Date.now(),
      crashPoint,
      currentMultiplier: 1.0,
      waitingStartTime: 0,
      crashTime: 0,
      provablyFair: provablyFairData,
    };

    const bets = await db
      .select()
      .from(aviatorBets)
      .where(eq(aviatorBets.roundId, round.id));
    
    for (const bet of bets) {
      if (bet.status === "pending") {
        await db
          .update(aviatorBets)
          .set({ status: "active" })
          .where(eq(aviatorBets.id, bet.id));
      }
    }

    this.broadcast({
      type: "round_start",
      data: {
        roundId: round.id,
        timestamp: Date.now(),
        serverSeedHash: provablyFairData.serverSeedHash,
        clientSeed: provablyFairData.clientSeed,
        nonce: provablyFairData.nonce,
      },
    });
  }

  private async crashGame() {
    if (this.gameState.status === "crashed") {
      return;
    }
    
    this.gameState.status = "crashed";
    this.gameState.crashTime = Date.now();
    
    console.log(`[Aviator] Game crashed at ${this.gameState.crashPoint.toFixed(2)}x`);

    if (this.gameState.roundId) {
      await db
        .update(aviatorRounds)
        .set({ 
          status: "crashed", 
          crashedAt: new Date() 
        })
        .where(eq(aviatorRounds.id, this.gameState.roundId));

      if (this.gameState.provablyFair?.serverSeed) {
        await db
          .update(aviatorRounds)
          .set({ serverSeed: this.gameState.provablyFair.serverSeed })
          .where(eq(aviatorRounds.id, this.gameState.roundId));
      }

      const bets = await db
        .select()
        .from(aviatorBets)
        .where(eq(aviatorBets.roundId, this.gameState.roundId));
      
      for (const bet of bets) {
        if (bet.status === "active") {
          await db
            .update(aviatorBets)
            .set({ status: "lost" })
            .where(eq(aviatorBets.id, bet.id));
        }
      }

      this.broadcast({
        type: "crash",
        data: {
          crashPoint: this.gameState.crashPoint,
          roundId: this.gameState.roundId,
          provablyFair: {
            serverSeed: this.gameState.provablyFair?.serverSeed,
            serverSeedHash: this.gameState.provablyFair?.serverSeedHash,
            clientSeed: this.gameState.provablyFair?.clientSeed,
            nonce: this.gameState.provablyFair?.nonce,
          },
        },
      });
    }
  }

  public getCurrentRoundId(): number | null {
    return this.gameState.roundId;
  }

  public getGameStatus(): GameState["status"] {
    return this.gameState.status;
  }

  public getProvablyFairData(): ProvablyFairData | null {
    return this.gameState.provablyFair;
  }

  public getCurrentMultiplier(): number {
    return this.gameState.currentMultiplier;
  }
}

export function verifyCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number {
  const message = `${clientSeed}-${nonce}`;
  const hmac = crypto.createHmac("sha256", serverSeed).update(message).digest("hex");
  
  const h = parseInt(hmac.substring(0, 8), 16);
  const e = 0.01;
  const divisor = 1 - h / Math.pow(2, 32);
  
  if (divisor <= 0) {
    return 1.0;
  }
  
  const crashPoint = Math.max(1.0, (1 - e) / divisor);
  return Math.min(crashPoint, 100.0);
}
