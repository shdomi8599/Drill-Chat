// ============================================
// Drill-Chat — Context Builder
// ============================================
// Builds the LLM prompts and context packages
// for sub-conversations and sync-back operations.
// Pure functions — no framework dependencies.

import type { SubConversationContext, SubMessage } from './types';

// ── Sub-conversation System Prompt ──

/**
 * Generates a system prompt for the LLM when operating
 * inside a sub-conversation. Includes the root answer
 * for full context awareness.
 */
export function buildSubConversationSystemPrompt(
  rootAnswer: string,
  anchorText: string,
): string {
  return `You are Drill Chat, an intelligent AI assistant.

The user is exploring a specific part of a previous AI answer in a sub-conversation.
They selected the following text to drill into:

--- ANCHOR TEXT ---
${anchorText}
--- END ANCHOR TEXT ---

For context, here is the full original answer this was part of:

--- ORIGINAL ANSWER ---
${rootAnswer}
--- END ORIGINAL ANSWER ---

Rules:
1. Focus your responses on the selected anchor text topic.
2. Provide deeper, more detailed information about this specific area.
3. You may reference other parts of the original answer for context.
4. Use markdown formatting for clarity.
5. Be thorough — the user drilled into this topic because they want more detail.`;
}

// ── Sync-back Prompt ──

/**
 * Generates the prompt used to merge sub-conversation insights
 * back into the original answer.
 */
export function buildSyncBackPrompt(
  originalAnswer: string,
  anchorText: string,
  subConversationHistory: { role: string; content: string }[],
): string {
  const historyText = subConversationHistory
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  return `Below is an original AI answer and a sub-conversation the user had about "${anchorText}".

Integrate the information from the sub-conversation into the relevant section of the original answer and return the COMPLETE updated answer.

Rules:
1. Update ONLY the relevant section (the anchor text area) with new information from the sub-conversation.
2. Keep the rest of the original answer completely unchanged.
3. Make the updated section richer and more detailed based on the sub-conversation insights.
4. Maintain the same formatting style (markdown, numbered lists, etc.) as the original answer.
5. Do NOT add artificial markers like ★Enhanced★ — make it read naturally.
6. Respond with the COMPLETE updated answer, not just the changed part.

--- ORIGINAL ANSWER ---
${originalAnswer}
--- END ORIGINAL ANSWER ---

--- SUB-CONVERSATION about "${anchorText}" ---
${historyText}
--- END SUB-CONVERSATION ---

Now return the complete updated answer with the sub-conversation insights integrated:`;
}

// ── Partial Sync-back Prompt ──

/**
 * Generates a prompt for partial sync-back.
 * Instead of rewriting the entire answer, the LLM only rewrites
 * the relevant section — reducing output tokens by up to ~75%.
 */
export function buildPartialSyncBackPrompt(
  sectionContent: string,
  anchorText: string,
  surroundingContext: string,
  subConversationHistory: { role: string; content: string }[],
): string {
  const historyText = subConversationHistory
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  return `Below is a SECTION from an AI answer and a sub-conversation the user had about "${anchorText}".

Rewrite ONLY this section with the new insights from the sub-conversation integrated.

Rules:
1. Return ONLY the rewritten section — do NOT include any other parts of the answer.
2. Enrich the section with information from the sub-conversation.
3. Maintain the exact same formatting style (markdown, numbered lists, blockquotes, etc.).
4. Do NOT add artificial markers like ★Enhanced★ — make it read naturally.
5. Keep the same overall length unless the new information requires expansion.

--- SURROUNDING CONTEXT ---
${surroundingContext}
--- END SURROUNDING CONTEXT ---

--- SECTION TO REWRITE ---
${sectionContent}
--- END SECTION ---

--- SUB-CONVERSATION about "${anchorText}" ---
${historyText}
--- END SUB-CONVERSATION ---

Now return the rewritten section:`;
}

// ── Context Package ──

/**
 * Builds the full context object for a sub-conversation.
 * Used by hooks to pass context around.
 */
export function buildSubConversationContext(
  rootAnswer: string,
  anchorText: string,
  anchorRange: { start: number; end: number },
  messages: SubMessage[],
): SubConversationContext {
  return {
    rootAnswer,
    drillTarget: {
      text: anchorText,
      range: anchorRange,
      trigger: 'text-selection', // default, can be overridden
    },
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };
}

/**
 * Converts sub-conversation messages into the format
 * expected by the chat API.
 */
export function buildSubConversationApiMessages(
  rootAnswer: string,
  anchorText: string,
  subMessages: SubMessage[],
  newUserMessage: string,
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
  const systemPrompt = buildSubConversationSystemPrompt(rootAnswer, anchorText);

  const apiMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of subMessages) {
    apiMessages.push({ role: msg.role, content: msg.content });
  }

  apiMessages.push({ role: 'user', content: newUserMessage });

  return apiMessages;
}
