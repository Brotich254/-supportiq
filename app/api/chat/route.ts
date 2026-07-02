import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireApiKey } from '@/lib/auth';
import { getAIResponse } from '@/lib/ai';
import { apiError, apiSuccess } from '@/lib/utils';

const schema = z.object({
  conversationId: z.string().optional(),
  visitorId: z.string(),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional(),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  // API key from header (sent by embed widget)
  const apiKey = req.headers.get('x-api-key');
  const org = await requireApiKey(apiKey);
  if (!org) return apiError('Invalid API key', 401);

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const { conversationId, visitorId, visitorName, visitorEmail, message } = parsed.data;

    // Get or create conversation
    let conversation = conversationId
      ? await db.conversation.findFirst({ where: { id: conversationId, orgId: org.id } })
      : null;

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          orgId: org.id,
          visitorId,
          visitorName,
          visitorEmail,
          status: 'BOT',
        },
      });
    }

    // If conversation is escalated/open with agent, don't call AI
    if (conversation.status === 'OPEN' || conversation.status === 'ESCALATED') {
      // Save visitor message and let agent reply
      await db.message.create({
        data: {
          conversationId: conversation.id,
          role: 'VISITOR',
          content: message,
          isAI: false,
        },
      });
      return apiSuccess({
        conversationId: conversation.id,
        message: "You're now connected with a support agent. They'll be with you shortly.",
        escalated: false,
        isAgent: false,
      });
    }

    // Save visitor message
    await db.message.create({
      data: { conversationId: conversation.id, role: 'VISITOR', content: message },
    });

    // Build conversation history for AI context
    const history = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const historyForAI = history.slice(0, -1).map((m) => ({
      role: (m.role === 'VISITOR' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

    // Get AI response
    const aiResponse = await getAIResponse(
      org.id,
      org.name,
      org.greeting,
      historyForAI,
      message
    );

    // Save AI message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'AI',
        content: aiResponse.message,
        isAI: true,
        confidence: aiResponse.confidence,
      },
    });

    // Handle escalation
    if (aiResponse.escalate) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { status: 'ESCALATED' },
      });

      // Auto-create ticket
      const ticket = await db.ticket.findUnique({ where: { conversationId: conversation.id } });
      if (!ticket) {
        await db.ticket.create({
          data: {
            orgId: org.id,
            conversationId: conversation.id,
            subject: `Support request from ${visitorName ?? visitorEmail ?? visitorId}`,
            priority: 'MEDIUM',
            status: 'OPEN',
          },
        });
      }
    }

    return apiSuccess({
      conversationId: conversation.id,
      message: aiResponse.message,
      escalated: aiResponse.escalate,
      confidence: aiResponse.confidence,
    });
  } catch (err) {
    console.error('[chat:POST]', err);
    return apiError('Server error', 500);
  }
}

// GET conversation history (for widget on reload)
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  const org = await requireApiKey(apiKey);
  if (!org) return apiError('Invalid API key', 401);

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');
  if (!conversationId) return apiError('conversationId required');

  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, orgId: org.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 50 },
    },
  });

  if (!conversation) return apiError('Not found', 404);
  return apiSuccess(conversation);
}
