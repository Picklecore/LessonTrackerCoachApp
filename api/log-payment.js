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
  const { payment, studentId, packSize, valuePer, pack } = body;
  if (!payment || !payment.id || !studentId) {
    res.status(400).json({ error: 'payment.id and studentId required' });
    return;
  }
  const size = Number(packSize ?? 0);

  const db = getDb();
  await db.insert(schema.payments).values({
    id: payment.id,
    coachId: auth.coachId,
    studentId,
    date: payment.date,
    label: payment.label,
    amt: payment.amt ?? 0,
    method: payment.method,
  });

  const update = {
    remaining: sql`${schema.students.remaining} + ${size}`,
    size: sql`${schema.students.size} + ${size}`,
    updatedAt: new Date(),
  };
  if (pack) update.pack = pack;
  if (valuePer) update.valuePer = valuePer;

  await db
    .update(schema.students)
    .set(update)
    .where(
      and(eq(schema.students.id, studentId), eq(schema.students.coachId, auth.coachId)),
    );

  res.status(200).json({ ok: true });
}
