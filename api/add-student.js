import { requireCoach, readBody } from './_lib/auth.js';
import { getDb, schema } from '../src/db/index.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const auth = await requireCoach(req, res);
  if (!auth) return;

  const body = await readBody(req);
  const { student, payment } = body;
  if (!student || !student.id || !student.name) {
    res.status(400).json({ error: 'student.id and student.name are required' });
    return;
  }

  const db = getDb();
  await db.insert(schema.students).values({
    id: student.id,
    coachId: auth.coachId,
    name: student.name,
    color: student.color,
    pack: student.pack,
    remaining: String(student.remaining ?? 0),
    used: String(student.used ?? 0),
    size: student.size ?? 0,
    lastNote: student.lastNote || '',
    focusNote: student.focusNote || '',
    balance: String(student.balance ?? 0),
    valuePer: student.valuePer ?? 80,
    joined: student.joined,
  });

  if (payment && payment.id) {
    await db.insert(schema.payments).values({
      id: payment.id,
      coachId: auth.coachId,
      studentId: student.id,
      date: payment.date,
      label: payment.label,
      amt: payment.amt ?? 0,
      method: payment.method,
    });
  }

  res.status(200).json({ ok: true });
}
