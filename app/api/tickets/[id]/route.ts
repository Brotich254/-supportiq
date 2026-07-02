import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/utils';

const updateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const ticket = await db.ticket.findUnique({
      where: { id: params.id },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              include: { agent: { select: { name: true, avatar: true } } },
            },
          },
        },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!ticket) return apiError('Not found', 404);
    return apiSuccess(ticket);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const ticket = await db.ticket.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        ...(parsed.data.status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
      },
    });

    // If assigning an agent, update conversation status
    if (parsed.data.assigneeId) {
      await db.conversation.update({
        where: { id: ticket.conversationId },
        data: { status: 'OPEN' },
      });
    }

    return apiSuccess(ticket);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}

// Agent replies to ticket
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const { message } = await req.json();
    if (!message?.trim()) return apiError('Message required');

    const ticket = await db.ticket.findUnique({ where: { id: params.id } });
    if (!ticket) return apiError('Not found', 404);

    const msg = await db.message.create({
      data: {
        conversationId: ticket.conversationId,
        role: 'AGENT',
        content: message,
        agentId: user.id,
        isAI: false,
      },
    });

    // Update ticket status to in_progress if it's open
    if (ticket.status === 'OPEN') {
      await db.ticket.update({ where: { id: params.id }, data: { status: 'IN_PROGRESS' } });
    }

    return apiSuccess(msg, 201);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}
