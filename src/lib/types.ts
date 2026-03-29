// ============================================
// Drill-Chat Core Types
// ============================================
// Tree-structured conversation data model

export type LLMProvider = 'google' | 'openai' | 'anthropic';

export interface LLMProviderConfig {
  id: LLMProvider;
  name: string;
  model: string;
  available: boolean;
}

// ── Conversation Tree ──

export interface SubConversation {
  id: string;
  /** The text the user selected/clicked to open this sub-conversation */
  anchorText: string;
  /** Position range within the parent message content */
  anchorRange: { start: number; end: number };
  /** Messages within this sub-conversation */
  messages: Message[];
  /** Current status */
  status: 'active' | 'completed' | 'synced';
  /** Content after sync-back (the updated section) */
  syncedContent?: string;
  /** Timestamp */
  createdAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Sub-conversations spawned from this message */
  subConversations: SubConversation[];
  /** Is this message currently being streamed? */
  isStreaming?: boolean;
  /** Timestamp */
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// ── API Types ──

export interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  provider: LLMProvider;
}

export interface SyncBackRequest {
  originalAnswer: string;
  anchorText: string;
  subConversationHistory: { role: string; content: string }[];
  provider: LLMProvider;
}
