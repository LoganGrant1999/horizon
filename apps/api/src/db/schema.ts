import { pgTable, text, timestamp, integer, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const bodyRegionEnum = pgEnum('BodyRegion', [
  'HEAD', 'NECK', 'CHEST', 'HEART', 'LUNGS', 'ABDOMEN',
  'LOW_BACK', 'UPPER_BACK', 'LEFT_ARM', 'RIGHT_ARM',
  'LEFT_LEG', 'RIGHT_LEG', 'SKIN', 'MENTAL_HEALTH', 'OTHER'
]);

export const conditionStatusEnum = pgEnum('ConditionStatus', ['ACTIVE', 'RESOLVED']);
export const symptomCategoryEnum = pgEnum('SymptomCategory', ['SYMPTOM', 'VITAL', 'ACTIVITY', 'NOTE']);
export const parseStatusEnum = pgEnum('ParseStatus', ['PENDING', 'PARSED', 'ERROR']);

// Tables
export const users = pgTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash'),
  displayName: text('displayName'),
  googleId: text('googleId').unique(),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('User_email_key').on(table.email),
  googleIdIdx: uniqueIndex('User_googleId_key').on(table.googleId),
}));

export const sessions = pgTable('Session', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expiresAt', { precision: 3, mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('Session_userId_idx').on(table.userId),
}));

export const conditions = pgTable('Condition', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  bodyRegion: bodyRegionEnum('bodyRegion').notNull(),
  onsetDate: timestamp('onsetDate', { precision: 3, mode: 'date' }),
  status: conditionStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('Condition_userId_idx').on(table.userId),
  userIdStatusIdx: index('Condition_userId_status_idx').on(table.userId, table.status),
}));

export const symptomEntries = pgTable('SymptomEntry', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bodyRegion: bodyRegionEnum('bodyRegion').notNull(),
  title: text('title').notNull(),
  notes: text('notes'),
  severity: integer('severity'),
  startedAt: timestamp('startedAt', { precision: 3, mode: 'date' }),
  endedAt: timestamp('endedAt', { precision: 3, mode: 'date' }),
  tags: text('tags').array(),
  category: symptomCategoryEnum('category').notNull().default('SYMPTOM'),
  vitalsJson: jsonb('vitalsJson'),
  activityJson: jsonb('activityJson'),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('SymptomEntry_userId_idx').on(table.userId),
  userIdCreatedAtIdx: index('SymptomEntry_userId_createdAt_idx').on(table.userId, table.createdAt),
  userIdBodyRegionIdx: index('SymptomEntry_userId_bodyRegion_idx').on(table.userId, table.bodyRegion),
}));

export const journalEntries = pgTable('JournalEntry', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rawText: text('rawText').notNull(),
  parsedAt: timestamp('parsedAt', { precision: 3, mode: 'date' }),
  parseStatus: parseStatusEnum('parseStatus').notNull().default('PENDING'),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('JournalEntry_userId_idx').on(table.userId),
  userIdParseStatusIdx: index('JournalEntry_userId_parseStatus_idx').on(table.userId, table.parseStatus),
  userIdCreatedAtIdx: index('JournalEntry_userId_createdAt_idx').on(table.userId, table.createdAt),
}));

export const medications = pgTable('Medication', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  dosage: text('dosage'),
  frequency: text('frequency'),
  startedAt: timestamp('startedAt', { precision: 3, mode: 'date' }),
  stoppedAt: timestamp('stoppedAt', { precision: 3, mode: 'date' }),
  photoKey: text('photoKey'),
  notes: text('notes'),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('Medication_userId_idx').on(table.userId),
  userIdStartedAtIdx: index('Medication_userId_startedAt_idx').on(table.userId, table.startedAt),
}));

export const reports = pgTable('Report', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fromDate: timestamp('fromDate', { precision: 3, mode: 'date' }).notNull(),
  toDate: timestamp('toDate', { precision: 3, mode: 'date' }).notNull(),
  pdfKey: text('pdfKey').notNull(),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('Report_userId_idx').on(table.userId),
  userIdCreatedAtIdx: index('Report_userId_createdAt_idx').on(table.userId, table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  conditions: many(conditions),
  symptomEntries: many(symptomEntries),
  journalEntries: many(journalEntries),
  medications: many(medications),
  reports: many(reports),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const conditionsRelations = relations(conditions, ({ one }) => ({
  user: one(users, { fields: [conditions.userId], references: [users.id] }),
}));

export const symptomEntriesRelations = relations(symptomEntries, ({ one }) => ({
  user: one(users, { fields: [symptomEntries.userId], references: [users.id] }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, { fields: [journalEntries.userId], references: [users.id] }),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  user: one(users, { fields: [medications.userId], references: [users.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
}));