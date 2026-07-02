import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { embed } from '@/lib/ai';
import { apiError, apiSuccess } from '@/lib/utils';

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const membership = await db.orgMember.findFirst({ where: { userId: user.id } });
    if (!membership) return apiError('No org found', 404);

    const doc = await db.knowledgeDoc.findFirst({
      where: { id: params.id, orgId: membership.orgId },
    });
    if (!doc) return apiError('Not found', 404);

    await db.knowledgeDoc.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const membership = await db.orgMember.findFirst({ where: { userId: user.id } });
    if (!membership) return apiError('No org found', 404);

    const { title, content } = await req.json();
    const embeddingVector = await embed(`${title}\n\n${content}`);
    const vectorStr = `[${embeddingVector.join(',')}]`;

    await db.$executeRaw`
      UPDATE "KnowledgeDoc"
      SET title = ${title}, content = ${content}, embedding = ${vectorStr}::vector, "updatedAt" = NOW()
      WHERE id = ${params.id} AND "orgId" = ${membership.orgId}
    `;

    return apiSuccess({ updated: true });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}
