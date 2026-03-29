import { generateText } from 'ai';
import { getModelWithKey, extractKeyFromHeaders } from '@/lib/llm-providers';
import { buildPartialSyncBackPrompt } from '@/core/context-builder';
import { findSectionBoundary, spliceSection } from '@/core/section-parser';

// Allow up to 60 seconds for sync-back generation
export const maxDuration = 60;

const SYNC_BACK_SYSTEM = `You are an AI assistant. Rewrite the given section by integrating insights from the sub-conversation. Return ONLY the rewritten section — nothing else.`;

export async function POST(req: Request) {
  // Extract API key and modelId from headers (BYOK)
  const { provider, apiKey, modelId } = extractKeyFromHeaders(req);

  const {
    originalAnswer,
    anchorText,
    subConversationHistory,
  }: {
    originalAnswer: string;
    anchorText: string;
    subConversationHistory: { role: string; content: string }[];
  } = await req.json();

  if (!apiKey) {
    return Response.json(
      { error: 'API key is required. Please add your key in Settings.' },
      { status: 401 },
    );
  }

  if (!originalAnswer || !anchorText || !subConversationHistory?.length) {
    return Response.json(
      { error: 'Missing required fields: originalAnswer, anchorText, subConversationHistory' },
      { status: 400 },
    );
  }

  // ── Partial Sync-back: find the relevant section ──
  const boundary = findSectionBoundary(originalAnswer, anchorText);

  if (!boundary) {
    return Response.json(
      { error: 'Could not locate the anchor text section in the original answer' },
      { status: 422 },
    );
  }

  const model = getModelWithKey(provider, apiKey, modelId);

  const userPrompt = buildPartialSyncBackPrompt(
    boundary.content,
    anchorText,
    boundary.surroundingContext,
    subConversationHistory,
  );

  try {
    const result = await generateText({
      model,
      system: SYNC_BACK_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Splice the updated section back into the full answer
    const updatedAnswer = spliceSection(
      originalAnswer,
      boundary,
      result.text,
    );

    return Response.json({
      updatedAnswer,
      _meta: {
        mode: 'partial',
        sectionLength: boundary.content.length,
        fullAnswerLength: originalAnswer.length,
        outputLength: result.text.length,
        savedOutputTokens: Math.max(0, originalAnswer.length - result.text.length),
      },
    });
  } catch (error) {
    console.error('Sync-back error:', error);
    return Response.json(
      { error: 'Failed to generate sync-back response' },
      { status: 500 },
    );
  }
}
