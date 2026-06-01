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
  hydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,

      login: (user: User, token: string) => set({ user, token }),

      logout: () => set({ user: null, token: null }),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "ecobus-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
