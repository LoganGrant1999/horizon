import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db, users, sessions, conditions, symptomEntries, medications, journalEntries, reports } from '../db';
import { eq, sql } from 'drizzle-orm';

const completeOnboardingSchema = z.object({
  importDemo: z.boolean(),
  conditions: z.array(
    z.object({
      name: z.string(),
      bodyRegion: z.string(),
      onsetDate: z.string().optional(),
    })
  ),
  medicalHistory: z.string(),
  medications: z.array(
    z.object({
      name: z.string(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      startedAt: z.string().optional(),
      stoppedAt: z.string().optional(),
      photoKey: z.string().optional(),
    })
  ),
});

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
  'LEFT_LEG' | 'RIGHT_LEG' | 'SKIN' | 'OTHER';

// Demo data to import
const DEMO_CONDITIONS = [
  {
    name: 'Atrial Fibrillation',
    description:
      'Irregular and often rapid heart rhythm that can increase risk of stroke and heart failure.',
    bodyRegion: 'HEART' as const,
    onsetDate: new Date('2022-03-15'),
  },
  {
    name: 'Chronic Migraine',
    description: 'Recurring severe headaches with sensitivity to light and sound.',
    bodyRegion: 'HEAD' as const,
    onsetDate: new Date('2018-06-01'),
  },
];

const DEMO_SYMPTOM_ENTRIES = [
  {
    bodyRegion: 'HEART' as const,
    title: 'Heart palpitations during exercise',
    notes: 'Noticed irregular heartbeat while on treadmill, lasted about 15 minutes.',
    severity: 6,
    startedAt: new Date('2025-09-28T14:30:00Z'),
    endedAt: new Date('2025-09-28T14:45:00Z'),
    tags: ['exercise', 'palpitations', 'cardio'],
  },
  {
    bodyRegion: 'HEAD' as const,
    title: 'Severe migraine with aura',
    notes:
      'Started with visual aura (zigzag lines), followed by throbbing pain on left side. Took medication and rested in dark room.',
    severity: 9,
    startedAt: new Date('2025-09-27T09:00:00Z'),
    endedAt: new Date('2025-09-27T15:30:00Z'),
    tags: ['migraine', 'aura', 'severe', 'photophobia'],
  },
];

const DEMO_MEDICATIONS = [
  {
    name: 'Apixaban (Eliquis)',
    dosage: '5mg',
    frequency: 'Twice daily',
    startedAt: new Date('2022-03-20'),
    notes: 'Blood thinner for AFib. Take with food.',
  },
  {
    name: 'Sumatriptan',
    dosage: '100mg',
    frequency: 'As needed',
    startedAt: new Date('2020-01-10'),
    notes: 'For acute migraine attacks. Maximum 2 doses per 24 hours.',
  },
];

const DEMO_JOURNAL_ENTRIES = [
  {
    rawText: 'My blood pressure was 128/82 this morning. Heart rate was 72 bpm. Feeling good overall.',
    parseStatus: 'PARSED' as const,
  },
  {
    rawText: 'Went for a 30-minute walk today, about 2 miles. No chest discomfort or palpitations.',
    parseStatus: 'PARSED' as const,
  },
  {
    rawText: 'Mild headache this afternoon, severity about 4/10. Took ibuprofen and it helped.',
    parseStatus: 'PARSED' as const,
  },
  {
    rawText: 'BP reading: 130/84, HR: 76. Took my AFib medication as prescribed.',
    parseStatus: 'PARSED' as const,
  },
  {
    rawText: 'Running 3 miles this morning. Felt great! No irregular heartbeat. Duration: 28 minutes.',
    parseStatus: 'PARSED' as const,
  },
  {
    rawText: 'General check-in: Medications taken on time. No symptoms today. Sleep was good (7 hours).',
    parseStatus: 'PARSED' as const,
  },
];

const DEMO_PARSED_VITALS = [
  {
    bodyRegion: 'OTHER' as const,
    title: 'Blood Pressure Reading',
    category: 'VITAL' as const,
    vitalsJson: { bp: '128/82', hr: 72 },
    startedAt: new Date('2025-09-28T08:00:00Z'),
  },
  {
    bodyRegion: 'OTHER' as const,
    title: 'Blood Pressure Reading',
    category: 'VITAL' as const,
    vitalsJson: { bp: '130/84', hr: 76 },
    startedAt: new Date('2025-09-27T08:00:00Z'),
  },
  {
    bodyRegion: 'OTHER' as const,
    title: 'Blood Pressure Reading',
    category: 'VITAL' as const,
    vitalsJson: { bp: '125/80', hr: 70 },
    startedAt: new Date('2025-09-26T08:00:00Z'),
  },
];

const DEMO_ACTIVITIES = [
  {
    bodyRegion: 'OTHER' as const,
    title: 'Morning Walk',
    category: 'ACTIVITY' as const,
    activityJson: { type: 'Walking', distanceKm: 3.2, durationMin: 30 },
    startedAt: new Date('2025-09-28T07:00:00Z'),
  },
  {
    bodyRegion: 'OTHER' as const,
    title: 'Running',
    category: 'ACTIVITY' as const,
    activityJson: { type: 'Running', distanceKm: 4.8, durationMin: 28, perceivedExertion: 7 },
    startedAt: new Date('2025-09-26T07:00:00Z'),
  },
];

export const onboardingRoutes: FastifyPluginAsync = async (fastify) => {
  // Check onboarding status
  fastify.get('/status', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    // Check if user has completed onboarding by looking for conditions or medications
    const [conditionsCountResult, medicationsCountResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(conditions).where(eq(conditions.userId, user.id)),
      db.select({ count: sql<number>`count(*)::int` }).from(medications).where(eq(medications.userId, user.id)),
    ]);

    const conditionsCount = conditionsCountResult[0]?.count || 0;
    const medicationsCount = medicationsCountResult[0]?.count || 0;
    const needsOnboarding = conditionsCount === 0 && medicationsCount === 0;

    return { needsOnboarding };
  });

  // Skip onboarding - minimal profile
  fastify.post('/skip', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    // Create a placeholder condition so onboarding status check passes
    await db.insert(conditions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      name: 'General Health Tracking',
      description: 'Initial profile created',
      bodyRegion: 'OTHER',
      status: 'ACTIVE',
      updatedAt: new Date(),
    });

    return { success: true };
  });

  // Complete onboarding
  fastify.post('/complete', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = completeOnboardingSchema.parse(request.body);

    // Create conditions
    if (body.importDemo) {
      // Import demo conditions
      await db.insert(conditions).values(
        DEMO_CONDITIONS.map((condition) => ({
          id: crypto.randomUUID(),
          userId: user.id,
          ...condition,
          status: 'ACTIVE' as const,
          updatedAt: new Date(),
        }))
      );

      // Import demo symptom entries
      await db.insert(symptomEntries).values(
        DEMO_SYMPTOM_ENTRIES.map((entry) => ({
          id: crypto.randomUUID(),
          userId: user.id,
          ...entry,
          category: 'SYMPTOM' as const,
          updatedAt: new Date(),
        }))
      );

      // Import demo medications
      await db.insert(medications).values(
        DEMO_MEDICATIONS.map((med) => ({
          id: crypto.randomUUID(),
          userId: user.id,
          ...med,
          updatedAt: new Date(),
        }))
      );

      // Import demo journal entries
      const journalEntriesData = await db.insert(journalEntries).values(
        DEMO_JOURNAL_ENTRIES.map((entry) => ({
          id: crypto.randomUUID(),
          userId: user.id,
          ...entry,
          parsedAt: new Date(),
          updatedAt: new Date(),
        }))
      ).returning();

      // Import demo parsed vitals (link to journal entries)
      await db.insert(symptomEntries).values(
        DEMO_PARSED_VITALS.map((vital, index) => ({
          id: crypto.randomUUID(),
          userId: user.id,
          ...vital,
          updatedAt: new Date(),
        }))
      );

      // Import demo activities (link to journal entries)
      await db.insert(symptomEntries).values(
        DEMO_ACTIVITIES.map((activity, index) => ({
          id: crypto.randomUUID(),
          userId: user.id,
          ...activity,
          updatedAt: new Date(),
        }))
      );

      // Generate a sample report
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      await db.insert(reports).values({
        id: crypto.randomUUID(),
        userId: user.id,
        fromDate: startDate,
        toDate: endDate,
        pdfKey: 'demo/sample-report.pdf', // Placeholder - will be regenerated on first actual generation
        updatedAt: new Date(),
      });

      fastify.log.info(`Demo data imported for user ${user.id}`);
    } else {
      // Create user-provided conditions
      if (body.conditions.length > 0) {
        await db.insert(conditions).values(
          body.conditions.map((condition) => ({
            id: crypto.randomUUID(),
            userId: user.id,
            name: condition.name,
            bodyRegion: condition.bodyRegion as any,
            onsetDate: condition.onsetDate ? new Date(condition.onsetDate) : null,
            status: 'ACTIVE' as const,
            updatedAt: new Date(),
          }))
        );
      }

      // Create medications
      if (body.medications.length > 0) {
        const validMedications = body.medications.filter((med) => med.name.trim());
        if (validMedications.length > 0) {
          await db.insert(medications).values(
            validMedications.map((med) => ({
              id: crypto.randomUUID(),
              userId: user.id,
              name: med.name,
              dosage: med.dosage || null,
              frequency: med.frequency || null,
              startedAt: med.startedAt ? new Date(med.startedAt) : null,
              stoppedAt: med.stoppedAt ? new Date(med.stoppedAt) : null,
              photoKey: med.photoKey || null,
              updatedAt: new Date(),
            }))
          );
        }
      }
    }

    // Create medical history journal entry if provided
    if (body.medicalHistory.trim()) {
      await db.insert(journalEntries).values({
        id: crypto.randomUUID(),
        userId: user.id,
        rawText: body.medicalHistory,
        parseStatus: 'PENDING',
        updatedAt: new Date(),
      });
    }

    return { success: true };
  });
};