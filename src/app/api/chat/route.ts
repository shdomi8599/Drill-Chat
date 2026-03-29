import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { getModel } from '@/lib/llm-providers';
import type { LLMProvider } from '@/core/types';
import { buildSubConversationSystemPrompt } from '@/core/context-builder';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Drill-Chat, an intelligent AI assistant.
You provide clear, well-structured answers using markdown formatting.
When answering complex questions, break your response into numbered items or sections
so users can easily identify and explore specific parts of your answer.
Be concise but thorough. Use headings, bullet points, and numbered lists where appropriate.`;

export async function POST(req: Request) {
  const body = await req.json();

  const {
    messages,
    provider = 'google',
    // Sub-conversation fields
    isSubConversation = false,
    rootAnswer,
    anchorText,
    subMessages: subMsgs,
    newUserMessage,
  }: {
    messages?: UIMessage[];
    provider?: LLMProvider;
    isSubConversation?: boolean;
    rootAnswer?: string;
    anchorText?: string;
    subMessages?: { role: 'user' | 'assistant'; content: string }[];
    newUserMessage?: string;
  } = body;

  const model = getModel(provider);

  if (isSubConversation && rootAnswer && anchorText && newUserMessage) {
    // ── Sub-conversation mode ──
    // Build a separate message history with sub-conversation context
    const systemPrompt = buildSubConversationSystemPrompt(rootAnswer, anchorText);

    const subConvMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(subMsgs || []),
      { role: 'user' as const, content: newUserMessage },
    ];

    const result = streamText({
      model,
      system: systemPrompt,
      messages: subConvMessages,
    });

    return result.toTextStreamResponse();
  }

  // ── Standard chat mode ──
  if (!messages) {
    return new Response('Missing messages', { status: 400 });
  }

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
