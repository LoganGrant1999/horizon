import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db, users, sessions, medications } from '../db';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { s3Client } from '../lib/s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

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

const createMedicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  startedAt: z.string().optional(),
  stoppedAt: z.string().optional(),
  notes: z.string().optional(),
  photoKey: z.string().optional(),
});

const updateMedicationSchema = createMedicationSchema.partial();

export const medicationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create medication
  fastify.post('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = createMedicationSchema.parse(request.body);

    const [medication] = await db.insert(medications).values({
      id: crypto.randomUUID(),
      userId: user.id,
      name: body.name,
      dosage: body.dosage || null,
      frequency: body.frequency || null,
      startedAt: body.startedAt ? new Date(body.startedAt) : null,
      stoppedAt: body.stoppedAt ? new Date(body.stoppedAt) : null,
      notes: body.notes || null,
      photoKey: body.photoKey || null,
      updatedAt: new Date(),
    }).returning();

    return { medication };
  });

  // List medications
  fastify.get('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { active } = request.query as { active?: string };

    const medicationsList = await db
      .select()
      .from(medications)
      .where(
        and(
          eq(medications.userId, user.id),
          active === 'true' ? isNull(medications.stoppedAt) : undefined
        )
      )
      .orderBy(desc(medications.startedAt));

    return { medications: medicationsList };
  });

  // Get medication by ID
  fastify.get('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const result = await db
      .select()
      .from(medications)
      .where(and(eq(medications.id, id), eq(medications.userId, user.id)))
      .limit(1);

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Medication not found' });
    }

    return { medication: result[0] };
  });

  // Update medication
  fastify.patch('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const body = updateMedicationSchema.parse(request.body);

    const updateData: any = { updatedAt: new Date() };
    if (body.name) updateData.name = body.name;
    if (body.dosage !== undefined) updateData.dosage = body.dosage || null;
    if (body.frequency !== undefined) updateData.frequency = body.frequency || null;
    if (body.startedAt) updateData.startedAt = new Date(body.startedAt);
    if (body.stoppedAt !== undefined) updateData.stoppedAt = body.stoppedAt ? new Date(body.stoppedAt) : null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.photoKey !== undefined) updateData.photoKey = body.photoKey || null;

    const result = await db
      .update(medications)
      .set(updateData)
      .where(and(eq(medications.id, id), eq(medications.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Medication not found' });
    }

    return { medication: result[0] };
  });

  // Delete medication
  fastify.delete('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const existing = await db
      .select()
      .from(medications)
      .where(and(eq(medications.id, id), eq(medications.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return reply.code(404).send({ error: 'Medication not found' });
    }

    const medication = existing[0];

    // Best-effort S3 cleanup
    if (medication.photoKey) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: config.s3Bucket,
            Key: medication.photoKey,
          })
        );
        fastify.log.info(`Deleted S3 object: ${medication.photoKey}`);
      } catch (error) {
        fastify.log.error(`Failed to delete S3 object ${medication.photoKey}:`, error);
        // Continue with database deletion even if S3 cleanup fails
      }
    }

    await db
      .delete(medications)
      .where(eq(medications.id, id));

    return { success: true };
  });
};