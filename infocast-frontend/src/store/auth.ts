import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  /** Hub 로그인으로 리다이렉트 (토큰교환 흐름 시작). */
  loginRedirect: () => void;
}

const TOKEN_KEY = 'infocast.token';
const USER_KEY = 'infocast.user';

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: loadUser(),
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
  loginRedirect: () => {
    const hub = import.meta.env.VITE_HUB_URL;
    const redirect = `${import.meta.env.VITE_APP_URL}/auth/callback`;
    window.location.href = `${hub}/login?redirect=${encodeURIComponent(redirect)}`;
  },
}));
