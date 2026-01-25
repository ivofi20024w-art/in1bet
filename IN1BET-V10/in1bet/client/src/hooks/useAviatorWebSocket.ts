import { useEffect, useRef, useState, useCallback } from "react";

export interface ProvablyFairData {
  serverSeed?: string;
  serverSeedHash?: string;
  clientSeed?: string;
  nonce?: number;
}

export interface WebSocketMessage {
  type: "state" | "countdown" | "multiplier" | "round_start" | "crash" | "new_round_starting";
  data: any;
}

export function useAviatorWebSocket() {
  const [connected, setConnected] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameStatus, setGameStatus] = useState<"waiting" | "running" | "crashed">("waiting");
  const [roundId, setRoundId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [showCrashMessage, setShowCrashMessage] = useState(false);
  const [provablyFair, setProvablyFair] = useState<ProvablyFairData | null>(null);
  const [nextServerSeedHash, setNextServerSeedHash] = useState<string | null>(null);
  const [history, setHistory] = useState<{crashPoint: number, roundId: number}[]>([]);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const crashMessageTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/aviator`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("Aviator WebSocket connected");
      setConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case "state":
            setGameStatus(message.data.status);
            setMultiplier(message.data.currentMultiplier);
            setRoundId(message.data.roundId);
            if (message.data.nextServerSeedHash) {
              setNextServerSeedHash(message.data.nextServerSeedHash);
            }
            if (message.data.history) {
              setHistory(message.data.history);
            }
            break;

          case "countdown":
            setGameStatus("waiting");
            const remainingSecs = Math.ceil(message.data.remainingMs / 1000);
            setCountdown(remainingSecs);
            setShowCrashMessage(false);
            if (message.data.nextServerSeedHash) {
              setNextServerSeedHash(message.data.nextServerSeedHash);
            }
            break;

          case "round_start":
            setGameStatus("running");
            setRoundId(message.data.roundId);
            setMultiplier(1.0);
            setCrashPoint(null);
            setShowCrashMessage(false);
            setProvablyFair({
              serverSeedHash: message.data.serverSeedHash,
              clientSeed: message.data.clientSeed,
              nonce: message.data.nonce,
            });
            break;

          case "multiplier":
            setMultiplier(message.data.multiplier);
            break;

          case "crash":
            setGameStatus("crashed");
            setCrashPoint(message.data.crashPoint);
            setMultiplier(message.data.crashPoint);
            
            setHistory(prev => [{
              crashPoint: message.data.crashPoint,
              roundId: message.data.roundId
            }, ...prev].slice(0, 20));
            
            if (message.data.provablyFair) {
              setProvablyFair({
                serverSeed: message.data.provablyFair.serverSeed,
                clientSeed: message.data.provablyFair.clientSeed,
                nonce: message.data.provablyFair.nonce,
              });
            }
            
            if (crashMessageTimer.current) {
              clearTimeout(crashMessageTimer.current);
            }
            setShowCrashMessage(true);
            break;

          case "new_round_starting":
            setGameStatus("waiting");
            setShowCrashMessage(false);
            if (message.data.nextServerSeedHash) {
              setNextServerSeedHash(message.data.nextServerSeedHash);
            }
            break;
        }
      } catch (error) {
        console.error("Failed to parse Aviator WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("Aviator WebSocket disconnected");
      setConnected(false);
      
      reconnectTimer.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.current.onerror = (error) => {
      console.error("Aviator WebSocket error:", error);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (crashMessageTimer.current) {
        clearTimeout(crashMessageTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    connected,
    multiplier,
    gameStatus,
    roundId,
    countdown,
    crashPoint,
    showCrashMessage,
    provablyFair,
    nextServerSeedHash,
    history,
  };
}
