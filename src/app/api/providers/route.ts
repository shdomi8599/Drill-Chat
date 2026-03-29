import { getAvailableProviders, getDefaultProvider } from '@/lib/llm-providers';

export async function GET() {
  const providers = getAvailableProviders();
  const defaultProvider = getDefaultProvider();

  return Response.json({ providers, defaultProvider });
}
