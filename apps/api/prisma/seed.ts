import { PrismaClient, BodyRegion, ConditionStatus, SymptomCategory } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@healthheatmap.com' },
    update: {},
    create: {
      email: 'demo@healthheatmap.com',
      passwordHash: hashedPassword,
      displayName: 'Demo User',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create conditions
  const afibCondition = await prisma.condition.create({
    data: {
      userId: demoUser.id,
      name: 'Atrial Fibrillation',
      description:
        'Irregular and often rapid heart rhythm that can increase risk of stroke and heart failure.',
      bodyRegion: BodyRegion.HEART,
      onsetDate: new Date('2022-03-15'),
      status: ConditionStatus.ACTIVE,
    },
  });

  const migraineCondition = await prisma.condition.create({
    data: {
      userId: demoUser.id,
      name: 'Chronic Migraine',
      description: 'Recurring severe headaches with sensitivity to light and sound.',
      bodyRegion: BodyRegion.HEAD,
      onsetDate: new Date('2018-06-01'),
      status: ConditionStatus.ACTIVE,
    },
  });

  console.log('✅ Created conditions:', [afibCondition.name, migraineCondition.name]);

  // Create symptom entries
  const symptomEntries = await prisma.symptomEntry.createMany({
    data: [
      {
        userId: demoUser.id,
        bodyRegion: BodyRegion.HEART,
        title: 'Heart palpitations during exercise',
        notes: 'Noticed irregular heartbeat while on treadmill, lasted about 15 minutes.',
        severity: 6,
        startedAt: new Date('2025-09-28T14:30:00Z'),
        endedAt: new Date('2025-09-28T14:45:00Z'),
        tags: ['exercise', 'palpitations', 'cardio'],
        category: SymptomCategory.SYMPTOM,
      },
      {
        userId: demoUser.id,
        bodyRegion: BodyRegion.HEAD,
        title: 'Severe migraine with aura',
        notes:
          'Started with visual aura (zigzag lines), followed by throbbing pain on left side. Took medication and rested in dark room.',
        severity: 9,
        startedAt: new Date('2025-09-27T09:00:00Z'),
        endedAt: new Date('2025-09-27T15:30:00Z'),
        tags: ['migraine', 'aura', 'severe', 'photophobia'],
        category: SymptomCategory.SYMPTOM,
      },
      {
        userId: demoUser.id,
        bodyRegion: BodyRegion.HEART,
        title: 'Blood pressure reading',
        notes: 'Morning BP check',
        severity: null,
        startedAt: new Date('2025-09-29T08:00:00Z'),
        tags: ['vitals', 'blood-pressure'],
        category: SymptomCategory.VITAL,
        vitalsJson: {
          systolic: 128,
          diastolic: 82,
          heartRate: 72,
          unit: 'mmHg',
        },
      },
      {
        userId: demoUser.id,
        bodyRegion: BodyRegion.OTHER,
        title: 'Morning walk',
        notes: '30 minute walk in neighborhood',
        severity: null,
        startedAt: new Date('2025-09-29T07:00:00Z'),
        endedAt: new Date('2025-09-29T07:30:00Z'),
        tags: ['exercise', 'walking', 'cardio'],
        category: SymptomCategory.ACTIVITY,
        activityJson: {
          type: 'walking',
          duration: 30,
          distance: 2.1,
          unit: 'miles',
        },
      },
    ],
  });

  console.log('✅ Created symptom entries:', symptomEntries.count);

  // Create medications
  const medications = await prisma.medication.createMany({
    data: [
      {
        userId: demoUser.id,
        name: 'Apixaban (Eliquis)',
        dosage: '5mg',
        frequency: 'Twice daily',
        startedAt: new Date('2022-03-20'),
        notes: 'Blood thinner for AFib. Take with food.',
      },
      {
        userId: demoUser.id,
        name: 'Sumatriptan',
        dosage: '100mg',
        frequency: 'As needed',
        startedAt: new Date('2020-01-10'),
        notes: 'For acute migraine attacks. Maximum 2 doses per 24 hours.',
      },
      {
        userId: demoUser.id,
        name: 'Topiramate',
        dosage: '50mg',
        frequency: 'Daily at bedtime',
        startedAt: new Date('2021-05-15'),
        notes: 'Preventive medication for migraines.',
      },
    ],
  });

  console.log('✅ Created medications:', medications.count);

  // Create a journal entry
  const journalEntry = await prisma.journalEntry.create({
    data: {
      userId: demoUser.id,
      rawText:
        "Woke up with a mild headache around 8am. Took my morning meds with breakfast. Went for a 30 minute walk - felt good but noticed my heart rate was a bit elevated. Rested for a bit. Headache got worse around 2pm, took Sumatriptan. Much better by evening. Overall energy level was good today, about 7/10. Need to remember to stay hydrated tomorrow.",
    },
  });

  console.log('✅ Created journal entry');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });