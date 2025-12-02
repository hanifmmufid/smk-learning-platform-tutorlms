import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/authService';
import type { User, LoginRequest, RegisterRequest } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.login(credentials);
          console.log('✅ Login success! Setting state:', { token: token.substring(0, 30) + '...', user: user.name, role: user.role });
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          console.log('✅ State set. isAuthenticated:', get().isAuthenticated);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.register(userData);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        const { token } = get();
        if (token) {
          try {
            await authService.logout(token);
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loadUser: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        // Validate token format (JWT must be xxx.yyy.zzz format)
        const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        if (!jwtPattern.test(token)) {
          console.warn('🔒 Corrupted token detected, auto-clearing...', token.substring(0, 50));
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          localStorage.removeItem('auth-storage');
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const user = await authService.getCurrentUser(token);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // Auto logout if token is invalid (401 Unauthorized)
          console.warn('Token invalid, forcing logout...', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null, // Don't show error, just force re-login
          });
          // Clear localStorage completely
          localStorage.removeItem('auth-storage');
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage', // LocalStorage key
      partialize: (state) => ({
        // Only persist token and user
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
