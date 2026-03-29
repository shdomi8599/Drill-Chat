import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { getModelWithKey, extractKeyFromHeaders } from '@/lib/llm-providers';
import { buildSubConversationSystemPrompt } from '@/core/context-builder';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Drill-Chat, an intelligent AI assistant.
You provide clear, well-structured answers using markdown formatting.
When answering complex questions, break your response into numbered items or sections
so users can easily identify and explore specific parts of your answer.
Be concise but thorough. Use headings, bullet points, and numbered lists where appropriate.`;

export async function POST(req: Request) {
  // Extract API key from headers (BYOK)
  const { provider, apiKey } = extractKeyFromHeaders(req);

  const body = await req.json();

  const {
    messages,
    // Sub-conversation fields
    isSubConversation = false,
    rootAnswer,
    anchorText,
    subMessages: subMsgs,
    newUserMessage,
  }: {
    messages?: UIMessage[];
    isSubConversation?: boolean;
    rootAnswer?: string;
    anchorText?: string;
    subMessages?: { role: 'user' | 'assistant'; content: string }[];
    newUserMessage?: string;
  } = body;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API key is required. Please add your key in Settings.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const model = getModelWithKey(provider, apiKey);

  if (isSubConversation && rootAnswer && anchorText && newUserMessage) {
    // ── Sub-conversation mode ──
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
