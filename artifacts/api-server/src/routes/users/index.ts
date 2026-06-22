import { Router } from "express";
import { getAuth } from "@clerk/express";
import { eq, and } from "drizzle-orm";
import { db, users, messageCounts } from "@workspace/db";

const router = Router();

const FREE_DAILY_LIMIT = 20;

router.get("/me", async (req, res) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  let user = await db.select().from(users).where(eq(users.clerkId, clerkId)).then((r) => r[0]);
  if (!user) {
    const email = (auth as any)?.sessionClaims?.email ?? "";
    const name = (auth as any)?.sessionClaims?.name ?? null;
    const inserted = await db.insert(users).values({ clerkId, email, name }).returning();
    user = inserted[0];
  }

  const today = new Date().toISOString().slice(0, 10);
  const countRow = await db
    .select()
    .from(messageCounts)
    .where(and(eq(messageCounts.clerkId, clerkId), eq(messageCounts.date, today)))
    .then((r) => r[0]);

  const usedToday = countRow?.count ?? 0;
  const limit = user.isPremium ? null : FREE_DAILY_LIMIT;
  const remaining = user.isPremium ? null : Math.max(0, FREE_DAILY_LIMIT - usedToday);

  return res.json({ ...user, usedToday, limit, remaining });
});

export default router;
