// ============================================
// Drill-Chat Core Types
// ============================================
// Framework-agnostic type definitions for
// tree-structured conversations with sub-conversations.

// ── LLM Provider ──

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
  messages: SubMessage[];
  /** Current status */
  status: 'active' | 'completed' | 'synced';
  /** Content after sync-back (the updated section) */
  syncedContent?: string;
  /** The original content before sync-back (for diff) */
  originalContent?: string;
 /** Order in messages (1-based index) */
  index: number;
  /** Assigned theme color (hex or CSS variable) */
  color: string;
  /** Timestamp */
  createdAt: number;
}

export interface SubMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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

// ── Drill Target ──
// Represents a drillable section within an AI response.

export type DrillTrigger = 'list-item' | 'text-selection' | 'heading';

export interface DrillTarget {
  /** The selected / clicked text */
  text: string;
  /** Byte-offset range inside the parent message `content` */
  range: { start: number; end: number };
  /** How the drill was triggered */
  trigger: DrillTrigger;
}

// ── Sub-conversation Context ──
// The context package sent to the LLM when a sub-conversation is active.

export interface SubConversationContext {
  /** Full text of the root AI answer */
  rootAnswer: string;
  /** The drill target that spawned this sub-conversation */
  drillTarget: DrillTarget;
  /** Messages exchanged so far in the sub-conversation */
  messages: { role: 'user' | 'assistant'; content: string }[];
}

// ── Sync-back ──

export interface SyncBackRequest {
  /** The full original AI answer */
  originalAnswer: string;
  /** The anchor text that was drilled into */
  anchorText: string;
  /** All messages from the sub-conversation */
  subConversationHistory: { role: string; content: string }[];
  /** LLM provider to use */
  provider: LLMProvider;
}

export interface SyncBackResult {
  /** The complete updated answer */
  updatedAnswer: string;
  /** Simple diff info for highlighting */
  diff: DiffSegment[];
}

export interface DiffSegment {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
}

// ── API Types ──

export interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  provider: LLMProvider;
  /** If true, this is a sub-conversation request */
  isSubConversation?: boolean;
  /** The root answer for sub-conversation context */
  rootAnswer?: string;
  /** The anchor text for sub-conversation context */
  anchorText?: string;
}
