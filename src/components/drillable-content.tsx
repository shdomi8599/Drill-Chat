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
  /** Called when the user clicks an active anchor to reopen it */
  onReopen?: (subConvId: string) => void;
  /** Anchors that already have active sub-conversations */
  activeAnchors?: { text: string; color: string; index: number; subConvId: string }[];
}

/**
 * Wraps react-markdown with custom renderers that add
 * drill-down affordances to list items and headings.
 */
export function DrillableContent({
  content,
  onDrill,
  onReopen,
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
    li: ({ node, children, ...props }) => {
      // Use raw markdown text if positional info is available, otherwise fallback to plain text
      const text = node?.position?.start?.offset !== undefined && node?.position?.end?.offset !== undefined
        ? content.slice(node.position.start.offset, node.position.end.offset)
        : extractTextFromChildren(children);
      const activeInfo = activeAnchors.find((a) => text.trim() === a.text.trim());

      return (
        <li
          {...props}
          className={`drillable-item ${activeInfo ? 'drillable-active' : ''}`}
          style={activeInfo ? ({ '--drill-accent': activeInfo.color, cursor: 'pointer' } as React.CSSProperties) : {}}
          onClick={(e) => {
            if (activeInfo && onReopen) {
              e.stopPropagation();
              onReopen(activeInfo.subConvId);
            }
          }}
        >
          <span className="drillable-item-content">
            {activeInfo && (
              <span className="drill-index-chip">
                {activeInfo.index}
              </span>
            )}
            {children}
          </span>
          {drillEnabled && text.length > 10 && !activeInfo && (
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
    h2: ({ node, children, ...props }) => {
      const text = node?.position?.start?.offset !== undefined && node?.position?.end?.offset !== undefined
        ? content.slice(node.position.start.offset, node.position.end.offset)
        : extractTextFromChildren(children);
      const activeInfo = activeAnchors.find((a) => text.trim() === a.text.trim());

      return (
        <h2
          {...props}
          className={`drillable-heading ${activeInfo ? 'drillable-active' : ''}`}
          style={activeInfo ? ({ '--drill-accent': activeInfo.color, cursor: 'pointer' } as React.CSSProperties) : {}}
          onClick={(e) => {
            if (activeInfo && onReopen) {
              e.stopPropagation();
              onReopen(activeInfo.subConvId);
            }
          }}
        >
          {activeInfo && (
            <span className="drill-index-chip">
              {activeInfo.index}
            </span>
          )}
          {children}
          {drillEnabled && !activeInfo && (
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
    h3: ({ node, children, ...props }) => {
      const text = node?.position?.start?.offset !== undefined && node?.position?.end?.offset !== undefined
        ? content.slice(node.position.start.offset, node.position.end.offset)
        : extractTextFromChildren(children);
      const activeInfo = activeAnchors.find((a) => text.trim() === a.text.trim());

      return (
        <h3
          {...props}
          className={`drillable-heading ${activeInfo ? 'drillable-active' : ''}`}
          style={activeInfo ? ({ '--drill-accent': activeInfo.color, cursor: 'pointer' } as React.CSSProperties) : {}}
          onClick={(e) => {
            if (activeInfo && onReopen) {
              e.stopPropagation();
              onReopen(activeInfo.subConvId);
            }
          }}
        >
          {activeInfo && (
            <span className="drill-index-chip">
              {activeInfo.index}
            </span>
          )}
          {children}
          {drillEnabled && !activeInfo && (
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
