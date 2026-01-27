import React, { useEffect, useRef, useCallback, useState } from "react";
import { usePlinko } from "@/lib/stores/usePlinko";
import { usePlayPlinko, PlinkoRisk, PlinkoRows } from "@/hooks/usePlinko";
import { useQueryClient } from "@tanstack/react-query";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 560;
const PIN_RADIUS = 4;
const BALL_RADIUS = 6;

type RiskLevel = "low" | "medium" | "high";

const RISK_MAP: Record<RiskLevel, PlinkoRisk> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

const ROWS_MULTIPLIERS: Record<number, Record<RiskLevel, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

const IN1BET_COLORS = {
  primary: "#ff6600",
  secondary: "#cc5500", 
  accent: "#ffaa00",
  background: "#0a0806",
  surface: "#1a1410",
  surfaceLight: "#2a2018",
  text: "#ffffff",
  textMuted: "#9a8a7a",
  danger: "#ff3333",
  dangerDark: "#cc0000",
};

const ROWS_OPTIONS = [8, 12, 16] as const;

interface AnimatedBall {
  id: string;
  x: number;
  y: number;
  targetY: number;
  pathIndex: number;
  path: number[];
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
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface FloatingCoin {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
}

function generatePins(rows: number): Pin[] {
  const pins: Pin[] = [];
  const startY = 50;
  const endY = CANVAS_HEIGHT - 70;
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

function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.4 + 0.1,
    });
  }
  return particles;
}

function generateCoins(): FloatingCoin[] {
  const coins: FloatingCoin[] = [];
  for (let i = 0; i < 6; i++) {
    coins.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 8 + 6,
      speed: Math.random() * 0.2 + 0.1,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
    });
  }
  return coins;
}

function getSlotColors(multipliers: number[]): string[] {
  return multipliers.map(m => {
    if (m >= 10) return IN1BET_COLORS.accent;
    if (m >= 2) return IN1BET_COLORS.primary;
    if (m >= 1) return IN1BET_COLORS.secondary;
    return IN1BET_COLORS.danger;
  });
}

export function Plinko2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedBallsRef = useRef<AnimatedBall[]>([]);
  const animationRef = useRef<number>(0);
  const lastDropRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>(generateParticles());
  const coinsRef = useRef<FloatingCoin[]>(generateCoins());
  
  const [risk, setRisk] = useState<RiskLevel>("medium");
  const [rows, setRows] = useState<8 | 12 | 16>(12);
  const [betHistory, setBetHistory] = useState<BetHistory[]>([]);
  const [lastHitSlot, setLastHitSlot] = useState<number | null>(null);
  const [autoBetCount, setAutoBetCount] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const [autoBetRemaining, setAutoBetRemaining] = useState(0);
  const [isAutoBetting, setIsAutoBetting] = useState(false);
  const [pendingBets, setPendingBets] = useState(0);
  
  const queryClient = useQueryClient();
  const playPlinkoMutation = usePlayPlinko();
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  const pins = useRef<Pin[]>(generatePins(rows));
  
  useEffect(() => {
    pins.current = generatePins(rows);
  }, [rows]);
  
  const multipliers = ROWS_MULTIPLIERS[rows]?.[risk] || ROWS_MULTIPLIERS[12].medium;
  const slotColors = getSlotColors(multipliers);
  const numSlots = multipliers.length;
  const slotWidth = CANVAS_WIDTH / numSlots;
  
  const { 
    money, 
    activeBalls, 
    betAmount,
    showBigWin,
    lastWin,
    incrementActiveBalls,
    decrementActiveBalls,
    setLastWin,
    setBetAmount,
    resetGame,
    setMoney,
    isLoading,
    setLoading,
    error,
    setError,
  } = usePlinko();
  
  const calculateBallPath = useCallback((path: number[], targetBucket: number): { positions: {x: number, y: number}[] } => {
    const positions: {x: number, y: number}[] = [];
    const startY = 50;
    const endY = CANVAS_HEIGHT - 70;
    const spacingY = (endY - startY) / (rows - 1);
    const spacingX = CANVAS_WIDTH / (rows + 2);
    
    let x = CANVAS_WIDTH / 2;
    positions.push({ x, y: 20 });
    
    for (let i = 0; i < path.length && i < rows; i++) {
      const direction = path[i];
      const offset = direction === 0 ? -spacingX / 2 : spacingX / 2;
      x += offset;
      const y = startY + i * spacingY;
      positions.push({ x, y });
    }
    
    const finalX = (targetBucket + 0.5) * slotWidth;
    positions.push({ x: finalX, y: CANVAS_HEIGHT - 40 });
    
    return { positions };
  }, [rows, slotWidth]);
  
  const handleDropBall = useCallback(async () => {
    if (money < betAmount || activeBalls >= 15 || pendingBets > 0) {
      return;
    }
    
    setPendingBets(prev => prev + 1);
    
    try {
      const result = await playPlinkoMutation.mutateAsync({
        betAmount,
        risk: RISK_MAP[risk],
        rows: rows as PlinkoRows,
      });
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      const canAdd = incrementActiveBalls();
      if (!canAdd) {
        return;
      }
      
      const id = `ball_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pathData = calculateBallPath(result.path || [], result.bucket);
      
      const ball: AnimatedBall = {
        id,
        x: CANVAS_WIDTH / 2,
        y: 20,
        targetY: 0,
        pathIndex: 0,
        path: result.path || [],
        bet: betAmount,
        multiplier: result.multiplier,
        winAmount: result.winAmount,
        bucket: result.bucket,
        completed: false,
      };
      
      (ball as any).positions = pathData.positions;
      animatedBallsRef.current.push(ball);
      
    } catch (err: any) {
      setError(err.message || "Erro ao fazer aposta");
    } finally {
      setPendingBets(prev => prev - 1);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    }
  }, [money, betAmount, activeBalls, pendingBets, risk, rows, playPlinkoMutation, incrementActiveBalls, calculateBallPath, queryClient, setError]);
  
  const recordBet = useCallback((bet: number, multiplier: number, winAmount: number) => {
    const profit = winAmount - bet;
    const record: BetHistory = {
      id: Date.now().toString(),
      bet,
      multiplier,
      profit,
    };
    setBetHistory(prev => [record, ...prev].slice(0, 8));
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const render = () => {
      const now = Date.now();
      
      if (isAutoBetting && autoBetRemaining > 0 && now - lastDropRef.current > 600) {
        if (money >= betAmount && activeBalls < 15 && pendingBets === 0) {
          handleDropBall();
          lastDropRef.current = now;
          setAutoBetRemaining(prev => {
            const newVal = prev - 1;
            if (newVal <= 0) {
              setIsAutoBetting(false);
            }
            return newVal;
          });
        }
      }
      
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, IN1BET_COLORS.background);
      gradient.addColorStop(0.5, "#0f0c08");
      gradient.addColorStop(1, IN1BET_COLORS.background);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      particlesRef.current.forEach(particle => {
        if (!isFinite(particle.x) || !isFinite(particle.y) || !isFinite(particle.size) || particle.size <= 0) {
          particle.x = Math.random() * CANVAS_WIDTH;
          particle.y = Math.random() * CANVAS_HEIGHT;
          particle.size = Math.random() * 2 + 1;
          particle.speed = Math.random() * 0.3 + 0.1;
          particle.opacity = Math.random() * 0.4 + 0.1;
          return;
        }
        particle.y -= particle.speed;
        if (particle.y < 0) {
          particle.y = CANVAS_HEIGHT;
          particle.x = Math.random() * CANVAS_WIDTH;
        }
        ctx.fillStyle = `rgba(255, 165, 0, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      coinsRef.current.forEach(coin => {
        if (!isFinite(coin.x) || !isFinite(coin.y) || !isFinite(coin.size) || coin.size <= 0) {
          coin.x = Math.random() * CANVAS_WIDTH;
          coin.y = Math.random() * CANVAS_HEIGHT;
          coin.size = Math.random() * 8 + 6;
          coin.speed = Math.random() * 0.2 + 0.1;
          coin.rotation = 0;
          coin.rotSpeed = (Math.random() - 0.5) * 0.02;
          return;
        }
        
        coin.y -= coin.speed;
        coin.rotation += coin.rotSpeed;
        if (coin.y < -coin.size) {
          coin.y = CANVAS_HEIGHT + coin.size;
          coin.x = Math.random() * CANVAS_WIDTH;
        }
        
        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.rotate(coin.rotation);
        ctx.globalAlpha = 0.15;
        
        const safeSize = Math.max(coin.size, 1);
        const coinGrad = ctx.createRadialGradient(-2, -2, 0, 0, 0, safeSize);
        coinGrad.addColorStop(0, "#ffd700");
        coinGrad.addColorStop(0.7, "#daa520");
        coinGrad.addColorStop(1, "#b8860b");
        ctx.fillStyle = coinGrad;
        ctx.beginPath();
        ctx.arc(0, 0, safeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "rgba(255, 255, 200, 0.8)";
        ctx.font = `bold ${safeSize * 0.8}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("R$", 0, 0);
        
        ctx.restore();
      });
      
      pins.current.forEach((pin) => {
        if (!isFinite(pin.x) || !isFinite(pin.y)) return;
        ctx.shadowColor = IN1BET_COLORS.primary;
        ctx.shadowBlur = 8;
        const pinGrad = ctx.createRadialGradient(pin.x - 1, pin.y - 1, 0, pin.x, pin.y, PIN_RADIUS);
        pinGrad.addColorStop(0, "#ffffff");
        pinGrad.addColorStop(0.3, IN1BET_COLORS.primary);
        pinGrad.addColorStop(1, IN1BET_COLORS.secondary);
        ctx.fillStyle = pinGrad;
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, PIN_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      
      for (let i = 0; i < numSlots; i++) {
        const x = i * slotWidth;
        const y = CANVAS_HEIGHT - 50;
        const isHit = lastHitSlot === i;
        
        ctx.shadowColor = slotColors[i];
        ctx.shadowBlur = isHit ? 25 : 12;
        
        const slotGrad = ctx.createLinearGradient(x, y, x, y + 45);
        slotGrad.addColorStop(0, isHit ? "#ffffff" : slotColors[i]);
        slotGrad.addColorStop(0.5, slotColors[i]);
        slotGrad.addColorStop(1, "#000000");
        ctx.fillStyle = slotGrad;
        
        ctx.beginPath();
        ctx.roundRect(x + 2, y, slotWidth - 4, 45, [0, 0, 8, 8]);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = isHit ? "#000000" : "#ffffff";
        ctx.font = `bold ${isMobile ? "10px" : "11px"} Inter, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${multipliers[i]}x`, x + slotWidth / 2, y + 22);
      }
      
      for (let i = animatedBallsRef.current.length - 1; i >= 0; i--) {
        const ball = animatedBallsRef.current[i];
        const positions = (ball as any).positions as {x: number, y: number}[];
        
        if (positions && ball.pathIndex < positions.length) {
          const target = positions[ball.pathIndex];
          const dx = target.x - ball.x;
          const dy = target.y - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const speed = 4;
          if (dist > speed) {
            ball.x += (dx / dist) * speed;
            ball.y += (dy / dist) * speed;
          } else {
            ball.x = target.x;
            ball.y = target.y;
            ball.pathIndex++;
          }
        }
        
        const nearHighValue = ball.multiplier >= 5;
        const highValueIntensity = Math.min(1, ball.multiplier / 25);
        
        ctx.shadowColor = nearHighValue ? "#ffd700" : "#ffcc00";
        ctx.shadowBlur = nearHighValue ? 20 + highValueIntensity * 15 : 14;
        const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, BALL_RADIUS);
        ballGrad.addColorStop(0, nearHighValue ? "#ffffee" : "#fffacd");
        ballGrad.addColorStop(0.5, nearHighValue ? "#ffe44d" : "#ffd700");
        ballGrad.addColorStop(1, nearHighValue ? "#daa520" : "#b8860b");
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS + (nearHighValue ? highValueIntensity * 2 : 0), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        if (ball.pathIndex >= positions.length) {
          setLastHitSlot(ball.bucket);
          setTimeout(() => setLastHitSlot(null), 300);
          
          const isJackpot = ball.multiplier >= 10;
          setLastWin(ball.winAmount, isJackpot);
          recordBet(ball.bet, ball.multiplier, ball.winAmount);
          decrementActiveBalls();
          
          animatedBallsRef.current.splice(i, 1);
        }
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isAutoBetting, autoBetRemaining, money, betAmount, activeBalls, pendingBets, handleDropBall, setLastWin, decrementActiveBalls, rows, risk, multipliers, slotColors, numSlots, slotWidth, recordBet, isMobile, lastHitSlot]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleDropBall();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDropBall]);
  
  const canDrop = money >= betAmount && activeBalls < 15 && pendingBets === 0;

  const mobileCanvasScale = isMobile ? Math.min((window.innerWidth - 20) / CANVAS_WIDTH, 0.65) : 1;
  
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: isMobile ? "flex-start" : "flex-start",
      padding: isMobile ? "8px" : "16px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "8px" : "16px",
        maxWidth: isMobile ? "100%" : "900px",
        width: "100%",
      }}>
        <div style={{
          background: IN1BET_COLORS.surface,
          borderRadius: isMobile ? "8px" : "12px",
          padding: isMobile ? "6px" : "10px",
          flex: "0 0 auto",
          border: `1px solid ${IN1BET_COLORS.surfaceLight}`,
          alignSelf: isMobile ? "center" : "auto",
        }}>
          <div style={{
            background: IN1BET_COLORS.background,
            borderRadius: isMobile ? "6px" : "10px",
            padding: isMobile ? "4px" : "8px",
          }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{
                width: `${CANVAS_WIDTH * mobileCanvasScale}px`,
                height: `${CANVAS_HEIGHT * mobileCanvasScale}px`,
                display: "block",
                borderRadius: "8px",
              }}
            />
          </div>
        </div>

        <div style={{
          background: IN1BET_COLORS.surface,
          borderRadius: isMobile ? "8px" : "12px",
          padding: isMobile ? "10px" : "16px",
          flex: "1",
          minWidth: isMobile ? "auto" : "280px",
          maxWidth: isMobile ? "100%" : "320px",
          border: `1px solid ${IN1BET_COLORS.surfaceLight}`,
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: isMobile ? "10px" : "16px",
          }}>
            <div style={{
              background: IN1BET_COLORS.surfaceLight,
              padding: isMobile ? "10px" : "12px",
              borderRadius: "8px",
              textAlign: "center",
            }}>
              <div style={{ color: IN1BET_COLORS.textMuted, fontSize: isMobile ? "10px" : "11px", marginBottom: "4px" }}>SALDO</div>
              <div style={{ color: IN1BET_COLORS.primary, fontSize: isMobile ? "16px" : "18px", fontWeight: "bold" }}>
                R$ {money.toFixed(2)}
              </div>
            </div>
            <div style={{
              background: IN1BET_COLORS.surfaceLight,
              padding: isMobile ? "10px" : "12px",
              borderRadius: "8px",
              textAlign: "center",
            }}>
              <div style={{ color: IN1BET_COLORS.textMuted, fontSize: isMobile ? "10px" : "11px", marginBottom: "4px" }}>ÚLTIMO GANHO</div>
              <div style={{ 
                color: lastWin > 0 ? IN1BET_COLORS.accent : IN1BET_COLORS.textMuted, 
                fontSize: isMobile ? "16px" : "18px", 
                fontWeight: "bold" 
              }}>
                R$ {lastWin.toFixed(2)}
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: IN1BET_COLORS.danger,
              color: "#fff",
              padding: "8px 12px",
              borderRadius: "6px",
              marginBottom: "12px",
              fontSize: "12px",
              textAlign: "center",
            }}>
              {error}
            </div>
          )}
          
          <div style={{ marginBottom: isMobile ? "10px" : "14px" }}>
            <div style={{ color: IN1BET_COLORS.textMuted, fontSize: isMobile ? "11px" : "10px", marginBottom: "6px" }}>VALOR DA APOSTA</div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                onClick={() => setBetAmount(Math.max(0.10, betAmount / 2))}
                style={{
                  padding: isMobile ? "10px 14px" : "8px 12px",
                  background: IN1BET_COLORS.surfaceLight,
                  border: "none",
                  borderRadius: "6px",
                  color: IN1BET_COLORS.text,
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: isMobile ? "14px" : "12px",
                }}
              >
                ½
              </button>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0.10)}
                style={{
                  flex: 1,
                  padding: isMobile ? "10px" : "8px",
                  background: IN1BET_COLORS.background,
                  border: `1px solid ${IN1BET_COLORS.surfaceLight}`,
                  borderRadius: "6px",
                  color: IN1BET_COLORS.text,
                  textAlign: "center",
                  fontSize: isMobile ? "16px" : "14px",
                  fontWeight: "bold",
                }}
                min="0.10"
                step="0.10"
              />
              <button
                onClick={() => setBetAmount(Math.min(1000, betAmount * 2))}
                style={{
                  padding: isMobile ? "10px 14px" : "8px 12px",
                  background: IN1BET_COLORS.surfaceLight,
                  border: "none",
                  borderRadius: "6px",
                  color: IN1BET_COLORS.text,
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: isMobile ? "14px" : "12px",
                }}
              >
                2×
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: isMobile ? "10px" : "14px" }}>
            <div style={{ color: IN1BET_COLORS.textMuted, fontSize: isMobile ? "11px" : "10px", marginBottom: "6px" }}>RISCO</div>
            <div style={{ display: "flex", gap: isMobile ? "6px" : "4px" }}>
              {(["low", "medium", "high"] as RiskLevel[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  style={{
                    flex: 1,
                    padding: isMobile ? "10px 8px" : "6px",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: isMobile ? "12px" : "9px",
                    textTransform: "uppercase",
                    background: risk === r ? (r === "low" ? IN1BET_COLORS.primary : r === "medium" ? IN1BET_COLORS.accent : IN1BET_COLORS.danger) : IN1BET_COLORS.surface,
                    color: risk === r ? "#000" : IN1BET_COLORS.textMuted,
                  }}
                >
                  {r === "low" ? "BAIXO" : r === "medium" ? "MÉDIO" : "ALTO"}
                </button>
              ))}
            </div>
            <div style={{ color: IN1BET_COLORS.textMuted, fontSize: isMobile ? "11px" : "10px", marginBottom: "6px", marginTop: "10px" }}>LINHAS</div>
            <div style={{ display: "flex", gap: isMobile ? "6px" : "4px" }}>
              {ROWS_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRows(r)}
                  style={{
                    flex: 1,
                    padding: isMobile ? "10px 8px" : "6px",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: isMobile ? "13px" : "11px",
                    background: rows === r ? IN1BET_COLORS.primary : IN1BET_COLORS.surface,
                    color: rows === r ? "#000" : IN1BET_COLORS.textMuted,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleDropBall}
            disabled={!canDrop || playPlinkoMutation.isPending}
            style={{
              width: "100%",
              padding: isMobile ? "14px" : "12px",
              background: canDrop && !playPlinkoMutation.isPending
                ? `linear-gradient(135deg, ${IN1BET_COLORS.primary}, ${IN1BET_COLORS.secondary})`
                : IN1BET_COLORS.surfaceLight,
              border: "none",
              borderRadius: "8px",
              color: canDrop && !playPlinkoMutation.isPending ? "#fff" : IN1BET_COLORS.textMuted,
              fontSize: isMobile ? "16px" : "14px",
              fontWeight: "bold",
              cursor: canDrop && !playPlinkoMutation.isPending ? "pointer" : "not-allowed",
              marginBottom: isMobile ? "10px" : "12px",
              boxShadow: canDrop && !playPlinkoMutation.isPending ? `0 4px 15px ${IN1BET_COLORS.primary}40` : "none",
            }}
          >
            {playPlinkoMutation.isPending ? "APOSTANDO..." : "APOSTAR"}
          </button>
          
          <div style={{ 
            display: "flex", 
            gap: "8px", 
            marginBottom: isMobile ? "10px" : "12px",
            flexDirection: isMobile ? "column" : "row",
          }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: IN1BET_COLORS.textMuted, fontSize: isMobile ? "11px" : "10px" }}>APOSTA AUTO</span>
              <input
                type="number"
                value={autoBetCount}
                onChange={(e) => setAutoBetCount(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: "50px",
                  padding: "4px",
                  background: IN1BET_COLORS.background,
                  border: `1px solid ${IN1BET_COLORS.surfaceLight}`,
                  borderRadius: "4px",
                  color: IN1BET_COLORS.text,
                  textAlign: "center",
                  fontSize: isMobile ? "14px" : "12px",
                }}
                min="1"
              />
            </div>
            <button
              onClick={() => {
                if (isAutoBetting) {
                  setIsAutoBetting(false);
                  setAutoBetRemaining(0);
                } else {
                  setIsAutoBetting(true);
                  setAutoBetRemaining(autoBetCount);
                }
              }}
              style={{
                flex: 1,
                padding: isMobile ? "10px" : "8px",
                background: isAutoBetting ? IN1BET_COLORS.danger : IN1BET_COLORS.surfaceLight,
                border: "none",
                borderRadius: "6px",
                color: IN1BET_COLORS.text,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: isMobile ? "12px" : "11px",
              }}
            >
              {isAutoBetting ? `PARAR (${autoBetRemaining})` : "INICIAR"}
            </button>
          </div>

          <div style={{
            background: IN1BET_COLORS.background,
            borderRadius: "8px",
            padding: isMobile ? "8px" : "10px",
            maxHeight: isMobile ? "120px" : "180px",
            overflowY: "auto",
          }}>
            <div style={{ 
              color: IN1BET_COLORS.textMuted, 
              fontSize: isMobile ? "10px" : "9px", 
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              HISTÓRICO
            </div>
            {betHistory.length === 0 ? (
              <div style={{ color: IN1BET_COLORS.textMuted, fontSize: isMobile ? "11px" : "10px", textAlign: "center", padding: "10px" }}>
                Nenhuma aposta ainda
              </div>
            ) : (
              betHistory.map((bet) => (
                <div
                  key={bet.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: `1px solid ${IN1BET_COLORS.surfaceLight}`,
                    fontSize: isMobile ? "11px" : "10px",
                  }}
                >
                  <span style={{ color: IN1BET_COLORS.textMuted }}>R$ {bet.bet.toFixed(2)}</span>
                  <span style={{ 
                    color: bet.multiplier >= 2 ? IN1BET_COLORS.accent : IN1BET_COLORS.primary,
                    fontWeight: "bold",
                  }}>
                    {bet.multiplier}×
                  </span>
                  <span style={{ 
                    color: bet.profit >= 0 ? IN1BET_COLORS.accent : IN1BET_COLORS.danger,
                    fontWeight: "bold",
                  }}>
                    {bet.profit >= 0 ? "+" : ""}R$ {bet.profit.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <button
            onClick={resetGame}
            style={{
              width: "100%",
              padding: isMobile ? "10px" : "8px",
              background: "transparent",
              border: `1px solid ${IN1BET_COLORS.surfaceLight}`,
              borderRadius: "6px",
              color: IN1BET_COLORS.textMuted,
              cursor: "pointer",
              fontSize: isMobile ? "11px" : "10px",
              marginTop: isMobile ? "8px" : "10px",
            }}
          >
            Resetar
          </button>
        </div>
      </div>
      
      {showBigWin && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.3s ease-out",
        }}>
          <div style={{
            textAlign: "center",
            animation: "scaleIn 0.5s ease-out",
          }}>
            <div style={{
              fontSize: isMobile ? "36px" : "48px",
              fontWeight: "bold",
              color: IN1BET_COLORS.accent,
              textShadow: `0 0 30px ${IN1BET_COLORS.accent}`,
              marginBottom: "10px",
            }}>
              JACKPOT!
            </div>
            <div style={{
              fontSize: isMobile ? "28px" : "36px",
              fontWeight: "bold",
              color: IN1BET_COLORS.text,
            }}>
              R$ {lastWin.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
