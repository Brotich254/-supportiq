import { NextRequest } from 'next/server';
import { requireApiKey } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/utils';

// Public endpoint — returns widget configuration for the embed script
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') ?? new URL(req.url).searchParams.get('key');
  const org = await requireApiKey(apiKey);
  if (!org) return apiError('Invalid API key', 401);

  return apiSuccess({
    orgName: org.name,
    greeting: org.greeting,
    widgetColor: org.widgetColor,
  });
}
