import React, { useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Wallet, Volume2, VolumeX, Shield, Loader2, Copy, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 520;
const PIN_RADIUS = 4;
const BALL_RADIUS = 7;

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type RowsOption = 8 | 12 | 16;

const MULTIPLIERS: Record<RiskLevel, Record<RowsOption, number[]>> = {
  LOW: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [8.9, 3, 1.4, 1.1, 1, 0.5, 0.3, 0.5, 1, 1.1, 1.4, 3, 8.9],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  MEDIUM: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  HIGH: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
};

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "text-green-400",
  MEDIUM: "text-yellow-400",
  HIGH: "text-red-400",
};

interface AnimatedBall {
  id: string;
  x: number;
  y: number;
  pathIndex: number;
  positions: { x: number; y: number }[];
  bet: number;
  multiplier: number;
  winAmount: number;
  bucket: number;
  completed: boolean;
}

interface Pin {
  x: number;
  y: number;
}

interface BetHistory {
  id: string;
  bet: number;
  multiplier: number;
  profit: number;
  timestamp: number;
}

interface ProvablyFairData {
  serverSeedHash: string;
  serverSeed?: string;
  clientSeed?: string;
  nonce?: number;
}

function generatePins(rows: number): Pin[] {
  const pins: Pin[] = [];
  const startY = 60;
  const endY = CANVAS_HEIGHT - 80;
  const spacingY = (endY - startY) / (rows - 1);
  const spacingX = CANVAS_WIDTH / (rows + 2);

  for (let row = 0; row < rows; row++) {
    const pinsInRow = row + 3;
    const rowWidth = (pinsInRow - 1) * spacingX;
    const startX = (CANVAS_WIDTH - rowWidth) / 2;

    for (let col = 0; col < pinsInRow; col++) {
      pins.push({
        x: startX + col * spacingX,
        y: startY + row * spacingY,
      });
    }
  }

  return pins;
}

function getSlotColor(multiplier: number): string {
  if (multiplier >= 100) return "#ffd700";
  if (multiplier >= 10) return "#ffaa00";
  if (multiplier >= 2) return "#ff6600";
  if (multiplier >= 1) return "#22c55e";
  return "#ef4444";
}

function ProvablyFairModal({ data }: { data: ProvablyFairData | null }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
          <Shield className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Provably Fair - Plinko
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Verifique a integridade e justiça de cada jogo usando criptografia.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Server Seed Hash (Próxima Rodada)</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] bg-black/40 p-2 rounded border border-white/5 text-green-400 break-all font-mono">
                {data?.serverSeedHash || "Faça uma aposta para ver"}
              </code>
              {data?.serverSeedHash && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={() => copyToClipboard(data.serverSeedHash!, "hash")}
                >
                  {copied === "hash" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          {data?.serverSeed && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Server Seed (Última Rodada)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] bg-black/40 p-2 rounded border border-white/5 text-yellow-400 break-all font-mono">
                  {data.serverSeed}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={() => copyToClipboard(data.serverSeed!, "seed")}
                >
                  {copied === "seed" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {data?.clientSeed && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Client Seed</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] bg-black/40 p-2 rounded border border-white/5 text-blue-400 break-all font-mono">
                  {data.clientSeed}
                </code>
              </div>
            </div>
          )}

          {data?.nonce !== undefined && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nonce</Label>
              <code className="block text-[10px] bg-black/40 p-2 rounded border border-white/5 text-purple-400 font-mono">
                {data.nonce}
              </code>
            </div>
          )}

          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <h4 className="font-bold text-green-400 text-sm mb-2">Como Verificar?</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
              <li>Copie o Server Seed, Client Seed e Nonce</li>
              <li>Calcule: HMAC-SHA256(serverSeed, clientSeed:nonce:row)</li>
              <li>Cada direção (0=esquerda, 1=direita) é determinada pelo hash</li>
              <li>A posição final determina o multiplicador</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Plinko2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedBallsRef = useRef<AnimatedBall[]>([]);
  const animationRef = useRef<number>(0);
  const pinsRef = useRef<Pin[]>(generatePins(12));

  const [risk, setRisk] = useState<RiskLevel>("MEDIUM");
  const [rows, setRows] = useState<RowsOption>(12);
  const [betAmount, setBetAmount] = useState("10.00");
  const [betHistory, setBetHistory] = useState<BetHistory[]>([]);
  const [lastHitSlot, setLastHitSlot] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [activeBalls, setActiveBalls] = useState(0);
  const [showBigWin, setShowBigWin] = useState(false);
  const [bigWinAmount, setBigWinAmount] = useState(0);
  const [provablyFairData, setProvablyFairData] = useState<ProvablyFairData | null>(null);
  const [riskOpen, setRiskOpen] = useState(false);
  const [rowsOpen, setRowsOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/wallet");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 3000,
  });

  const balance = walletData?.wallet?.balance ? parseFloat(walletData.wallet.balance) : 0;

  const playMutation = useMutation({
    mutationFn: async (data: { betAmount: number; risk: RiskLevel; rows: RowsOption }) => {
      const res = await apiRequest("POST", "/api/games/plinko/play", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  useEffect(() => {
    pinsRef.current = generatePins(rows);
  }, [rows]);

  const multipliers = MULTIPLIERS[risk][rows];
  const numSlots = multipliers.length;
  const slotWidth = CANVAS_WIDTH / numSlots;

  const calculateBallPath = useCallback(
    (path: number[], targetBucket: number): { x: number; y: number }[] => {
      const positions: { x: number; y: number }[] = [];
      const startY = 60;
      const endY = CANVAS_HEIGHT - 80;
      const spacingY = (endY - startY) / Math.max(rows - 1, 1);
      const spacingX = CANVAS_WIDTH / (rows + 2);

      positions.push({ x: CANVAS_WIDTH / 2, y: 25 });

      let rightCount = 0;
      for (let i = 0; i < rows; i++) {
        const direction = path[i] || 0;
        if (direction === 1) rightCount++;

        const pinsInRow = i + 3;
        const rowWidth = (pinsInRow - 1) * spacingX;
        const rowStartX = (CANVAS_WIDTH - rowWidth) / 2;

        const ballColumn = rightCount;
        const ballX = rowStartX + ballColumn * spacingX;
        const ballY = startY + i * spacingY + spacingY * 0.5;

        if (isFinite(ballX) && isFinite(ballY)) {
          positions.push({ x: ballX, y: ballY });
        }
      }

      const finalX = (targetBucket + 0.5) * slotWidth;
      positions.push({ x: isFinite(finalX) ? finalX : CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 45 });

      return positions;
    },
    [rows, slotWidth]
  );

  const handleDropBall = useCallback(async () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 1) {
      toast({ title: "Valor inválido", description: "Aposta mínima é R$ 1,00", variant: "destructive" });
      return;
    }
    if (amount > balance) {
      toast({ title: "Saldo insuficiente", description: "Deposite mais para continuar jogando", variant: "destructive" });
      return;
    }
    if (activeBalls >= 10 || isDropping) return;

    setIsDropping(true);

    try {
      const result = await playMutation.mutateAsync({ betAmount: amount, risk, rows });

      if (!result.success || !result.bet) {
        toast({ title: "Erro", description: result.error || "Erro ao fazer aposta", variant: "destructive" });
        setIsDropping(false);
        return;
      }

      const bet = result.bet;
      setProvablyFairData({
        serverSeedHash: bet.serverSeedHash,
        serverSeed: bet.serverSeed,
        clientSeed: bet.clientSeed,
        nonce: bet.nonce,
      });

      const id = `ball_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const positions = calculateBallPath(bet.path || [], bet.bucket);

      const ball: AnimatedBall = {
        id,
        x: CANVAS_WIDTH / 2,
        y: 25,
        pathIndex: 0,
        positions,
        bet: amount,
        multiplier: bet.multiplier,
        winAmount: bet.winAmount,
        bucket: bet.bucket,
        completed: false,
      };

      animatedBallsRef.current.push(ball);
      setActiveBalls((prev) => prev + 1);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro de conexão", variant: "destructive" });
    } finally {
      setIsDropping(false);
    }
  }, [betAmount, balance, activeBalls, isDropping, risk, rows, playMutation, calculateBallPath, toast]);

  const recordBet = useCallback((bet: number, multiplier: number, winAmount: number) => {
    const profit = winAmount - bet;
    const record: BetHistory = {
      id: Date.now().toString(),
      bet,
      multiplier,
      profit,
      timestamp: Date.now(),
    };
    setBetHistory((prev) => [record, ...prev].slice(0, 10));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, "#0c0a09");
      gradient.addColorStop(0.5, "#0f0d0c");
      gradient.addColorStop(1, "#0c0a09");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      pinsRef.current.forEach((pin) => {
        if (!isFinite(pin.x) || !isFinite(pin.y)) return;
        ctx.shadowColor = "#ff6600";
        ctx.shadowBlur = 6;
        const pinGrad = ctx.createRadialGradient(pin.x - 1, pin.y - 1, 0, pin.x, pin.y, PIN_RADIUS);
        pinGrad.addColorStop(0, "#ffffff");
        pinGrad.addColorStop(0.4, "#ff8833");
        pinGrad.addColorStop(1, "#cc5500");
        ctx.fillStyle = pinGrad;
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, PIN_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      for (let i = 0; i < numSlots; i++) {
        const x = i * slotWidth;
        const y = CANVAS_HEIGHT - 55;
        const isHit = lastHitSlot === i;
        const color = getSlotColor(multipliers[i]);

        ctx.shadowColor = color;
        ctx.shadowBlur = isHit ? 20 : 8;

        const slotGrad = ctx.createLinearGradient(x, y, x, y + 50);
        slotGrad.addColorStop(0, isHit ? "#ffffff" : color);
        slotGrad.addColorStop(0.6, color);
        slotGrad.addColorStop(1, "#000000");
        ctx.fillStyle = slotGrad;

        ctx.beginPath();
        ctx.roundRect(x + 1.5, y, slotWidth - 3, 50, [0, 0, 6, 6]);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = isHit ? "#000000" : "#ffffff";
        ctx.font = `bold ${numSlots > 13 ? "9px" : "11px"} Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${multipliers[i]}x`, x + slotWidth / 2, y + 25);
      }

      for (let i = animatedBallsRef.current.length - 1; i >= 0; i--) {
        const ball = animatedBallsRef.current[i];
        const positions = ball.positions;

        if (!positions || positions.length === 0) {
          animatedBallsRef.current.splice(i, 1);
          setActiveBalls((prev) => Math.max(0, prev - 1));
          continue;
        }

        if (!isFinite(ball.x) || !isFinite(ball.y)) {
          ball.x = CANVAS_WIDTH / 2;
          ball.y = 25;
          ball.pathIndex = 0;
        }

        if (ball.pathIndex < positions.length) {
          const target = positions[ball.pathIndex];
          if (!target || !isFinite(target.x) || !isFinite(target.y)) {
            ball.pathIndex++;
            continue;
          }
          const dx = target.x - ball.x;
          const dy = target.y - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const speed = 5;
          if (isFinite(dist) && dist > speed) {
            ball.x += (dx / dist) * speed;
            ball.y += (dy / dist) * speed;
          } else {
            ball.x = target.x;
            ball.y = target.y;
            ball.pathIndex++;
          }
        }

        const safeX = isFinite(ball.x) ? ball.x : CANVAS_WIDTH / 2;
        const safeY = isFinite(ball.y) ? ball.y : 25;

        const isHighValue = ball.multiplier >= 5;

        ctx.shadowColor = isHighValue ? "#ffd700" : "#ffcc00";
        ctx.shadowBlur = isHighValue ? 18 : 12;
        const ballGrad = ctx.createRadialGradient(safeX - 2, safeY - 2, 0, safeX, safeY, BALL_RADIUS);
        ballGrad.addColorStop(0, isHighValue ? "#ffffee" : "#fffacd");
        ballGrad.addColorStop(0.5, isHighValue ? "#ffe44d" : "#ffd700");
        ballGrad.addColorStop(1, isHighValue ? "#daa520" : "#b8860b");
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(safeX, safeY, BALL_RADIUS + (isHighValue ? 1 : 0), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (ball.pathIndex >= positions.length && !ball.completed) {
          ball.completed = true;
          setLastHitSlot(ball.bucket);
          setTimeout(() => setLastHitSlot(null), 350);

          if (ball.multiplier >= 10) {
            setBigWinAmount(ball.winAmount);
            setShowBigWin(true);
            setTimeout(() => setShowBigWin(false), 3000);
          }

          recordBet(ball.bet, ball.multiplier, ball.winAmount);
          setActiveBalls((prev) => Math.max(0, prev - 1));
          animatedBallsRef.current.splice(i, 1);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [multipliers, numSlots, slotWidth, recordBet, lastHitSlot]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        handleDropBall();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDropBall]);

  const adjustBet = (type: "half" | "double" | "max") => {
    const current = parseFloat(betAmount) || 10;
    if (type === "half") setBetAmount(Math.max(1, current / 2).toFixed(2));
    if (type === "double") setBetAmount(Math.min(balance, current * 2).toFixed(2));
    if (type === "max") setBetAmount(balance.toFixed(2));
  };

  const canDrop = balance >= parseFloat(betAmount || "0") && activeBalls < 10 && !isDropping;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">Plinko</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
            <Wallet className="w-4 h-4 text-green-500" />
            <span className="text-green-500 font-bold text-sm">R$</span>
            <span className="font-bold text-white">
              {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <ProvablyFairModal data={provablyFairData} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-muted-foreground hover:text-white"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-72 bg-card rounded-2xl p-4 flex flex-col gap-4 border border-white/5 shrink-0 order-2 lg:order-1">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Valor da Aposta</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</div>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="pl-8 bg-black/40 border-white/5 text-white font-mono h-10 text-sm focus-visible:ring-primary focus-visible:border-primary"
                min="1"
                step="0.01"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => adjustBet("half")}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-white"
                >
                  ½
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => adjustBet("double")}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-white"
                >
                  2x
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Risco</Label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between bg-black/40 border-white/5 text-white h-10"
                onClick={() => setRiskOpen(!riskOpen)}
              >
                <span className={RISK_COLORS[risk]}>{RISK_LABELS[risk]}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
              {riskOpen && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((r) => (
                    <button
                      key={r}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors",
                        risk === r ? "bg-white/10" : ""
                      )}
                      onClick={() => {
                        setRisk(r);
                        setRiskOpen(false);
                      }}
                    >
                      <span className={RISK_COLORS[r]}>{RISK_LABELS[r]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Linhas</Label>
            <div className="grid grid-cols-3 gap-2">
              {([8, 12, 16] as RowsOption[]).map((r) => (
                <Button
                  key={r}
                  variant={rows === r ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 text-sm font-bold",
                    rows === r
                      ? "bg-primary text-primary-foreground"
                      : "border-white/10 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                  onClick={() => setRows(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleDropBall}
            disabled={!canDrop}
            className={cn(
              "w-full h-12 text-base font-bold rounded-xl transition-all",
              canDrop
                ? "bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-500 text-white shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isDropping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Apostar</>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground">Pressione ESPAÇO para apostar rápido</p>

          {betHistory.length > 0 && (
            <div className="space-y-2 mt-2">
              <Label className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Histórico</Label>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {betHistory.map((h) => (
                  <div
                    key={h.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs",
                      h.profit >= 0 ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
                    )}
                  >
                    <span className="text-white/70">R$ {h.bet.toFixed(2)}</span>
                    <span className={cn("font-bold", h.multiplier >= 2 ? "text-yellow-400" : "text-white")}>
                      {h.multiplier}x
                    </span>
                    <span className={cn("font-bold", h.profit >= 0 ? "text-green-400" : "text-red-400")}>
                      {h.profit >= 0 ? "+" : ""}R$ {h.profit.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 order-1 lg:order-2">
          <div className="bg-card rounded-2xl p-3 border border-white/5">
            <div className="relative bg-gradient-to-b from-black/60 to-black/40 rounded-xl overflow-hidden">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full max-w-[480px] mx-auto block"
                style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
              />

              <AnimatePresence>
                {showBigWin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                        className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 drop-shadow-2xl"
                      >
                        BIG WIN!
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl md:text-4xl font-bold text-green-400 mt-2"
                      >
                        R$ {bigWinAmount.toFixed(2)}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {multipliers.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold text-center min-w-[40px] border",
                  lastHitSlot === i ? "scale-110 shadow-lg" : "",
                  m >= 10
                    ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                    : m >= 2
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : m >= 1
                    ? "bg-green-500/20 border-green-500/30 text-green-400"
                    : "bg-red-500/20 border-red-500/30 text-red-400"
                )}
                style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
              >
                {m}x
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
