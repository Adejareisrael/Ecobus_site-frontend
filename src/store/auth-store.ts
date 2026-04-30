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
  login: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      login: (user: User) => set({ user }),

      logout: () => set({ user: null }),
    }),
    {
      name: "ecobus-auth",
    }
  )
);