'use client';

// ============================================
// Drill-Chat — Sync-back Diff Highlight
// ============================================
// Visually highlights the differences between
// the original and sync-back updated content.

import type { DiffSegment } from '@/core/types';
import { generateDiff } from '@/core/sync-back';

interface SyncBackDiffProps {
  /** The original content before sync-back */
  originalContent: string;
  /** The updated content after sync-back */
  updatedContent: string;
  /** Whether to show the diff or the final content */
  showDiff?: boolean;
}

export function SyncBackDiff({
  originalContent,
  updatedContent,
  showDiff = true,
}: SyncBackDiffProps) {
  if (!showDiff) return null;

  const segments = generateDiff(originalContent, updatedContent);

  // Only show if there are actual changes
  const hasChanges = segments.some((s) => s.type !== 'unchanged');
  if (!hasChanges) return null;

  return (
    <div className="sync-diff">
      <div className="sync-diff-header">
        <span className="sync-diff-badge">✨ Enhanced by Drill Chat</span>
      </div>
      <div className="sync-diff-content">
        {segments.map((segment, i) => (
          <span
            key={i}
            className={`sync-diff-segment sync-diff-${segment.type}`}
          >
            {segment.content}
            {i < segments.length - 1 && '\n'}
          </span>
        ))}
      </div>
    </div>
  );
}
