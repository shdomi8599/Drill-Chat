import { create } from 'zustand';
import type {
  LLMProvider,
  DrillTarget,
  SubConversation,
  SubMessage,
} from '@/core/types';
import { createSubConversation } from '@/core/conversation-tree';

// ── Active Sub-Conversation State ──

export interface ActiveSubConversation {
  /** ID of the parent message containing this sub-conversation */
  messageId: string;
  /** ID of the sub-conversation itself */
  subConvId: string;
  /** The drill target that spawned this sub-conversation */
  drillTarget: DrillTarget;
  /** The full content of the root AI answer (for context) */
  rootAnswer: string;
}

// ── Chat Store ──
// Manages provider selection, sub-conversation UI state, and
// sub-conversation data (messages etc.).

interface ChatState {
  // ── Provider ──
  provider: LLMProvider;
  setProvider: (provider: LLMProvider) => void;

  // ── Sidebar ──
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // ── Active Sub-Conversation (UI state) ──
  activeSubConversation: ActiveSubConversation | null;
  openSubConversation: (
    messageId: string,
    rootAnswer: string,
    drillTarget: DrillTarget,
  ) => void;
  closeSubConversation: () => void;

  // ── Sub-conversation Data ──
  // Keyed by subConvId. Stores the actual sub-conversation data
  // independently from the main chat messages (which are managed by useChat).
  subConversations: Record<string, SubConversation>;
  registerSubConversation: (subConv: SubConversation, messageId: string) => void;
  addSubMessage: (subConvId: string, msg: SubMessage) => void;
  updateSubConvStatus: (
    subConvId: string,
    status: SubConversation['status'],
    syncedContent?: string,
    originalContent?: string,
  ) => void;
  getSubConversationsForMessage: (messageId: string) => SubConversation[];

  // ── Message → SubConversation mapping ──
  messageSubConvMap: Record<string, string[]>; // messageId → subConvId[]

  // ── Sync-back state ──
  syncBackInProgress: boolean;
  setSyncBackInProgress: (v: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // ── Provider ──
  provider: 'google',
  setProvider: (provider) => set({ provider }),

  // ── Sidebar ──
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ── Active Sub-Conversation ──
  activeSubConversation: null,

  openSubConversation: (messageId, rootAnswer, drillTarget) => {
    const { subConversations, messageSubConvMap } = get();

    // Check if there's already a sub-conversation for this exact anchor
    const existingIds = messageSubConvMap[messageId] || [];
    const existing = existingIds
      .map((id) => subConversations[id])
      .find(
        (sc) =>
          sc &&
          sc.anchorText === drillTarget.text &&
          sc.status === 'active',
      );

    if (existing) {
      // Re-open existing sub-conversation
      set({
        activeSubConversation: {
          messageId,
          subConvId: existing.id,
          drillTarget,
          rootAnswer,
        },
      });
      return;
    }

    // Create new sub-conversation
    const newSubConv: SubConversation = createSubConversation(drillTarget);

    set((s) => ({
      activeSubConversation: {
        messageId,
        subConvId: newSubConv.id,
        drillTarget,
        rootAnswer,
      },
      subConversations: {
        ...s.subConversations,
        [newSubConv.id]: newSubConv,
      },
      messageSubConvMap: {
        ...s.messageSubConvMap,
        [messageId]: [...(s.messageSubConvMap[messageId] || []), newSubConv.id],
      },
    }));
  },

  closeSubConversation: () => set({ activeSubConversation: null }),

  // ── Sub-conversation Data ──
  subConversations: {},
  messageSubConvMap: {},

  registerSubConversation: (subConv, messageId) =>
    set((s) => ({
      subConversations: { ...s.subConversations, [subConv.id]: subConv },
      messageSubConvMap: {
        ...s.messageSubConvMap,
        [messageId]: [...(s.messageSubConvMap[messageId] || []), subConv.id],
      },
    })),

  addSubMessage: (subConvId, msg) =>
    set((s) => {
      const sc = s.subConversations[subConvId];
      if (!sc) return s;
      return {
        subConversations: {
          ...s.subConversations,
          [subConvId]: {
            ...sc,
            messages: [...sc.messages, msg],
          },
        },
      };
    }),

  updateSubConvStatus: (subConvId, status, syncedContent, originalContent) =>
    set((s) => {
      const sc = s.subConversations[subConvId];
      if (!sc) return s;
      return {
        subConversations: {
          ...s.subConversations,
          [subConvId]: {
            ...sc,
            status,
            ...(syncedContent !== undefined && { syncedContent }),
            ...(originalContent !== undefined && { originalContent }),
          },
        },
      };
    }),

  getSubConversationsForMessage: (messageId) => {
    const { messageSubConvMap, subConversations } = get();
    const ids = messageSubConvMap[messageId] || [];
    return ids.map((id) => subConversations[id]).filter(Boolean);
  },

  // ── Sync-back ──
  syncBackInProgress: false,
  setSyncBackInProgress: (v) => set({ syncBackInProgress: v }),
}));
