import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db, users, sessions, journalEntries, symptomEntries } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';

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

const createJournalSchema = z.object({
  rawText: z.string().min(1),
});

const updateJournalSchema = z.object({
  rawText: z.string().min(1).optional(),
});

export const journalRoutes: FastifyPluginAsync = async (fastify) => {
  // Create journal entry
  fastify.post('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = createJournalSchema.parse(request.body);

    const [entry] = await db.insert(journalEntries).values({
      id: crypto.randomUUID(),
      userId: user.id,
      rawText: body.rawText,
      parseStatus: 'PENDING',
      updatedAt: new Date(),
    }).returning();

    // Trigger AI parsing asynchronously
    // Don't await - let it run in background
    fastify.inject({
      method: 'POST',
      url: '/api/ai/parse',
      payload: { journalEntryId: entry.id },
      cookies: request.cookies,
    }).catch((error) => {
      fastify.log.error('Background AI parsing failed:', error);
    });

    return { entry };
  });

  // List journal entries
  fastify.get('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { limit = 20, offset = 0 } = request.query as {
      limit?: number;
      offset?: number;
    };

    const entries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, user.id))
      .orderBy(desc(journalEntries.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Get symptoms for each entry
    const entriesWithSymptoms = await Promise.all(
      entries.map(async (entry) => {
        const symptoms = await db
          .select()
          .from(symptomEntries)
          .where(eq(symptomEntries.userId, user.id))
          .orderBy(desc(symptomEntries.createdAt));

        return { ...entry, symptoms };
      })
    );

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(journalEntries)
      .where(eq(journalEntries.userId, user.id));

    return { entries: entriesWithSymptoms, total: countResult?.count || 0 };
  });

  // Get journal entry by ID
  fastify.get('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const result = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, user.id)))
      .limit(1);

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Journal entry not found' });
    }

    // Get symptoms for this entry
    const symptoms = await db
      .select()
      .from(symptomEntries)
      .where(eq(symptomEntries.userId, user.id))
      .orderBy(desc(symptomEntries.createdAt));

    const entry = { ...result[0], symptoms };

    return { entry };
  });

  // Update journal entry
  fastify.patch('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const body = updateJournalSchema.parse(request.body);

    const updateData: any = { updatedAt: new Date() };
    if (body.rawText) updateData.rawText = body.rawText;

    const result = await db
      .update(journalEntries)
      .set(updateData)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Journal entry not found' });
    }

    // Get symptoms for this entry
    const symptoms = await db
      .select()
      .from(symptomEntries)
      .where(eq(symptomEntries.userId, user.id));

    const entry = { ...result[0], symptoms };

    return { entry };
  });

  // Delete journal entry
  fastify.delete('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const result = await db
      .delete(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Journal entry not found' });
    }

    return { success: true };
  });
};