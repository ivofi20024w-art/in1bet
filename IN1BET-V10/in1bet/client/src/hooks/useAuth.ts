import { useState, useEffect, useCallback } from "react";
import { 
  getStoredAuth, 
  getCurrentUser, 
  logout as authLogout, 
  type User, 
  type AuthState 
} from "@/lib/auth";
import { AUTH_CHANGE_EVENT } from "@/lib/authTokens";
import { useChatStore } from "@/stores/chatStore";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Keep this hook to maintain consistent hook order (was accessToken before cookie migration)
  const [_deprecated] = useState<string | null>(null);
  
  const chatConnect = useChatStore((s) => s.connect);
  const chatLogout = useChatStore((s) => s.logout);
  const chatIsConnected = useChatStore((s) => s.isConnected);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const auth = getStoredAuth();
    
    if (auth.isAuthenticated) {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        if (!chatIsConnected) {
          chatConnect();
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        chatLogout();
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      chatLogout();
    }
    
    setIsLoading(false);
  }, [chatConnect, chatLogout, chatIsConnected]);

  useEffect(() => {
    checkAuth();
    
    const handleAuthChange = () => {
      checkAuth();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'in1bet_user') {
        checkAuth();
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  const logout = useCallback(async () => {
    chatLogout();
    await authLogout();
    setUser(null);
    setIsAuthenticated(false);
  }, [chatLogout]);

  const refreshAuth = useCallback(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    refreshAuth,
  };
}
