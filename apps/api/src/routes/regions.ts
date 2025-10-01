import { FastifyPluginAsync } from 'fastify';
import { db, users, sessions, symptomEntries, conditions } from '../db';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

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

type BodyRegion = 'HEAD' | 'NECK' | 'CHEST' | 'HEART' | 'LUNGS' | 'ABDOMEN' |
  'LOW_BACK' | 'UPPER_BACK' | 'LEFT_ARM' | 'RIGHT_ARM' |
  'LEFT_LEG' | 'RIGHT_LEG' | 'SKIN' | 'MENTAL_HEALTH' | 'OTHER';

const REGION_DISPLAY_NAMES: Record<BodyRegion, string> = {
  HEAD: 'Head',
  NECK: 'Neck',
  CHEST: 'Chest',
  HEART: 'Heart',
  LUNGS: 'Lungs',
  ABDOMEN: 'Abdomen',
  LOW_BACK: 'Lower Back',
  UPPER_BACK: 'Upper Back',
  LEFT_ARM: 'Left Arm',
  RIGHT_ARM: 'Right Arm',
  LEFT_LEG: 'Left Leg',
  RIGHT_LEG: 'Right Leg',
  SKIN: 'Skin',
  MENTAL_HEALTH: 'Mental Health',
  OTHER: 'Other',
};

const ALL_REGIONS: BodyRegion[] = [
  'HEAD', 'NECK', 'CHEST', 'HEART', 'LUNGS', 'ABDOMEN',
  'LOW_BACK', 'UPPER_BACK', 'LEFT_ARM', 'RIGHT_ARM',
  'LEFT_LEG', 'RIGHT_LEG', 'SKIN', 'MENTAL_HEALTH', 'OTHER'
];

export const regionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get summary of all regions with chronic conditions
  fastify.get('/summary', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    // Get active/chronic conditions per region
    const allConditions = await db
      .select({
        bodyRegion: conditions.bodyRegion,
        name: conditions.name,
        status: conditions.status,
      })
      .from(conditions)
      .where(eq(conditions.userId, user.id))
      .orderBy(desc(conditions.createdAt));

    const summary = ALL_REGIONS.map((region) => {
      const regionConditions = allConditions
        .filter((c) => c.bodyRegion === region)
        .map((c) => c.name);

      // Count is the number of chronic conditions in this region
      const count = regionConditions.length;

      return {
        region,
        displayName: REGION_DISPLAY_NAMES[region],
        count,
        conditions: regionConditions,
      };
    });

    return { regions: summary };
  });

  // Get detailed data for a specific region
  fastify.get('/:region', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { region } = request.params as { region: string };

    if (!ALL_REGIONS.includes(region as BodyRegion)) {
      return reply.code(400).send({ error: 'Invalid body region' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get symptoms for this region (last 30 days)
    const symptoms = await db
      .select()
      .from(symptomEntries)
      .where(
        and(
          eq(symptomEntries.userId, user.id),
          eq(symptomEntries.bodyRegion, region as any),
          gte(symptomEntries.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(symptomEntries.createdAt));

    // Get conditions for this region
    const conditionsList = await db
      .select()
      .from(conditions)
      .where(
        and(
          eq(conditions.userId, user.id),
          eq(conditions.bodyRegion, region as any)
        )
      )
      .orderBy(desc(conditions.createdAt));

    return {
      region,
      displayName: REGION_DISPLAY_NAMES[region as BodyRegion],
      symptoms,
      conditions: conditionsList,
    };
  });
};