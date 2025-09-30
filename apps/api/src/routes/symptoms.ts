import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db, users, sessions, symptomEntries } from '../db';
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

const createSymptomSchema = z.object({
  bodyRegion: bodyRegionEnum,
  title: z.string().min(1),
  notes: z.string().optional(),
  severity: z.number().int().min(1).max(10).nullable().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateSymptomSchema = createSymptomSchema.partial();

export const symptomsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create symptom
  fastify.post('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = createSymptomSchema.parse(request.body);

    const [symptom] = await db.insert(symptomEntries).values({
      id: crypto.randomUUID(),
      userId: user.id,
      bodyRegion: body.bodyRegion,
      title: body.title,
      notes: body.notes || null,
      severity: body.severity || null,
      startedAt: body.startedAt ? new Date(body.startedAt) : null,
      endedAt: body.endedAt ? new Date(body.endedAt) : null,
      tags: body.tags || [],
      category: 'SYMPTOM',
      updatedAt: new Date(),
    }).returning();

    return { symptom };
  });

  // List symptoms
  fastify.get('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { region, limit = 100 } = request.query as { region?: string; limit?: number };

    const symptoms = await db
      .select()
      .from(symptomEntries)
      .where(
        region
          ? and(eq(symptomEntries.userId, user.id), eq(symptomEntries.bodyRegion, region as any))
          : eq(symptomEntries.userId, user.id)
      )
      .orderBy(desc(symptomEntries.createdAt))
      .limit(Number(limit));

    return { symptoms };
  });

  // Get symptom by ID
  fastify.get('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const result = await db
      .select()
      .from(symptomEntries)
      .where(and(eq(symptomEntries.id, id), eq(symptomEntries.userId, user.id)))
      .limit(1);

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Symptom not found' });
    }

    return { symptom: result[0] };
  });

  // Update symptom
  fastify.patch('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const body = updateSymptomSchema.parse(request.body);

    const updateData: any = { updatedAt: new Date() };
    if (body.bodyRegion) updateData.bodyRegion = body.bodyRegion;
    if (body.title) updateData.title = body.title;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.severity !== undefined) updateData.severity = body.severity;
    if (body.startedAt) updateData.startedAt = new Date(body.startedAt);
    if (body.endedAt) updateData.endedAt = new Date(body.endedAt);
    if (body.tags) updateData.tags = body.tags;

    const result = await db
      .update(symptomEntries)
      .set(updateData)
      .where(and(eq(symptomEntries.id, id), eq(symptomEntries.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Symptom not found' });
    }

    return { symptom: result[0] };
  });

  // Delete symptom
  fastify.delete('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const result = await db
      .delete(symptomEntries)
      .where(and(eq(symptomEntries.id, id), eq(symptomEntries.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Symptom not found' });
    }

    return { success: true };
  });
};