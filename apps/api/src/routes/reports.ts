import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db, users, sessions, symptomEntries, conditions, medications, journalEntries, reports } from '../db';
import { eq, and, desc, gte, lte, isNull } from 'drizzle-orm';
import { s3Client } from '../lib/s3';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { chromium } from 'playwright';

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

const generateReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  heatmapImageKey: z.string().optional(),
});

interface ReportData {
  user: {
    displayName: string;
    email: string;
  };
  dateRange: {
    start: string;
    end: string;
  };
  heatmapImageUrl?: string;
  conditions: Array<{
    name: string;
    bodyRegion: string;
    onsetDate?: string;
  }>;
  symptoms: Array<{
    title: string;
    bodyRegion: string;
    severity?: number;
    date: string;
  }>;
  vitals: {
    bloodPressure: { latest?: string; average?: string };
    heartRate: { latest?: number; average?: number };
    temperature: { latest?: number; average?: number };
    spo2: { latest?: number; average?: number };
  };
  activities: Array<{
    type: string;
    date: string;
    distanceKm?: number;
    durationMin?: number;
  }>;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    photoUrl?: string;
  }>;
  journalNotes: Array<{
    date: string;
    text: string;
  }>;
}

async function aggregateReportData(
  userId: string,
  startDate: Date,
  endDate: Date,
  heatmapImageKey?: string
): Promise<ReportData> {
  // Get user
  const userResult = await db
    .select({ displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResult[0];

  // Get active conditions
  const conditionsList = await db
    .select({
      name: conditions.name,
      bodyRegion: conditions.bodyRegion,
      onsetDate: conditions.onsetDate,
    })
    .from(conditions)
    .where(and(eq(conditions.userId, userId), eq(conditions.status, 'ACTIVE')))
    .orderBy(desc(conditions.createdAt));

  // Get symptoms in date range
  const symptomsList = await db
    .select({
      title: symptomEntries.title,
      bodyRegion: symptomEntries.bodyRegion,
      severity: symptomEntries.severity,
      createdAt: symptomEntries.createdAt,
    })
    .from(symptomEntries)
    .where(
      and(
        eq(symptomEntries.userId, userId),
        gte(symptomEntries.createdAt, startDate),
        lte(symptomEntries.createdAt, endDate),
        eq(symptomEntries.category, 'SYMPTOM')
      )
    )
    .orderBy(desc(symptomEntries.createdAt));

  // Get vitals in date range
  const vitalsEntries = await db
    .select({ vitalsJson: symptomEntries.vitalsJson })
    .from(symptomEntries)
    .where(
      and(
        eq(symptomEntries.userId, userId),
        gte(symptomEntries.createdAt, startDate),
        lte(symptomEntries.createdAt, endDate),
        eq(symptomEntries.category, 'VITAL')
      )
    );

  // Aggregate vitals
  const bpValues: string[] = [];
  const hrValues: number[] = [];
  const tempValues: number[] = [];
  const spo2Values: number[] = [];

  vitalsEntries.forEach((entry) => {
    const vitals = entry.vitalsJson as any;
    if (vitals.bp) bpValues.push(vitals.bp);
    if (vitals.hr) hrValues.push(vitals.hr);
    if (vitals.tempC) tempValues.push(vitals.tempC);
    if (vitals.spo2) spo2Values.push(vitals.spo2);
  });

  const avgHr = hrValues.length > 0 ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : undefined;
  const avgTemp = tempValues.length > 0 ? (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(1) : undefined;
  const avgSpo2 = spo2Values.length > 0 ? Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length) : undefined;

  // Get activities in date range
  const activityEntries = await db
    .select({
      activityJson: symptomEntries.activityJson,
      createdAt: symptomEntries.createdAt,
    })
    .from(symptomEntries)
    .where(
      and(
        eq(symptomEntries.userId, userId),
        gte(symptomEntries.createdAt, startDate),
        lte(symptomEntries.createdAt, endDate),
        eq(symptomEntries.category, 'ACTIVITY')
      )
    )
    .orderBy(desc(symptomEntries.createdAt));

  const activities = activityEntries.map((entry) => {
    const activity = entry.activityJson as any;
    return {
      type: activity.type || 'Activity',
      date: entry.createdAt.toISOString(),
      distanceKm: activity.distanceKm,
      durationMin: activity.durationMin,
    };
  });

  // Get active medications
  const medicationsList = await db
    .select({
      name: medications.name,
      dosage: medications.dosage,
      frequency: medications.frequency,
      photoKey: medications.photoKey,
    })
    .from(medications)
    .where(and(eq(medications.userId, userId), isNull(medications.stoppedAt)))
    .orderBy(desc(medications.startedAt));

  // Get recent journal notes
  const journalNotesList = await db
    .select({
      rawText: journalEntries.rawText,
      createdAt: journalEntries.createdAt,
    })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.createdAt, startDate),
        lte(journalEntries.createdAt, endDate)
      )
    )
    .orderBy(desc(journalEntries.createdAt))
    .limit(3);

  // Get heatmap image URL if provided
  let heatmapImageUrl: string | undefined;
  if (heatmapImageKey) {
    heatmapImageUrl = `${config.s3Endpoint}/${config.s3Bucket}/${heatmapImageKey}`;
  }

  return {
    user: {
      displayName: user?.displayName || 'Unknown',
      email: user?.email || '',
    },
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    heatmapImageUrl,
    conditions: conditionsList.map((c) => ({
      name: c.name,
      bodyRegion: c.bodyRegion,
      onsetDate: c.onsetDate?.toISOString(),
    })),
    symptoms: symptomsList.map((s) => ({
      title: s.title,
      bodyRegion: s.bodyRegion,
      severity: s.severity || undefined,
      date: s.createdAt.toISOString(),
    })),
    vitals: {
      bloodPressure: {
        latest: bpValues[0],
        average: undefined, // BP is string, can't average
      },
      heartRate: {
        latest: hrValues[0],
        average: avgHr,
      },
      temperature: {
        latest: tempValues[0],
        average: avgTemp ? parseFloat(avgTemp) : undefined,
      },
      spo2: {
        latest: spo2Values[0],
        average: avgSpo2,
      },
    },
    activities,
    medications: medicationsList.map((m) => ({
      name: m.name,
      dosage: m.dosage || undefined,
      frequency: m.frequency || undefined,
      photoUrl: m.photoKey ? `${config.s3Endpoint}/${config.s3Bucket}/${m.photoKey}` : undefined,
    })),
    journalNotes: journalNotesList.map((j) => ({
      date: j.createdAt.toISOString(),
      text: j.rawText,
    })),
  };
}

function generateHTMLTemplate(data: ReportData): string {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatBodyRegion = (region: string) => {
    return region.replace(/_/g, ' ');
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #00A7A0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #00A7A0;
      margin-bottom: 10px;
    }
    .header-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .patient-name { font-size: 18px; font-weight: 600; }
    .date-range { color: #6b7280; font-size: 14px; }

    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #00A7A0;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }

    .heatmap-container {
      text-align: center;
      margin: 20px 0;
    }
    .heatmap-container img {
      max-width: 100%;
      height: auto;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
    }
    .card-title {
      font-weight: 600;
      margin-bottom: 10px;
      color: #374151;
    }
    .card-content {
      font-size: 14px;
      color: #6b7280;
    }

    .list-item {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .list-item:last-child { border-bottom: none; }
    .list-item-title {
      font-weight: 600;
      color: #1f2937;
    }
    .list-item-meta {
      font-size: 13px;
      color: #6b7280;
    }

    .medication-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .medication-photo {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .medication-details {
      flex: 1;
    }

    .note-item {
      background: #fef3c7;
      padding: 12px;
      border-left: 3px solid #f59e0b;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .note-date {
      font-size: 12px;
      color: #92400e;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .note-text {
      font-size: 14px;
      color: #78350f;
    }

    .vital-stat {
      margin-bottom: 8px;
    }
    .vital-label {
      font-weight: 600;
      color: #374151;
      font-size: 13px;
    }
    .vital-value {
      color: #00A7A0;
      font-size: 16px;
      font-weight: bold;
    }

    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Health Heatmap Tracker</div>
    <div class="header-info">
      <div class="patient-name">${data.user.displayName}</div>
      <div class="date-range">${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}</div>
    </div>
  </div>

  ${
    data.heatmapImageUrl
      ? `
  <div class="section">
    <div class="section-title">Body Symptom Map</div>
    <div class="heatmap-container">
      <img src="${data.heatmapImageUrl}" alt="Body Heatmap" />
    </div>
  </div>
  `
      : ''
  }

  <div class="section">
    <div class="section-title">Summary</div>
    <div class="grid">
      <div class="card">
        <div class="card-title">Active Conditions</div>
        <div class="card-content">
          ${
            data.conditions.length > 0
              ? data.conditions
                  .map(
                    (c) =>
                      `<div class="list-item">
                <div class="list-item-title">${c.name}</div>
                <div class="list-item-meta">${formatBodyRegion(c.bodyRegion)}</div>
              </div>`
                  )
                  .join('')
              : '<div style="color: #9ca3af; font-size: 13px;">No active conditions</div>'
          }
        </div>
      </div>

      <div class="card">
        <div class="card-title">Vitals Summary</div>
        <div class="card-content">
          ${
            data.vitals.bloodPressure.latest
              ? `<div class="vital-stat">
            <div class="vital-label">Blood Pressure</div>
            <div class="vital-value">${data.vitals.bloodPressure.latest}</div>
          </div>`
              : ''
          }
          ${
            data.vitals.heartRate.latest
              ? `<div class="vital-stat">
            <div class="vital-label">Heart Rate</div>
            <div class="vital-value">${data.vitals.heartRate.latest} bpm ${data.vitals.heartRate.average ? `(avg: ${data.vitals.heartRate.average})` : ''}</div>
          </div>`
              : ''
          }
          ${
            data.vitals.temperature.latest
              ? `<div class="vital-stat">
            <div class="vital-label">Temperature</div>
            <div class="vital-value">${data.vitals.temperature.latest}°C ${data.vitals.temperature.average ? `(avg: ${data.vitals.temperature.average})` : ''}</div>
          </div>`
              : ''
          }
          ${
            data.vitals.spo2.latest
              ? `<div class="vital-stat">
            <div class="vital-label">SpO2</div>
            <div class="vital-value">${data.vitals.spo2.latest}% ${data.vitals.spo2.average ? `(avg: ${data.vitals.spo2.average})` : ''}</div>
          </div>`
              : ''
          }
          ${!data.vitals.bloodPressure.latest && !data.vitals.heartRate.latest && !data.vitals.temperature.latest && !data.vitals.spo2.latest ? '<div style="color: #9ca3af; font-size: 13px;">No vitals recorded</div>' : ''}
        </div>
      </div>
    </div>
  </div>

  ${
    data.symptoms.length > 0
      ? `
  <div class="section">
    <div class="section-title">Recent Symptoms (${data.symptoms.length})</div>
    ${data.symptoms
      .slice(0, 10)
      .map(
        (s) =>
          `<div class="list-item">
        <div class="list-item-title">${s.title} ${s.severity ? `<span style="color: #f59e0b;">(${s.severity}/10)</span>` : ''}</div>
        <div class="list-item-meta">${formatBodyRegion(s.bodyRegion)} • ${formatDate(s.date)}</div>
      </div>`
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    data.activities.length > 0
      ? `
  <div class="section">
    <div class="section-title">Activities</div>
    ${data.activities
      .map(
        (a) =>
          `<div class="list-item">
        <div class="list-item-title">${a.type}</div>
        <div class="list-item-meta">
          ${a.distanceKm ? `${a.distanceKm}km` : ''}
          ${a.durationMin ? `${a.durationMin}min` : ''}
          • ${formatDate(a.date)}
        </div>
      </div>`
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    data.medications.length > 0
      ? `
  <div class="section">
    <div class="section-title">Current Medications</div>
    ${data.medications
      .map(
        (m) =>
          `<div class="medication-item">
        ${m.photoUrl ? `<img src="${m.photoUrl}" class="medication-photo" alt="${m.name}" />` : '<div style="width: 60px; height: 60px; background: #e5e7eb; border-radius: 6px;"></div>'}
        <div class="medication-details">
          <div class="list-item-title">${m.name}</div>
          <div class="list-item-meta">
            ${m.dosage || ''} ${m.frequency ? `• ${m.frequency}` : ''}
          </div>
        </div>
      </div>`
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    data.journalNotes.length > 0
      ? `
  <div class="section">
    <div class="section-title">Recent Journal Notes</div>
    ${data.journalNotes
      .map(
        (n) =>
          `<div class="note-item">
        <div class="note-date">${formatDate(n.date)}</div>
        <div class="note-text">${n.text}</div>
      </div>`
      )
      .join('')}
  </div>
  `
      : ''
  }
</body>
</html>
  `;
}

export const reportsRoutes: FastifyPluginAsync = async (fastify) => {
  // Generate report
  fastify.post('/generate', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = generateReportSchema.parse(request.body);

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    // Aggregate report data
    const reportData = await aggregateReportData(user.id, startDate, endDate, body.heatmapImageKey);

    // Generate HTML
    const html = generateHTMLTemplate(reportData);

    // Generate PDF using Playwright
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    // Upload PDF to S3
    const pdfKey = `reports/${user.id}/${Date.now()}.pdf`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: pdfKey,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      })
    );

    // Create Report record
    const [report] = await db.insert(reports).values({
      id: crypto.randomUUID(),
      userId: user.id,
      fromDate: startDate,
      toDate: endDate,
      pdfKey,
      updatedAt: new Date(),
    }).returning();

    // Generate download URL
    const downloadUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: config.s3Bucket,
        Key: pdfKey,
      }),
      { expiresIn: 3600 }
    );

    return {
      report: {
        id: report.id,
        fromDate: report.fromDate,
        toDate: report.toDate,
        downloadUrl,
      },
    };
  });

  // List reports
  fastify.get('/', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const reportsList = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, user.id))
      .orderBy(desc(reports.createdAt));

    // Generate download URLs for each report
    const reportsWithUrls = await Promise.all(
      reportsList.map(async (report) => {
        const downloadUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: config.s3Bucket,
            Key: report.pdfKey,
          }),
          { expiresIn: 3600 }
        );

        return {
          id: report.id,
          fromDate: report.fromDate,
          toDate: report.toDate,
          downloadUrl,
        };
      })
    );

    return { reports: reportsWithUrls };
  });

  // Delete report
  fastify.delete('/:id', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const existing = await db
      .select()
      .from(reports)
      .where(and(eq(reports.id, id), eq(reports.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return reply.code(404).send({ error: 'Report not found' });
    }

    const report = existing[0];

    // Delete from S3 (best-effort)
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.s3Bucket,
          Key: report.pdfKey,
        })
      );
    } catch (error) {
      fastify.log.error(`Failed to delete S3 object ${report.pdfKey}:`, error);
    }

    // Delete from database
    await db
      .delete(reports)
      .where(eq(reports.id, id));

    return { success: true };
  });
};