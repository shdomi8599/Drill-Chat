import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LLMProvider,
  DrillTarget,
  SubConversation,
  SubMessage,
} from '@/core/types';
import { createSubConversation } from '@/core/conversation-tree';
import { getDrillColor } from '@/core/colors';

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

  // ── API Keys (BYOK) ──
  apiKeys: Record<LLMProvider, string>;
  setApiKey: (provider: LLMProvider, key: string) => void;

  // ── Selected Models ──
  selectedModels: Record<LLMProvider, string>;
  setSelectedModel: (provider: LLMProvider, modelId: string) => void;

  getApiKeyHeader: () => Record<string, string>;

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
  openSubConversationById: (
    messageId: string,
    subConvId: string,
    rootAnswer: string,
  ) => void;
  closeSubConversation: () => void;

  // ── Sub-conversation Data ──
  // Keyed by subConvId. Stores the actual sub-conversation data
  // independently from the main chat messages (which are managed by useChat).
  subConversations: Record<string, SubConversation>;
  registerSubConversation: (subConv: SubConversation, messageId: string) => void;
  addSubMessage: (subConvId: string, msg: SubMessage) => void;
  updateSubMessage: (subConvId: string, messageId: string, content: string) => void;
  updateSubConvStatus: (
    subConvId: string,
    status: SubConversation['status'],
    syncedContent?: string,
    originalContent?: string,
  ) => void;
  setSubConvLoading: (subConvId: string, isLoading: boolean) => void;
  getSubConversationsForMessage: (messageId: string) => SubConversation[];

  // ── Message → SubConversation mapping ──
  messageSubConvMap: Record<string, string[]>; // messageId → subConvId[]

  // ── Sync-back state ──
  syncBackInProgress: boolean;
  setSyncBackInProgress: (v: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // ── Provider ──
      provider: 'google',
      setProvider: (provider) => set({ provider }),

      // ── API Keys (BYOK) ──
      apiKeys: { google: '', openai: '', anthropic: '' },
      setApiKey: (provider, key) =>
        set((s) => ({
          apiKeys: { ...s.apiKeys, [provider]: key },
        })),

      // ── Selected Models ──
      selectedModels: {
        google: 'gemini-3.1-pro-preview',
        openai: 'gpt-5.4',
        anthropic: 'claude-sonnet-4.6',
      },
      setSelectedModel: (provider, modelId) =>
        set((s) => ({
          selectedModels: { ...s.selectedModels, [provider]: modelId },
        })),

      getApiKeyHeader: () => {
        const { provider, apiKeys, selectedModels } = get();
        const key = apiKeys[provider];
        const modelId = selectedModels[provider];
        const headers: Record<string, string> = {
          'x-provider': provider,
        };
        if (modelId) headers['x-model-id'] = modelId;
        if (key) headers['x-api-key'] = key;
        return headers;
      },

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
        const index = existingIds.length + 1;
        const color = getDrillColor(index);
        const newSubConv: SubConversation = createSubConversation(drillTarget, index, color);

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

      openSubConversationById: (messageId, subConvId, rootAnswer) => {
        const { subConversations } = get();
        const existing = subConversations[subConvId];
        if (existing) {
          set({
            activeSubConversation: {
              messageId,
              subConvId,
              drillTarget: {
                text: existing.anchorText,
                range: existing.anchorRange,
                trigger: 'text-selection', // default mapping
              },
              rootAnswer,
            },
          });
        }
      },

      closeSubConversation: () => {
        const { activeSubConversation, subConversations, messageSubConvMap } = get();

        if (activeSubConversation) {
          const { subConvId, messageId } = activeSubConversation;
          const sc = subConversations[subConvId];

          // Remove sub-conversation if no messages were exchanged (empty drill)
          if (sc && sc.messages.length === 0) {
            const { [subConvId]: _, ...restSubConvs } = subConversations;
            const updatedIds = (messageSubConvMap[messageId] || []).filter(
              (id) => id !== subConvId,
            );
            set({
              activeSubConversation: null,
              subConversations: restSubConvs,
              messageSubConvMap: {
                ...messageSubConvMap,
                [messageId]: updatedIds,
              },
            });
            return;
          }
        }

        set({ activeSubConversation: null });
      },

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

      updateSubMessage: (subConvId, messageId, content) =>
        set((s) => {
          const sc = s.subConversations[subConvId];
          if (!sc) return s;
          return {
            subConversations: {
              ...s.subConversations,
              [subConvId]: {
                ...sc,
                messages: sc.messages.map((m) =>
                  m.id === messageId ? { ...m, content } : m,
                ),
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

      setSubConvLoading: (subConvId, isLoading) =>
        set((s) => {
          const sc = s.subConversations[subConvId];
          if (!sc) return s;
          return {
            subConversations: {
              ...s.subConversations,
              [subConvId]: {
                ...sc,
                isLoading,
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
    }),
    {
      name: 'drill-chat-settings',
      partialize: (state: ChatState) => ({
        apiKeys: state.apiKeys,
        provider: state.provider,
        selectedModels: state.selectedModels,
      }),
    },
  ),
);
