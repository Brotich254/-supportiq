import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiError, apiSuccess, generateApiKey, generateSlug } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message);

    const { name, email, password, orgName } = parsed.data;

    if (await db.user.findUnique({ where: { email } })) {
      return apiError('Email already registered', 409);
    }

    const hash = await bcrypt.hash(password, 12);

    // Create user + org atomically
    const user = await db.user.create({ data: { name, email, password: hash } });

    let slug = generateSlug(orgName);
    const existing = await db.organization.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const org = await db.organization.create({
      data: {
        name: orgName,
        slug,
        apiKey: generateApiKey(),
        members: { create: { userId: user.id, role: 'OWNER' } },
      },
    });

    return apiSuccess({ userId: user.id, orgId: org.id, orgSlug: org.slug }, 201);
  } catch (err) {
    console.error('[register]', err);
    return apiError('Server error', 500);
  }
}
