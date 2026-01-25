import { create } from 'zustand';

type AuthTab = 'login' | 'register';

export const REFERRAL_CODE_KEY = 'in1bet_referral_code';

function getStoredReferralCode(): string | null {
  try {
    return localStorage.getItem(REFERRAL_CODE_KEY);
  } catch {
    return null;
  }
}

function storeReferralCode(code: string | null) {
  try {
    if (code) {
      localStorage.setItem(REFERRAL_CODE_KEY, code);
    } else {
      localStorage.removeItem(REFERRAL_CODE_KEY);
    }
  } catch {}
}

interface AuthModalState {
  isOpen: boolean;
  activeTab: AuthTab;
  referralCode: string | null;
  openLogin: () => void;
  openRegister: (referralCode?: string) => void;
  close: () => void;
  setTab: (tab: AuthTab) => void;
  clearReferralCode: () => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  activeTab: 'login',
  referralCode: getStoredReferralCode(),
  openLogin: () => set({ isOpen: true, activeTab: 'login' }),
  openRegister: (referralCode?: string) => {
    if (referralCode) {
      storeReferralCode(referralCode);
    }
    const code = referralCode || getStoredReferralCode();
    set({ isOpen: true, activeTab: 'register', referralCode: code });
  },
  close: () => {
    storeReferralCode(null);
    set({ isOpen: false, referralCode: null });
  },
  setTab: (tab) => set({ activeTab: tab }),
  clearReferralCode: () => {
    storeReferralCode(null);
    set({ referralCode: null });
  },
}));
