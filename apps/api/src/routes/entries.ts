import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db';

const createEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  sleep: z.number().min(0).max(24),
  notes: z.string().optional(),
});

async function authenticate(request: any, reply: any) {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return reply.code(401).send({ error: 'Session expired' });
  }

  return session.user;
}

export const entryRoutes: FastifyPluginAsync = async (fastify) => {
  // Create entry
  fastify.post('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = createEntrySchema.parse(request.body);

    const entry = await db.entry.create({
      data: {
        userId: user.id,
        date: new Date(body.date),
        mood: body.mood,
        energy: body.energy,
        sleep: body.sleep,
        notes: body.notes,
      },
    });

    return { entry };
  });

  // List entries
  fastify.get('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const entries = await db.entry.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 100,
    });

    return { entries };
  });

  // Get single entry
  fastify.get('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const entry = await db.entry.findFirst({
      where: { id, userId: user.id },
    });

    if (!entry) {
      return reply.code(404).send({ error: 'Entry not found' });
    }

    return { entry };
  });

  // Update entry
  fastify.patch('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const body = createEntrySchema.partial().parse(request.body);

    const entry = await db.entry.updateMany({
      where: { id, userId: user.id },
      data: body,
    });

    if (entry.count === 0) {
      return reply.code(404).send({ error: 'Entry not found' });
    }

    const updated = await db.entry.findUnique({ where: { id } });
    return { entry: updated };
  });

  // Delete entry
  fastify.delete('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const entry = await db.entry.deleteMany({
      where: { id, userId: user.id },
    });

    if (entry.count === 0) {
      return reply.code(404).send({ error: 'Entry not found' });
    }

    return { success: true };
  });
};