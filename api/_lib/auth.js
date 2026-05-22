import { verifyToken, createClerkClient } from '@clerk/backend';
import { getDb, schema } from '../../src/db/index.js';
import { eq } from 'drizzle-orm';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function requireCoach(req, res) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing auth token' });
    return null;
  }
  const token = auth.slice('Bearer '.length);
  let claims;
  try {
    claims = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
  const userId = claims.sub;
  if (!userId) {
    res.status(401).json({ error: 'No subject in token' });
    return null;
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(schema.coaches)
    .where(eq(schema.coaches.id, userId))
    .limit(1);

  if (existing.length === 0) {
    let email = null;
    let name = null;
    try {
      const user = await clerk.users.getUser(userId);
      email = user.emailAddresses?.[0]?.emailAddress || null;
      name = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
    } catch {
      // proceed without profile data
    }
    await db
      .insert(schema.coaches)
      .values({ id: userId, email, name })
      .onConflictDoNothing();
  }

  return { coachId: userId };
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      resolve(req.body);
      return;
    }
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}
