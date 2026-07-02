import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Get user's org
    const membership = await db.orgMember.findFirst({
      where: { userId: user.id },
      include: { org: true },
    });
    if (!membership) return apiError('No organization found', 404);

    const tickets = await db.ticket.findMany({
      where: {
        orgId: membership.org.id,
        ...(status ? { status: status as any } : {}),
        ...(priority ? { priority: priority as any } : {}),
      },
      include: {
        conversation: {
          select: {
            visitorName: true,
            visitorEmail: true,
            visitorId: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true, createdAt: true, role: true },
            },
          },
        },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return apiSuccess(tickets);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}
