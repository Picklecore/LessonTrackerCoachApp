import { requireCoach } from './_lib/auth.js';
import { getDb, schema } from '../src/db/index.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const auth = await requireCoach(req, res);
  if (!auth) return;

  const db = getDb();
  const studentRows = await db
    .select()
    .from(schema.students)
    .where(eq(schema.students.coachId, auth.coachId))
    .orderBy(desc(schema.students.createdAt));
  const sessionRows = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.coachId, auth.coachId))
    .orderBy(desc(schema.sessions.createdAt));
  const paymentRows = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.coachId, auth.coachId))
    .orderBy(desc(schema.payments.createdAt));

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const deriveIso = (row) => {
    if (row.dateIso) return row.dateIso;
    const m = String(row.date || '').trim().match(/^([A-Za-z]{3})\s+(\d{1,2})$/);
    if (!m) return null;
    const mi = MONTHS.indexOf(m[1]);
    if (mi < 0) return null;
    const year = row.createdAt ? new Date(row.createdAt).getFullYear() : new Date().getFullYear();
    return `${year}-${String(mi + 1).padStart(2, '0')}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
  };

  const sessions = {};
  for (const s of sessionRows) {
    (sessions[s.studentId] ||= []).push({
      id: s.id,
      date: s.date,
      dateIso: deriveIso(s),
      dow: s.dow,
      dur: s.dur,
      time24: s.time24,
      focus: s.focus,
      note: s.note,
      amt: s.amt,
    });
  }
  // Keep each student's list sorted by actual lesson date (desc).
  for (const pid of Object.keys(sessions)) {
    sessions[pid].sort((a, b) => (b.dateIso || '').localeCompare(a.dateIso || ''));
  }
  const payments = {};
  for (const p of paymentRows) {
    (payments[p.studentId] ||= []).push({
      id: p.id,
      date: p.date,
      label: p.label,
      amt: p.amt,
      method: p.method,
    });
  }

  const students = studentRows.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    pack: s.pack,
    remaining: Number(s.remaining),
    used: Number(s.used),
    size: s.size,
    lastNote: s.lastNote || '',
    focusNote: s.focusNote || '',
    balance: Number(s.balance ?? 0),
    valuePer: s.valuePer,
    joined: s.joined,
  }));

  res.status(200).json({ students, sessions, payments });
}
