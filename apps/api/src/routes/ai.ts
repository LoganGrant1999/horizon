import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db, users, sessions, journalEntries, symptomEntries, symptoms, conditions, medications, vitals } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { getOpenAI, analyzeSymptoms, generateHealthReport } from '../lib/openai';

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

const parseRequestSchema = z.object({
  journalEntryId: z.string(),
});

const SYSTEM_PROMPT = `You are a health data extraction assistant. Your ONLY job is to extract structured health information from user journal entries.

CRITICAL RULES:
1. NEVER provide medical diagnoses, advice, or interpretations
2. NEVER suggest treatments or medications
3. ONLY extract objective data that the user has explicitly stated
4. If uncertain, omit the field rather than guessing

Extract the following information into a JSON array of objects:

For each distinct piece of health information, create an object with:
- category: "SYMPTOM" | "VITAL" | "ACTIVITY" | "NOTE"
- title: Brief description (e.g., "Headache", "Blood pressure reading", "Morning run")
- bodyRegion: One of: HEAD, NECK, CHEST, HEART, LUNGS, ABDOMEN, LOW_BACK, UPPER_BACK, LEFT_ARM, RIGHT_ARM, LEFT_LEG, RIGHT_LEG, SKIN, OTHER
- severity: (optional) 1-10 scale if mentioned
- vitalsJson: (optional) Object with fields like: { bp: "120/80", hr: 72, tempC: 37.2, spo2: 98 }
- activityJson: (optional) Object with fields like: { type: "running", distanceKm: 5, durationMin: 30, perceivedExertion: 7 }
- tags: (optional) Array of relevant keywords

Body region mapping guidelines:
- Headache, migraine, dizziness → HEAD
- Chest pain, chest tightness → CHEST
- Heart palpitations, irregular heartbeat → HEART
- Shortness of breath, breathing difficulty → LUNGS
- Stomach pain, nausea → ABDOMEN
- Rash, itching → SKIN
- General fatigue, mood → OTHER

Return ONLY a valid JSON array. If no health data is found, return an empty array [].`;

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Parse journal entry
  fastify.post('/parse', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = parseRequestSchema.parse(request.body);

    // Find the journal entry
    const entryResult = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, body.journalEntryId), eq(journalEntries.userId, user.id)))
      .limit(1);

    if (entryResult.length === 0) {
      return reply.code(404).send({ error: 'Journal entry not found' });
    }

    const entry = entryResult[0];

    if (entry.parseStatus === 'PARSED') {
      return { message: 'Already parsed', entry };
    }

    try {
      // Call OpenAI to parse the text
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: entry.rawText },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '{"items": []}';
      let parsedData: any;

      try {
        parsedData = JSON.parse(responseText);
      } catch {
        // If JSON parsing fails, try to extract array from response
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          parsedData = { items: JSON.parse(arrayMatch[0]) };
        } else {
          parsedData = { items: [] };
        }
      }

      // Handle both array and object responses
      const items = Array.isArray(parsedData) ? parsedData : (parsedData.items || []);

      const BODY_REGIONS = ['HEAD', 'NECK', 'CHEST', 'HEART', 'LUNGS', 'ABDOMEN',
        'LOW_BACK', 'UPPER_BACK', 'LEFT_ARM', 'RIGHT_ARM',
        'LEFT_LEG', 'RIGHT_LEG', 'SKIN', 'OTHER'];
      const SYMPTOM_CATEGORIES = ['SYMPTOM', 'VITAL', 'ACTIVITY', 'NOTE'];

      // Create SymptomEntry rows for each extracted item
      const createdSymptoms = await db.insert(symptomEntries).values(
        items.map((item: any) => {
          // Validate and normalize the extracted data
          const category = SYMPTOM_CATEGORIES.includes(item.category)
            ? item.category
            : 'SYMPTOM';

          const bodyRegion = BODY_REGIONS.includes(item.bodyRegion)
            ? item.bodyRegion
            : 'OTHER';

          return {
            id: crypto.randomUUID(),
            userId: user.id,
            title: item.title || 'Untitled',
            bodyRegion: bodyRegion as any,
            category: category as any,
            severity: item.severity || null,
            tags: item.tags || [],
            vitalsJson: item.vitalsJson || null,
            activityJson: item.activityJson || null,
            notes: null,
            startedAt: entry.createdAt,
            updatedAt: new Date(),
          };
        })
      ).returning();

      // Update journal entry status
      const [updatedEntry] = await db
        .update(journalEntries)
        .set({
          parseStatus: 'PARSED',
          parsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(journalEntries.id, entry.id))
        .returning();

      return {
        entry: updatedEntry,
        symptoms: createdSymptoms,
      };
    } catch (error: any) {
      fastify.log.error('AI parsing failed:', error);

      // Update entry to show error
      await db
        .update(journalEntries)
        .set({ parseStatus: 'ERROR', updatedAt: new Date() })
        .where(eq(journalEntries.id, entry.id));

      return reply.code(500).send({
        error: 'AI parsing failed',
        message: error.message || 'Unknown error',
      });
    }
  });

  // Analyze symptoms
  fastify.post('/analyze-symptoms', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    try {
      // Get recent symptoms
      const recentSymptoms = await db
        .select()
        .from(symptoms)
        .where(eq(symptoms.userId, user.id))
        .orderBy(desc(symptoms.startedAt))
        .limit(20);

      if (recentSymptoms.length === 0) {
        return reply.code(400).send({ error: 'No symptoms found to analyze' });
      }

      const insights = await analyzeSymptoms(recentSymptoms);

      return { insights };
    } catch (error: any) {
      fastify.log.error('Symptom analysis failed:', error);
      return reply.code(500).send({
        error: 'Symptom analysis failed',
        message: error.message || 'Unknown error',
      });
    }
  });

  // Generate health report
  fastify.post('/generate-report', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    try {
      // Gather all health data
      const [symptomsData, conditionsData, medicationsData, vitalsData] = await Promise.all([
        db.select().from(symptoms).where(eq(symptoms.userId, user.id)).orderBy(desc(symptoms.startedAt)).limit(30),
        db.select().from(conditions).where(eq(conditions.userId, user.id)),
        db.select().from(medications).where(eq(medications.userId, user.id)),
        db.select().from(vitals).where(eq(vitals.userId, user.id)).orderBy(desc(vitals.recordedAt)).limit(10),
      ]);

      const report = await generateHealthReport({
        symptoms: symptomsData,
        conditions: conditionsData,
        medications: medicationsData,
        vitals: vitalsData,
      });

      return { report };
    } catch (error: any) {
      fastify.log.error('Report generation failed:', error);
      return reply.code(500).send({
        error: 'Report generation failed',
        message: error.message || 'Unknown error',
      });
    }
  });

  // Custom AI report endpoint
  fastify.post('/report', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = z.object({
      text: z.string().min(1),
      instruction: z.string().min(1),
    }).parse(request.body);

    try {
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful medical assistant. Help users understand medical information in simple terms. Always remind users that this is not medical advice and they should consult their healthcare provider for medical guidance.`,
          },
          {
            role: 'user',
            content: `${body.instruction}\n\nText: ${body.text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const result = completion.choices[0]?.message?.content || '';

      return { result };
    } catch (error: any) {
      fastify.log.error('Custom AI report failed:', error);
      return reply.code(500).send({
        error: 'Report generation failed',
        message: error.message || 'Unknown error',
      });
    }
  });
};