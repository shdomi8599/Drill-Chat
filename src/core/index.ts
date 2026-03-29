// ============================================
// Drill-Chat Core — Barrel Export
// ============================================
// Public API surface for the core library.
// Import from '@/core' to access all core utilities.

// Types
export type {
  LLMProvider,
  LLMProviderConfig,
  SubConversation,
  SubMessage,
  Message,
  Conversation,
  DrillTrigger,
  DrillTarget,
  SubConversationContext,
  SyncBackRequest,
  SyncBackResult,
  DiffSegment,
  ChatRequest,
} from './types';

// Conversation tree utilities
export {
  createMessage,
  createSubConversation,
  createSubMessage,
  findMessage,
  findSubConversation,
  findSubConversationGlobal,
  getConversationPath,
  addSubConversation,
  addSubMessage,
  updateMessageContent,
  updateSubConversation,
  countActiveSubConversations,
} from './conversation-tree';

// Context building
export {
  buildSubConversationSystemPrompt,
  buildSyncBackPrompt,
  buildPartialSyncBackPrompt,
  buildSubConversationContext,
  buildSubConversationApiMessages,
} from './context-builder';

// Section parser (for partial sync-back)
export {
  findSectionBoundary,
  spliceSection,
} from './section-parser';
export type { SectionBoundary } from './section-parser';

// Sync-back
export {
  prepareSyncBackRequest,
  generateDiff,
  applySyncBackResult,
  buildSyncBackUserPrompt,
} from './sync-back';
