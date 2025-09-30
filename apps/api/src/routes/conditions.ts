import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db, users, sessions, conditions } from '../db';
import { eq, and, desc } from 'drizzle-orm';

async function authenticate(request: any, reply: any) {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }

  const result = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      userEmail: users.email,
      userDisplayName: users.displayName,
    })
    .from(sessions)
    .leftJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (result.length === 0 || !result[0].userId || result[0].expiresAt < new Date()) {
    return reply.code(401).send({ error: 'Session expired' });
  }

  return {
    id: result[0].userId,
    email: result[0].userEmail,
    displayName: result[0].userDisplayName,
  };
}

const bodyRegionEnum = z.enum([
  'HEAD', 'NECK', 'CHEST', 'HEART', 'LUNGS', 'ABDOMEN',
  'LOW_BACK', 'UPPER_BACK', 'LEFT_ARM', 'RIGHT_ARM',
  'LEFT_LEG', 'RIGHT_LEG', 'SKIN', 'OTHER'
]);

const conditionStatusEnum = z.enum(['ACTIVE', 'RESOLVED']);

const createConditionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  bodyRegion: bodyRegionEnum,
  onsetDate: z.string().optional(),
  status: conditionStatusEnum.optional(),
});

const updateConditionSchema = createConditionSchema.partial();

export const conditionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create condition
  fastify.post('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = createConditionSchema.parse(request.body);

    const [condition] = await db.insert(conditions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      name: body.name,
      description: body.description || null,
      bodyRegion: body.bodyRegion,
      onsetDate: body.onsetDate ? new Date(body.onsetDate) : null,
      status: body.status || 'ACTIVE',
      updatedAt: new Date(),
    }).returning();

    return { condition };
  });

  // List conditions
  fastify.get('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { region, status } = request.query as { region?: string; status?: string };

    const conditionsQuery = db
      .select()
      .from(conditions)
      .where(
        and(
          eq(conditions.userId, user.id),
          region ? eq(conditions.bodyRegion, region as any) : undefined,
          status ? eq(conditions.status, status as any) : undefined
        )
      )
      .orderBy(desc(conditions.createdAt));

    const conditionsList = await conditionsQuery;

    return { conditions: conditionsList };
  });

  // Get condition by ID
  fastify.get('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const result = await db
      .select()
      .from(conditions)
      .where(and(eq(conditions.id, id), eq(conditions.userId, user.id)))
      .limit(1);

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Condition not found' });
    }

    return { condition: result[0] };
  });

  // Update condition
  fastify.patch('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const body = updateConditionSchema.parse(request.body);

    const updateData: any = { updatedAt: new Date() };
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.bodyRegion) updateData.bodyRegion = body.bodyRegion;
    if (body.onsetDate) updateData.onsetDate = new Date(body.onsetDate);
    if (body.status) updateData.status = body.status;

    const result = await db
      .update(conditions)
      .set(updateData)
      .where(and(eq(conditions.id, id), eq(conditions.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Condition not found' });
    }

    return { condition: result[0] };
  });

  // Delete condition
  fastify.delete('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const result = await db
      .delete(conditions)
      .where(and(eq(conditions.id, id), eq(conditions.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Condition not found' });
    }

    return { success: true };
  });
};