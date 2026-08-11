import { create } from 'zustand';
import { api } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  checkSession: async () => {
    try {
      const response = await api.get('/auth/session');
      set({ user: response.data.user, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null });
    } catch (error) {
      console.error('Logout failed', error);
    }
  },
}));
