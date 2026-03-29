'use client';

// ============================================
// Drill-Chat — Drillable Content
// ============================================
// Renders AI response content with interactive
// drill-down buttons on list items and headings.

import { useCallback, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { DrillTarget } from '@/core/types';
import { Search } from 'lucide-react';

interface DrillableContentProps {
  /** The raw markdown content from the AI */
  content: string;
  /** Called when the user clicks a drill button on an item */
  onDrill: (target: DrillTarget) => void;
  /** Whether drill buttons should be shown */
  drillEnabled?: boolean;
  /** IDs of anchors that already have active sub-conversations */
  activeAnchors?: string[];
}

/**
 * Wraps react-markdown with custom renderers that add
 * drill-down affordances to list items and headings.
 */
export function DrillableContent({
  content,
  onDrill,
  drillEnabled = true,
  activeAnchors = [],
}: DrillableContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDrill = useCallback(
    (text: string, trigger: DrillTarget['trigger']) => {
      // Find the position of this text in the content
      const start = content.indexOf(text);
      const end = start >= 0 ? start + text.length : 0;

      onDrill({
        text,
        range: { start, end },
        trigger,
      });
    },
    [content, onDrill],
  );

  // Custom renderers that add drill buttons
  const components: Components = {
    li: ({ children, ...props }) => {
      const text = extractTextFromChildren(children);
      const isActive = activeAnchors.some((a) => text.includes(a));

      return (
        <li {...props} className={`drillable-item ${isActive ? 'drillable-active' : ''}`}>
          <span className="drillable-item-content">{children}</span>
          {drillEnabled && text.length > 10 && (
            <button
              className="drill-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDrill(text, 'list-item');
              }}
              title="Drill into this item"
              aria-label={`Drill into: ${text.slice(0, 50)}`}
            >
              <Search size={12} />
              <span className="drill-btn-label">Drill</span>
            </button>
          )}
        </li>
      );
    },
    h2: ({ children, ...props }) => {
      const text = extractTextFromChildren(children);
      return (
        <h2 {...props} className="drillable-heading">
          {children}
          {drillEnabled && (
            <button
              className="drill-btn drill-btn-heading"
              onClick={(e) => {
                e.stopPropagation();
                handleDrill(text, 'heading');
              }}
              title="Drill into this section"
            >
              <Search size={12} />
            </button>
          )}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const text = extractTextFromChildren(children);
      return (
        <h3 {...props} className="drillable-heading">
          {children}
          {drillEnabled && (
            <button
              className="drill-btn drill-btn-heading"
              onClick={(e) => {
                e.stopPropagation();
                handleDrill(text, 'heading');
              }}
              title="Drill into this section"
            >
              <Search size={12} />
            </button>
          )}
        </h3>
      );
    },
  };

  return (
    <div ref={contentRef} className="drillable-content markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ── Helpers ──

/**
 * Extracts plain text from React children recursively.
 */
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (!children) return '';

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }

  if (typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren(
      (children as React.ReactElement<{ children?: React.ReactNode }>).props.children,
    );
  }

  return '';
}
