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
  const { id, studentId, packSize } = body;
  if (!id || !studentId) {
    res.status(400).json({ error: 'id and studentId required' });
    return;
  }
  const size = Number(packSize ?? 0);

  const db = getDb();
  await db
    .delete(schema.payments)
    .where(and(eq(schema.payments.id, id), eq(schema.payments.coachId, auth.coachId)));

  if (size > 0) {
    await db
      .update(schema.students)
      .set({
        remaining: sql`GREATEST(0, ${schema.students.remaining} - ${size})`,
        size: sql`GREATEST(0, ${schema.students.size} - ${size})`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(schema.students.id, studentId), eq(schema.students.coachId, auth.coachId)),
      );
  }

  res.status(200).json({ ok: true });
}
