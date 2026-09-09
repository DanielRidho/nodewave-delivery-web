import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => {
        // biome-ignore lint/suspicious/noDocumentCookie: non-sensitive hint is intentionally shared with Next.js Proxy
        document.cookie =
          "nodewave_session_hint=1; Path=/; Max-Age=28800; SameSite=Lax";
        set({ token, user });
      },
      clearSession: () => {
        // biome-ignore lint/suspicious/noDocumentCookie: expires the same non-sensitive Proxy hint
        document.cookie =
          "nodewave_session_hint=; Path=/; Max-Age=0; SameSite=Lax";
        set({ token: null, user: null });
      },
    }),
    { name: "nodewave-auth" },
  ),
);
