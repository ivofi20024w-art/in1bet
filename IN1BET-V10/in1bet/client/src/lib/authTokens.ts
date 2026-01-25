export interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

const AUTH_STORAGE_KEY = "in1bet_auth";
export const AUTH_CHANGE_EVENT = 'auth-state-change';

export function dispatchAuthChange(): void {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export function getStoredAuthState(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading auth state:", e);
  }
  return { user: null, isAuthenticated: false, accessToken: null, refreshToken: null };
}

export function storeAuthState(state: AuthState): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error storing auth state:", e);
  }
}

export function clearAuthState(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function refreshAccessToken(): Promise<boolean> {
  const auth = getStoredAuthState();
  
  if (!auth.refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
      credentials: "include",
    });
    
    if (!response.ok) {
      clearAuthState();
      dispatchAuthChange();
      return false;
    }
    
    const data = await response.json();
    
    storeAuthState({
      ...auth,
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || auth.refreshToken,
    });
    dispatchAuthChange();
    
    return true;
  } catch (e) {
    console.error("Error refreshing token:", e);
    clearAuthState();
    dispatchAuthChange();
    return false;
  }
}
