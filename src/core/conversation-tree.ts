// ============================================
// Drill-Chat — Conversation Tree Utilities
// ============================================
// Pure functions for manipulating tree-structured
// conversation data. All functions are immutable —
// they return new objects instead of mutating.

import { v4 as uuid } from 'uuid';
import type {
  Message,
  SubConversation,
  SubMessage,
  Conversation,
  DrillTarget,
} from './types';

// ── Create ──

/**
 * Creates a new Message node.
 */
export function createMessage(
  role: 'user' | 'assistant',
  content: string,
): Message {
  return {
    id: uuid(),
    role,
    content,
    subConversations: [],
    createdAt: Date.now(),
  };
}

/**
 * Creates a new SubConversation attached to a drill target.
 */
export function createSubConversation(
  drillTarget: DrillTarget,
): SubConversation {
  return {
    id: uuid(),
    anchorText: drillTarget.text,
    anchorRange: { ...drillTarget.range },
    messages: [],
    status: 'active',
    createdAt: Date.now(),
  };
}

/**
 * Creates a new SubMessage for use inside a SubConversation.
 */
export function createSubMessage(
  role: 'user' | 'assistant',
  content: string,
): SubMessage {
  return {
    id: uuid(),
    role,
    content,
    createdAt: Date.now(),
  };
}

// ── Read (Tree Traversal) ──

/**
 * Finds a message by ID within a flat message list.
 */
export function findMessage(
  messages: Message[],
  messageId: string,
): Message | undefined {
  return messages.find((m) => m.id === messageId);
}

/**
 * Finds a sub-conversation by ID within a message's sub-conversations.
 */
export function findSubConversation(
  message: Message,
  subConvId: string,
): SubConversation | undefined {
  return message.subConversations.find((sc) => sc.id === subConvId);
}

/**
 * Finds a sub-conversation across all messages.
 * Returns `{ message, subConversation }` or undefined.
 */
export function findSubConversationGlobal(
  messages: Message[],
  subConvId: string,
): { message: Message; subConversation: SubConversation } | undefined {
  for (const message of messages) {
    const sc = message.subConversations.find((s) => s.id === subConvId);
    if (sc) return { message, subConversation: sc };
  }
  return undefined;
}

/**
 * Returns the breadcrumb path to a sub-conversation.
 * Useful for nested navigation UI.
 */
export function getConversationPath(
  messages: Message[],
  subConvId: string,
): { messageId: string; subConvId: string }[] {
  for (const message of messages) {
    const sc = message.subConversations.find((s) => s.id === subConvId);
    if (sc) {
      return [{ messageId: message.id, subConvId: sc.id }];
    }
  }
  return [];
}

// ── Update (Immutable) ──

/**
 * Adds a sub-conversation to a specific message.
 * Returns a new messages array.
 */
export function addSubConversation(
  messages: Message[],
  messageId: string,
  subConv: SubConversation,
): Message[] {
  return messages.map((msg) => {
    if (msg.id !== messageId) return msg;
    return {
      ...msg,
      subConversations: [...msg.subConversations, subConv],
    };
  });
}

/**
 * Adds a message to a sub-conversation.
 * Returns a new messages array.
 */
export function addSubMessage(
  messages: Message[],
  messageId: string,
  subConvId: string,
  subMsg: SubMessage,
): Message[] {
  return messages.map((msg) => {
    if (msg.id !== messageId) return msg;
    return {
      ...msg,
      subConversations: msg.subConversations.map((sc) => {
        if (sc.id !== subConvId) return sc;
        return {
          ...sc,
          messages: [...sc.messages, subMsg],
        };
      }),
    };
  });
}

/**
 * Updates the content of a specific message.
 * Used during sync-back to replace the root answer.
 */
export function updateMessageContent(
  messages: Message[],
  messageId: string,
  newContent: string,
): Message[] {
  return messages.map((msg) => {
    if (msg.id !== messageId) return msg;
    return { ...msg, content: newContent };
  });
}

/**
 * Updates a sub-conversation's status and optional synced content.
 * Returns a new messages array.
 */
export function updateSubConversation(
  messages: Message[],
  messageId: string,
  subConvId: string,
  updates: Partial<Pick<SubConversation, 'status' | 'syncedContent' | 'originalContent'>>,
): Message[] {
  return messages.map((msg) => {
    if (msg.id !== messageId) return msg;
    return {
      ...msg,
      subConversations: msg.subConversations.map((sc) => {
        if (sc.id !== subConvId) return sc;
        return { ...sc, ...updates };
      }),
    };
  });
}

/**
 * Returns a count of all active sub-conversations across messages.
 */
export function countActiveSubConversations(messages: Message[]): number {
  return messages.reduce(
    (sum, msg) =>
      sum + msg.subConversations.filter((sc) => sc.status === 'active').length,
    0,
  );
}
