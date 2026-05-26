import { requireCoach, readBody } from './_lib/auth.js';
import { getDb, schema } from '../src/db/index.js';
import { and, eq, sql } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const auth = await requireCoach(req, res);
  if (!auth) return;

  const body = await readBody(req);
  const { session, hours } = body;
  if (!session || !session.id || !session.studentId) {
    res.status(400).json({ error: 'session.id and session.studentId required' });
    return;
  }
  const hr = Number(hours ?? (session.dur ?? 60) / 60);

  const db = getDb();
  await db.insert(schema.sessions).values({
    id: session.id,
    coachId: auth.coachId,
    studentId: session.studentId,
    date: session.date,
    dateIso: session.dateIso ?? null,
    dow: session.dow,
    dur: session.dur,
    time24: session.time24,
    focus: session.focus || '',
    note: session.note || '',
    amt: session.amt ?? 0,
  });

  await db
    .update(schema.students)
    .set({
      remaining: sql`${schema.students.remaining} - ${hr}`,
      used: sql`${schema.students.used} + ${hr}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.students.id, session.studentId),
        eq(schema.students.coachId, auth.coachId),
      ),
    );

  res.status(200).json({ ok: true });
}
