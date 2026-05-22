import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const coaches = pgTable('coaches', {
  id: text('id').primaryKey(),
  email: text('email'),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const students = pgTable(
  'students',
  {
    id: text('id').primaryKey(),
    coachId: text('coach_id')
      .notNull()
      .references(() => coaches.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    pack: text('pack'),
    remaining: numeric('remaining', { precision: 10, scale: 2 }).notNull().default('0'),
    used: numeric('used', { precision: 10, scale: 2 }).notNull().default('0'),
    size: integer('size').notNull().default(0),
    lastNote: text('last_note').default(''),
    focusNote: text('focus_note').default(''),
    balance: numeric('balance', { precision: 10, scale: 2 }).default('0'),
    valuePer: integer('value_per').default(80),
    joined: text('joined'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byCoach: index('students_coach_idx').on(t.coachId),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    coachId: text('coach_id')
      .notNull()
      .references(() => coaches.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    dateIso: text('date_iso'),
    dow: text('dow'),
    dur: integer('dur'),
    time24: text('time24'),
    focus: text('focus').default(''),
    note: text('note').default(''),
    amt: integer('amt').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byCoachStudent: index('sessions_coach_student_idx').on(t.coachId, t.studentId),
  }),
);

export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    coachId: text('coach_id')
      .notNull()
      .references(() => coaches.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    label: text('label'),
    amt: integer('amt').default(0),
    method: text('method'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byCoachStudent: index('payments_coach_student_idx').on(t.coachId, t.studentId),
  }),
);
