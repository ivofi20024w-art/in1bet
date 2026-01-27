export interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
}

const AUTH_STORAGE_KEY = "in1bet_user";
export const AUTH_CHANGE_EVENT = 'auth-state-change';

export function dispatchAuthChange(): void {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export function getStoredAuthState(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      return { user, isAuthenticated: !!user };
    }
  } catch (e) {
    console.error("Error reading auth state:", e);
  }
  return { user: null, isAuthenticated: false };
}

export function storeAuthState(state: { user: any }): void {
  try {
    if (state.user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Error storing auth state:", e);
  }
}

export function clearAuthState(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    
    if (!response.ok) {
      clearAuthState();
      dispatchAuthChange();
      return false;
    }
    
    const data = await response.json();
    
    storeAuthState({ user: data.user });
    dispatchAuthChange();
    
    return true;
  } catch (e) {
    console.error("Error refreshing token:", e);
    clearAuthState();
    dispatchAuthChange();
    return false;
  }
}
