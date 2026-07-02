import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(_: NextRequest) {
  try {
    const user = await requireAuth();
    const membership = await db.orgMember.findFirst({ where: { userId: user.id } });
    if (!membership) return apiError('No org found', 404);

    const orgId = membership.orgId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTickets,
      openTickets,
      resolvedThisMonth,
      totalConversations,
      botHandled,
      escalated,
      knowledgeDocs,
    ] = await Promise.all([
      db.ticket.count({ where: { orgId } }),
      db.ticket.count({ where: { orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      db.ticket.count({ where: { orgId, status: 'RESOLVED', resolvedAt: { gte: startOfMonth } } }),
      db.conversation.count({ where: { orgId } }),
      db.conversation.count({ where: { orgId, status: { in: ['BOT', 'RESOLVED'] } } }),
      db.conversation.count({ where: { orgId, status: 'ESCALATED' } }),
      db.knowledgeDoc.count({ where: { orgId } }),
    ]);

    const botResolutionRate = totalConversations > 0
      ? Math.round((botHandled / totalConversations) * 100)
      : 0;

    // Recent tickets for the inbox preview
    const recentTickets = await db.ticket.findMany({
      where: { orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      include: {
        conversation: {
          select: {
            visitorName: true,
            visitorEmail: true,
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return apiSuccess({
      stats: {
        totalTickets,
        openTickets,
        resolvedThisMonth,
        botResolutionRate,
        escalated,
        knowledgeDocs,
      },
      recentTickets,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}
