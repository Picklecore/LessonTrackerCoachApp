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
  const { id, studentId, hours } = body;
  if (!id || !studentId) {
    res.status(400).json({ error: 'id and studentId required' });
    return;
  }
  const hr = Number(hours ?? 0);

  const db = getDb();
  await db
    .delete(schema.sessions)
    .where(and(eq(schema.sessions.id, id), eq(schema.sessions.coachId, auth.coachId)));

  if (hr > 0) {
    await db
      .update(schema.students)
      .set({
        remaining: sql`${schema.students.remaining} + ${hr}`,
        used: sql`${schema.students.used} - ${hr}`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(schema.students.id, studentId), eq(schema.students.coachId, auth.coachId)),
      );
  }

  res.status(200).json({ ok: true });
}
