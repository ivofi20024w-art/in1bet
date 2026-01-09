import { create } from 'zustand';

type AuthTab = 'login' | 'register';

interface AuthModalState {
  isOpen: boolean;
  activeTab: AuthTab;
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
  setTab: (tab: AuthTab) => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  activeTab: 'login',
  openLogin: () => set({ isOpen: true, activeTab: 'login' }),
  openRegister: () => set({ isOpen: true, activeTab: 'register' }),
  close: () => set({ isOpen: false }),
  setTab: (tab) => set({ activeTab: tab }),
}));
