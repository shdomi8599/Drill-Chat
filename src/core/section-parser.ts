// ============================================
// Drill-Chat — Markdown Section Parser
// ============================================
// Parses markdown content to identify section boundaries
// around an anchor text. Used for Partial Sync-back
// to minimize token consumption by operating only on
// the relevant section instead of the full answer.
// Pure functions — no framework dependencies.

export interface SectionBoundary {
  /** Start index in the original content string */
  start: number;
  /** End index in the original content string (exclusive) */
  end: number;
  /** The extracted section content */
  content: string;
  /** Brief summary of surrounding context (before + after) */
  surroundingContext: string;
}

/**
 * Finds the markdown section that contains the anchor text.
 *
 * Strategy:
 * 1. Locate the anchor text within the full content
 * 2. Expand outward to find the enclosing section boundaries
 *    (markdown headings, top-level list items, or paragraph breaks)
 * 3. Return the section content + position for later splicing
 */
export function findSectionBoundary(
  fullContent: string,
  anchorText: string,
): SectionBoundary | null {
  // Find the anchor text position
  const anchorIndex = fullContent.indexOf(anchorText);
  if (anchorIndex === -1) {
    // Try a fuzzy match: first 40 chars
    const shortAnchor = anchorText.slice(0, 40);
    const fuzzyIndex = fullContent.indexOf(shortAnchor);
    if (fuzzyIndex === -1) return null;
    return findSectionBoundaryAtPosition(fullContent, fuzzyIndex);
  }

  return findSectionBoundaryAtPosition(fullContent, anchorIndex);
}

/**
 * Given a position in the content, find the enclosing section.
 */
function findSectionBoundaryAtPosition(
  content: string,
  position: number,
): SectionBoundary {
  const lines = content.split('\n');
  let charCount = 0;
  let targetLineIndex = 0;

  // Find which line the position falls on
  for (let i = 0; i < lines.length; i++) {
    const lineEnd = charCount + lines[i].length + 1; // +1 for \n
    if (position < lineEnd) {
      targetLineIndex = i;
      break;
    }
    charCount = lineEnd;
  }

  // Find section start: walk backward to find a section boundary
  const sectionStart = findSectionStart(lines, targetLineIndex);

  // Find section end: walk forward to find the next section boundary
  const sectionEnd = findSectionEnd(lines, targetLineIndex);

  // Calculate character positions
  let startCharIndex = 0;
  for (let i = 0; i < sectionStart; i++) {
    startCharIndex += lines[i].length + 1;
  }

  let endCharIndex = 0;
  for (let i = 0; i < sectionEnd; i++) {
    endCharIndex += lines[i].length + 1;
  }
  // If sectionEnd equals lines.length, endCharIndex is content.length
  if (sectionEnd >= lines.length) {
    endCharIndex = content.length;
  }

  const sectionContent = content.slice(startCharIndex, endCharIndex);

  // Build surrounding context (brief summaries of before/after)
  const surroundingContext = buildSurroundingContext(
    lines,
    sectionStart,
    sectionEnd,
  );

  return {
    start: startCharIndex,
    end: endCharIndex,
    content: sectionContent,
    surroundingContext,
  };
}

/**
 * Walk backward from targetLine to find where the section starts.
 * Section boundaries: headings (# ## ###), horizontal rules (---),
 * or major structural elements.
 */
function findSectionStart(lines: string[], targetLine: number): number {
  // Check if the target line itself is within a list context
  const isInList = isListContext(lines, targetLine);

  for (let i = targetLine; i >= 0; i--) {
    const line = lines[i].trim();

    // A heading is always a section boundary
    if (isHeading(line) && i < targetLine) {
      return i;
    }

    // A horizontal rule is a boundary
    if (isHorizontalRule(line) && i < targetLine) {
      return i + 1;
    }

    // If we're in a list, find the start of the "block" containing this list
    // (look for preceding heading or double-newline)
    if (isInList && i < targetLine) {
      // If we find a heading, start from there
      if (isHeading(line)) return i;
      // If we find an empty line preceded by non-list content, this is the boundary
      if (line === '' && i > 0 && !isListItem(lines[i - 1].trim()) && !isHeading(lines[i - 1].trim())) {
        return i + 1;
      }
    }
  }

  return 0; // Start of content
}

/**
 * Walk forward from targetLine to find where the section ends.
 */
function findSectionEnd(lines: string[], targetLine: number): number {
  for (let i = targetLine + 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Next heading = section boundary
    if (isHeading(line)) {
      return i;
    }

    // Horizontal rule = section boundary
    if (isHorizontalRule(line)) {
      return i;
    }
  }

  return lines.length; // End of content
}

// ── Helper predicates ──

function isHeading(line: string): boolean {
  return /^#{1,6}\s/.test(line);
}

function isHorizontalRule(line: string): boolean {
  return /^(-{3,}|\*{3,}|_{3,})$/.test(line);
}

function isListItem(line: string): boolean {
  return /^[-*+]\s/.test(line) || /^\d+\.\s/.test(line);
}

function isListContext(lines: string[], targetLine: number): boolean {
  // Check if any nearby lines are list items
  const range = 3;
  for (
    let i = Math.max(0, targetLine - range);
    i < Math.min(lines.length, targetLine + range);
    i++
  ) {
    if (isListItem(lines[i].trim())) return true;
  }
  return false;
}

// ── Context Summarization ──

/**
 * Builds a brief summary of the content before and after the section
 * so the LLM has minimal context about the surrounding answer structure.
 */
function buildSurroundingContext(
  lines: string[],
  sectionStart: number,
  sectionEnd: number,
): string {
  const parts: string[] = [];

  // Before context: grab headings and first lines of preceding sections
  const beforeLines: string[] = [];
  for (let i = 0; i < sectionStart; i++) {
    const line = lines[i].trim();
    if (isHeading(line)) {
      beforeLines.push(line);
    }
  }
  if (beforeLines.length > 0) {
    parts.push(`[Before this section: ${beforeLines.join(' > ')}]`);
  }

  // After context: grab headings of following sections
  const afterLines: string[] = [];
  for (let i = sectionEnd; i < lines.length; i++) {
    const line = lines[i].trim();
    if (isHeading(line)) {
      afterLines.push(line);
    }
  }
  if (afterLines.length > 0) {
    parts.push(`[After this section: ${afterLines.join(' > ')}]`);
  }

  return parts.join('\n') || '[This is the only section in the answer]';
}

/**
 * Splices updated section content back into the original full answer.
 * Returns the complete updated answer.
 */
export function spliceSection(
  fullContent: string,
  boundary: SectionBoundary,
  updatedSection: string,
): string {
  return (
    fullContent.slice(0, boundary.start) +
    updatedSection +
    fullContent.slice(boundary.end)
  );
}
