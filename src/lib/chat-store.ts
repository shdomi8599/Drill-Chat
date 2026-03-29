import { create } from 'zustand';
import type { LLMProvider } from './types';

// ── Chat Store ──
// Manages provider selection and UI state.
// Conversation messages are handled by useChat hook directly.

interface ChatState {
  // Selected LLM provider
  provider: LLMProvider;
  setProvider: (provider: LLMProvider) => void;

  // Sidebar visibility (for future use)
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  provider: 'google',
  setProvider: (provider) => set({ provider }),

  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
