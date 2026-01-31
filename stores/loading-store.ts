import { create } from "zustand";

type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

interface UserData {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  phone?: string;
  image?: string;
}

interface LoadingStore {
  // State
  userData: UserData | null;
  isPusherBeamsReady: boolean;
  minimumTimeElapsed: boolean;

  // Actions
  setUserData: (data: UserData | null) => void;
  setPusherBeamsReady: (ready: boolean) => void;
  setMinimumTimeElapsed: (elapsed: boolean) => void;

  // Computed
  isFullyLoaded: () => boolean;

  // Reset (useful for logout)
  reset: () => void;
}

/**
 * Global loading store for dashboard initialization
 * Tracks when all required data and services are ready
 */
export const useLoadingStore = create<LoadingStore>((set, get) => ({
  // Initial state
  userData: null,
  isPusherBeamsReady: false,
  minimumTimeElapsed: false,

  // Actions
  setUserData: (data) => set({ userData: data }),
  setPusherBeamsReady: (ready) => set({ isPusherBeamsReady: ready }),
  setMinimumTimeElapsed: (elapsed) => set({ minimumTimeElapsed: elapsed }),

  // Computed getter - checks if all loading conditions are met
  isFullyLoaded: () => {
    const state = get();
    return (
      state.userData !== null &&
      state.userData.role !== undefined &&
      state.isPusherBeamsReady &&
      state.minimumTimeElapsed
    );
  },

  // Reset to initial state
  reset: () =>
    set({
      userData: null,
      isPusherBeamsReady: false,
      minimumTimeElapsed: false,
    }),
}));

/**
 * Selectors for optimized re-renders
 */
export const selectUserData = (state: LoadingStore) => state.userData;
export const selectIsFullyLoaded = (state: LoadingStore) => state.isFullyLoaded();
export const selectIsPusherBeamsReady = (state: LoadingStore) => state.isPusherBeamsReady;
export const selectMinimumTimeElapsed = (state: LoadingStore) => state.minimumTimeElapsed;
