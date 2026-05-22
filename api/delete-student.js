import { requireCoach, readBody } from './_lib/auth.js';
import { getDb, schema } from '../src/db/index.js';
import { and, eq } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const auth = await requireCoach(req, res);
  if (!auth) return;

  const body = await readBody(req);
  const { id } = body;
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  const db = getDb();
  await db
    .delete(schema.students)
    .where(and(eq(schema.students.id, id), eq(schema.students.coachId, auth.coachId)));

  res.status(200).json({ ok: true });
}
