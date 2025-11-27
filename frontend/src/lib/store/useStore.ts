import { create } from 'zustand';
import type { AppState, WebcamState } from '@/types';

export const useStore = create<AppState>((set) => ({
  // Webcam state
  webcam: {
    isActive: false,
    stream: null,
    error: null,
  },

  // UI state
  isLoading: false,
  error: null,

  // Actions
  setWebcamActive: (active: boolean) =>
    set((state) => ({
      webcam: { ...state.webcam, isActive: active },
    })),

  setWebcamStream: (stream: MediaStream | null) =>
    set((state) => ({
      webcam: { ...state.webcam, stream },
    })),

  setWebcamError: (error: string | null) =>
    set((state) => ({
      webcam: { ...state.webcam, error },
    })),

  setLoading: (loading: boolean) =>
    set({ isLoading: loading }),

  setError: (error: string | null) =>
    set({ error }),
}));
