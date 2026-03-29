// ============================================
// Drill-Chat — Sync-back Utilities
// ============================================
// Pure functions for preparing sync-back requests
// and processing sync-back results.
// No framework dependencies.

import type {
  SubMessage,
  SyncBackRequest,
  SyncBackResult,
  DiffSegment,
  LLMProvider,
} from './types';
import { buildSyncBackPrompt } from './context-builder';

/**
 * Prepares a SyncBackRequest from conversation state.
 */
export function prepareSyncBackRequest(
  originalAnswer: string,
  anchorText: string,
  subMessages: SubMessage[],
  provider: LLMProvider,
): SyncBackRequest {
  return {
    originalAnswer,
    anchorText,
    subConversationHistory: subMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    provider,
  };
}

/**
 * Generates a simple line-level diff between the original
 * and updated content. Not a full Myers diff — just enough
 * to highlight what changed for the UI.
 */
export function generateDiff(
  original: string,
  updated: string,
): DiffSegment[] {
  const originalLines = original.split('\n');
  const updatedLines = updated.split('\n');
  const segments: DiffSegment[] = [];

  const maxLen = Math.max(originalLines.length, updatedLines.length);

  // Simple line-by-line comparison
  let i = 0;
  let j = 0;

  while (i < originalLines.length || j < updatedLines.length) {
    const origLine = i < originalLines.length ? originalLines[i] : undefined;
    const updLine = j < updatedLines.length ? updatedLines[j] : undefined;

    if (origLine === updLine) {
      // Lines match — unchanged
      segments.push({ type: 'unchanged', content: origLine! });
      i++;
      j++;
    } else if (origLine !== undefined && updLine !== undefined) {
      // Lines differ — look ahead to find if the original line appears later
      // in the updated text (indicating insertion before it)
      const lookAheadLimit = Math.min(5, updatedLines.length - j);
      let foundAhead = -1;

      for (let k = 1; k <= lookAheadLimit; k++) {
        if (updatedLines[j + k] === origLine) {
          foundAhead = k;
          break;
        }
      }

      if (foundAhead > 0) {
        // Lines were inserted before the original line
        for (let k = 0; k < foundAhead; k++) {
          segments.push({ type: 'added', content: updatedLines[j + k] });
        }
        j += foundAhead;
        // The original line will be matched in the next iteration
      } else {
        // Line was replaced
        segments.push({ type: 'removed', content: origLine });
        segments.push({ type: 'added', content: updLine });
        i++;
        j++;
      }
    } else if (origLine === undefined) {
      // Extra lines in updated — added
      segments.push({ type: 'added', content: updLine! });
      j++;
    } else {
      // Extra lines in original — removed
      segments.push({ type: 'removed', content: origLine });
      i++;
    }
  }

  return segments;
}

/**
 * Applies a sync-back result to the original message content.
 * Returns the updated content string plus diff segments.
 */
export function applySyncBackResult(
  originalContent: string,
  updatedContent: string,
): SyncBackResult {
  return {
    updatedAnswer: updatedContent,
    diff: generateDiff(originalContent, updatedContent),
  };
}

/**
 * Builds the user prompt for the sync-back API call.
 */
export function buildSyncBackUserPrompt(
  originalAnswer: string,
  anchorText: string,
  subMessages: SubMessage[],
): string {
  return buildSyncBackPrompt(
    originalAnswer,
    anchorText,
    subMessages.map((m) => ({ role: m.role, content: m.content })),
  );
}
