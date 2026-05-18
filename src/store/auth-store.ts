import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "admin" | "customer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthState = {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (user: User, token: string) => set({ user, token }),

      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "ecobus-auth",
    }
  )
);
