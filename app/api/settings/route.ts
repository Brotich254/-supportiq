import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET() {
  try {
    const user = await requireAuth();
    const membership = await db.orgMember.findFirst({
      where: { userId: user.id },
      include: { org: true },
    });
    if (!membership) return apiError('No org found', 404);
    return apiSuccess(membership.org);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}

const updateSchema = z.object({
  greeting: z.string().min(5).max(300).optional(),
  widgetColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  name: z.string().min(2).max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const membership = await db.orgMember.findFirst({ where: { userId: user.id } });
    if (!membership) return apiError('No org found', 404);
    if (!['OWNER', 'ADMIN'].includes(membership.role)) return apiError('Forbidden', 403);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const org = await db.organization.update({
      where: { id: membership.orgId },
      data: parsed.data,
    });
    return apiSuccess(org);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}
