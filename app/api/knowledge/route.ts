import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { embed } from '@/lib/ai';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/utils';

const createSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  source: z.enum(['MANUAL', 'FAQ', 'URL']).default('MANUAL'),
  url: z.string().url().optional(),
});

export async function GET(_: NextRequest) {
  try {
    const user = await requireAuth();
    const membership = await db.orgMember.findFirst({ where: { userId: user.id } });
    if (!membership) return apiError('No org found', 404);

    const docs = await db.knowledgeDoc.findMany({
      where: { orgId: membership.orgId },
      select: { id: true, title: true, source: true, url: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    return apiSuccess(docs);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const membership = await db.orgMember.findFirst({ where: { userId: user.id } });
    if (!membership) return apiError('No org found', 404);

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const { title, content, source, url } = parsed.data;

    // Generate embedding for semantic search
    const embeddingVector = await embed(`${title}\n\n${content}`);
    const vectorStr = `[${embeddingVector.join(',')}]`;

    // Insert with pgvector using raw SQL (Prisma doesn't support vector writes yet)
    const doc = await db.$queryRaw<{ id: string }[]>`
      INSERT INTO "KnowledgeDoc" (id, "orgId", title, content, source, url, embedding, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${membership.orgId},
        ${title},
        ${content},
        ${source}::"DocSource",
        ${url ?? null},
        ${vectorStr}::vector,
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    return apiSuccess({ id: doc[0].id, title }, 201);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[knowledge:POST]', err);
    return apiError('Server error', 500);
  }
}
