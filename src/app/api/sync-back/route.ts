import { generateText } from 'ai';
import { getModel } from '@/lib/llm-providers';
import type { LLMProvider } from '@/core/types';
import { buildSyncBackPrompt } from '@/core/context-builder';

// Allow up to 60 seconds for sync-back generation
export const maxDuration = 60;

const SYNC_BACK_SYSTEM = `You are an AI assistant helping to integrate information from a sub-conversation back into an original answer. Follow the user's instructions precisely.`;

export async function POST(req: Request) {
  const {
    originalAnswer,
    anchorText,
    subConversationHistory,
    provider = 'google',
  }: {
    originalAnswer: string;
    anchorText: string;
    subConversationHistory: { role: string; content: string }[];
    provider?: LLMProvider;
  } = await req.json();

  if (!originalAnswer || !anchorText || !subConversationHistory?.length) {
    return Response.json(
      { error: 'Missing required fields: originalAnswer, anchorText, subConversationHistory' },
      { status: 400 },
    );
  }

  const model = getModel(provider);

  const userPrompt = buildSyncBackPrompt(
    originalAnswer,
    anchorText,
    subConversationHistory,
  );

  try {
    const result = await generateText({
      model,
      system: SYNC_BACK_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    });

    return Response.json({
      updatedAnswer: result.text,
    });
  } catch (error) {
    console.error('Sync-back error:', error);
    return Response.json(
      { error: 'Failed to generate sync-back response' },
      { status: 500 },
    );
  }
}
