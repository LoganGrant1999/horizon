import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, users, sessions } from '../db';
import { hashPassword, verifyPassword } from '../lib/auth';
import { config } from '../config';
import { randomUUID } from 'crypto';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      return reply.code(400).send({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(body.password);
    const userId = randomUUID();

    const [user] = await db.insert(users).values({
      id: userId,
      email: body.email,
      passwordHash,
      displayName: body.displayName || null,
      updatedAt: new Date(),
    }).returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      createdAt: users.createdAt,
    });

    const sessionId = randomUUID();
    const [session] = await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(Date.now() + config.sessionMaxAge),
    }).returning();

    reply.setCookie('sessionId', session.id, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: config.sessionMaxAge / 1000,
      path: '/',
    });

    return { user };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const result = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (result.length === 0) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const user = result[0];
    if (!user.passwordHash) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const sessionId = randomUUID();
    const [session] = await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(Date.now() + config.sessionMaxAge),
    }).returning();

    reply.setCookie('sessionId', session.id, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: config.sessionMaxAge / 1000,
      path: '/',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    };
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    const sessionId = request.cookies.sessionId;
    if (sessionId) {
      await db.delete(sessions).where(eq(sessions.id, sessionId)).catch(() => {});
    }

    reply.clearCookie('sessionId', { path: '/' });
    return { success: true };
  });

  // Get current user
  fastify.get('/me', async (request, reply) => {
    const sessionId = request.cookies.sessionId;
    if (!sessionId) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    const result = await db
      .select({
        id: sessions.id,
        expiresAt: sessions.expiresAt,
        userId: users.id,
        userEmail: users.email,
        userDisplayName: users.displayName,
        userCreatedAt: users.createdAt,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (result.length === 0 || !result[0].userId || result[0].expiresAt < new Date()) {
      return reply.code(401).send({ error: 'Session expired' });
    }

    return {
      user: {
        id: result[0].userId,
        email: result[0].userEmail,
        displayName: result[0].userDisplayName,
        createdAt: result[0].userCreatedAt,
      },
    };
  });
};