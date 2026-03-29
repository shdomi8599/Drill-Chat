import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { getModel } from '@/lib/llm-providers';
import type { LLMProvider } from '@/lib/types';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Drill-Chat, an intelligent AI assistant.
You provide clear, well-structured answers using markdown formatting.
When answering complex questions, break your response into numbered items or sections
so users can easily identify and explore specific parts of your answer.
Be concise but thorough. Use headings, bullet points, and numbered lists where appropriate.`;

export async function POST(req: Request) {
  const {
    messages,
    provider = 'google',
  }: {
    messages: UIMessage[];
    provider?: LLMProvider;
  } = await req.json();

  const model = getModel(provider);

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
