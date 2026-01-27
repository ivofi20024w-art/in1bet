import { apiRequest } from "./queryClient";
import { httpGet } from "./httpClient";
import { 
  getStoredAuthState, 
  storeAuthState, 
  clearAuthState, 
  refreshAccessToken,
  dispatchAuthChange,
  type AuthState 
} from "./authTokens";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  birthDate: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  adminRole?: string;
  kycStatus: string;
  vipLevel: string;
  level?: number;
  xp?: number;
  avatarUrl?: string | null;
  profileBackground?: string | null;
  hideWins?: boolean;
  createdAt: string;
  updatedAt: string;
}

export { type AuthState } from "./authTokens";

export const getStoredAuth = getStoredAuthState;
export const storeAuth = storeAuthState;
export const clearAuth = clearAuthState;
export const refreshToken = refreshAccessToken;

export async function register(data: {
  username: string;
  name: string;
  email: string;
  cpf: string;
  password: string;
  phone?: string;
  birthDate?: string;
  referralCode?: string;
}): Promise<{ user: User }> {
  const response = await apiRequest("POST", "/api/auth/register", data);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Erro ao criar conta");
  }
  
  storeAuth({ user: result.user });
  dispatchAuthChange();
  
  return result;
}

export async function login(identifier: string, password: string): Promise<{ user: User }> {
  const response = await apiRequest("POST", "/api/auth/login", { identifier, password });
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Erro ao fazer login");
  }
  
  storeAuth({ user: result.user });
  dispatchAuthChange();
  
  return result;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("POST", "/api/auth/logout", {});
  } catch (e) {
    console.error("Error during logout:", e);
  }
  
  clearAuth();
  dispatchAuthChange();
}

export async function getCurrentUser(): Promise<User | null> {
  const auth = getStoredAuth();
  
  if (!auth.isAuthenticated) {
    return null;
  }
  
  try {
    const { data, error } = await httpGet<{ user: User }>("/api/auth/me");
    
    if (error || !data?.user) {
      return null;
    }
    
    return data.user;
  } catch (e) {
    console.error("[AUTH] Error getting current user:", e);
    return null;
  }
}

export function getAuthHeader(): Record<string, string> {
  return {};
}

export async function getWallet(): Promise<{ 
  balance: number; 
  lockedBalance: number; 
  bonusBalance: number;
  rolloverRemaining: number;
  rolloverTotal: number;
  rolloverProgress: number;
  currency: string;
} | null> {
  const auth = getStoredAuth();
  
  if (!auth.isAuthenticated) {
    return null;
  }
  
  try {
    const { data, error } = await httpGet<{ wallet: any }>("/api/wallet");
    
    if (error || !data?.wallet) {
      return null;
    }
    
    return {
      balance: data.wallet.balance || 0,
      lockedBalance: data.wallet.lockedBalance || 0,
      bonusBalance: data.wallet.bonusBalance || 0,
      rolloverRemaining: data.wallet.rolloverRemaining || 0,
      rolloverTotal: data.wallet.rolloverTotal || 0,
      rolloverProgress: data.wallet.rolloverProgress || 100,
      currency: data.wallet.currency || "BRL",
    };
  } catch (e) {
    console.error("Error getting wallet:", e);
    return null;
  }
}
