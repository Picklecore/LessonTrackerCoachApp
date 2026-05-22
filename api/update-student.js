import { requireCoach, readBody } from './_lib/auth.js';
import { getDb, schema } from '../src/db/index.js';
import { and, eq } from 'drizzle-orm';

const ALLOWED = new Set([
  'name',
  'color',
  'pack',
  'remaining',
  'used',
  'size',
  'lastNote',
  'focusNote',
  'balance',
  'valuePer',
  'joined',
]);

const NUMERIC = new Set(['remaining', 'used', 'balance']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const auth = await requireCoach(req, res);
  if (!auth) return;

  const body = await readBody(req);
  const { id, patch } = body;
  if (!id || !patch || typeof patch !== 'object') {
    res.status(400).json({ error: 'id and patch are required' });
    return;
  }

  const update = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(patch)) {
    if (!ALLOWED.has(k)) continue;
    update[k] = NUMERIC.has(k) ? String(v ?? 0) : v;
  }

  const db = getDb();
  await db
    .update(schema.students)
    .set(update)
    .where(and(eq(schema.students.id, id), eq(schema.students.coachId, auth.coachId)));

  res.status(200).json({ ok: true });
}
