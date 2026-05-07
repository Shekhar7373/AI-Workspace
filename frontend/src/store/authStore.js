import { create } from "zustand";

const stored = JSON.parse(localStorage.getItem("ai-workspace-auth") || "null");

export const useAuthStore = create((set) => ({
  user: stored?.user || null,
  accessToken: stored?.accessToken || "",
  refreshToken: stored?.refreshToken || "",
  setSession: (session) => {
    const next = {
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken
    };
    localStorage.setItem("ai-workspace-auth", JSON.stringify(next));
    set(next);
  },
  updateUser: (user) => {
    set((state) => {
      const next = { ...state, user };
      localStorage.setItem("ai-workspace-auth", JSON.stringify({
        user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken
      }));
      return next;
    });
  },
  logout: () => {
    localStorage.removeItem("ai-workspace-auth");
    set({ user: null, accessToken: "", refreshToken: "" });
  }
}));
