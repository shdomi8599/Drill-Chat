/**
 * Rainbow Drill - Color Palette
 * Distinct, premium colors for highlighting different sub-conversation sessions.
 * These are HSL values that work well with the dark theme of Drill-Chat.
 */

export const DRILL_COLORS = [
  '#818cf8', // Indigo
  '#34d399', // Emerald
  '#fb7185', // Rose
  '#fbbf24', // Amber
  '#22d3ee', // Cyan
  '#c084fc', // Violet
  '#f472b6', // Pink
  '#4ade80', // Green
];

/**
 * Returns a color from the palette based on an index.
 */
export function getDrillColor(index: number): string {
  // Use modulo to cycle through the palette if there are more than 8 drills
  const colorIndex = (index - 1) % DRILL_COLORS.length;
  return DRILL_COLORS[colorIndex >= 0 ? colorIndex : 0];
}

/**
 * Utility to add opacity to a hex color for backgrounds.
 */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
