import { create } from "zustand";

interface UserPreferences {
  theme: string;
  language: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

interface UserStore {
  preferences: UserPreferences | null;
  setPreferences: (prefs: UserPreferences) => void;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  preferences: null,

  setPreferences: (preferences) => set({ preferences }),

  updatePreference: (key, value) => {
    const prefs = get().preferences;
    if (!prefs) return;
    set({ preferences: { ...prefs, [key]: value } });
  },
}));
