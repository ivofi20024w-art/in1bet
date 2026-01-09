import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { getStoredAuth, clearAuth, refreshToken, storeAuth } from "@/lib/auth";
import { useLocation } from "wouter";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;
const TOKEN_REFRESH_INTERVAL_MS = 12 * 60 * 1000;

interface SessionContextType {
  isSessionWarningVisible: boolean;
  warningSecondsLeft: number;
  stayActive: () => void;
  logoutNow: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [isSessionWarningVisible, setIsSessionWarningVisible] = useState(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(60);
  
  const sessionExpiresAtRef = useRef<number>(0);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = () => {
    const auth = getStoredAuth();
    return auth.isAuthenticated && !!auth.accessToken;
  };

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
      tokenRefreshIntervalRef.current = null;
    }
    if (activityDebounceRef.current) {
      clearTimeout(activityDebounceRef.current);
      activityDebounceRef.current = null;
    }
  }, []);

  const logoutNow = useCallback(() => {
    clearAllTimers();
    setIsSessionWarningVisible(false);
    sessionExpiresAtRef.current = 0;
    clearAuth();
    setLocation("/");
  }, [clearAllTimers, setLocation]);

  const startSessionTimer = useCallback(() => {
    if (!isAuthenticated()) return;

    clearAllTimers();
    
    sessionExpiresAtRef.current = Date.now() + SESSION_TIMEOUT_MS;
    
    warningTimerRef.current = setTimeout(() => {
      if (!isAuthenticated()) return;
      
      setWarningSecondsLeft(60);
      setIsSessionWarningVisible(true);
      
      countdownIntervalRef.current = setInterval(() => {
        setWarningSecondsLeft((prev) => {
          if (prev <= 1) {
            logoutNow();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);
    
    tokenRefreshIntervalRef.current = setInterval(async () => {
      if (!isAuthenticated()) return;
      
      try {
        const success = await refreshToken();
        if (!success) {
          console.log("[Session] Token refresh failed, logging out");
          logoutNow();
        }
      } catch (err) {
        console.error("[Session] Token refresh error:", err);
      }
    }, TOKEN_REFRESH_INTERVAL_MS);
  }, [clearAllTimers, logoutNow]);

  const stayActive = useCallback(async () => {
    setIsSessionWarningVisible(false);
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    try {
      const success = await refreshToken();
      if (success) {
        startSessionTimer();
      } else {
        logoutNow();
      }
    } catch (err) {
      console.error("[Session] Stay active refresh error:", err);
      logoutNow();
    }
  }, [startSessionTimer, logoutNow]);

  const handleUserActivity = useCallback(() => {
    if (!isAuthenticated() || isSessionWarningVisible) return;
    
    if (activityDebounceRef.current) {
      clearTimeout(activityDebounceRef.current);
    }
    
    activityDebounceRef.current = setTimeout(() => {
      startSessionTimer();
    }, 1000);
  }, [isSessionWarningVisible, startSessionTimer]);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth.isAuthenticated && auth.accessToken) {
      startSessionTimer();
    }
    
    return () => {
      clearAllTimers();
    };
  }, [startSessionTimer, clearAllTimers]);

  useEffect(() => {
    const checkAuthChange = () => {
      const auth = getStoredAuth();
      if (auth.isAuthenticated && auth.accessToken) {
        if (sessionExpiresAtRef.current === 0) {
          startSessionTimer();
        }
      } else {
        clearAllTimers();
        setIsSessionWarningVisible(false);
      }
    };
    
    const interval = setInterval(checkAuthChange, 2000);
    return () => clearInterval(interval);
  }, [startSessionTimer, clearAllTimers]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [handleUserActivity]);

  return (
    <SessionContext.Provider
      value={{
        isSessionWarningVisible,
        warningSecondsLeft,
        stayActive,
        logoutNow,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
