import { Router } from "express";
import { getAuth } from "@clerk/express";
import { eq, desc } from "drizzle-orm";
import { db, payments, users } from "@workspace/db";

const router = Router();

const ADMIN_CLERK_IDS = (process.env.ADMIN_CLERK_IDS ?? "").split(",").filter(Boolean);

function requireAdmin(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId || ADMIN_CLERK_IDS.length === 0 || !ADMIN_CLERK_IDS.includes(clerkId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

async function sendTelegramNotification(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (_) {}
}

router.get("/payments", requireAdmin, async (req, res) => {
  const result = await db.select().from(payments).orderBy(desc(payments.createdAt));
  return res.json(result);
});

router.post("/payments/:id/approve", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const payment = await db.select().from(payments).where(eq(payments.id, id)).then((r) => r[0]);
  if (!payment) return res.status(404).json({ error: "Tidak ditemukan" });

  const updated = await db
    .update(payments)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(payments.id, id))
    .returning()
    .then((r) => r[0]);

  await db
    .update(users)
    .set({ isPremium: true, premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
    .where(eq(users.clerkId, payment.clerkId));

  await sendTelegramNotification(
    `✅ <b>Pembayaran Disetujui!</b>\n\n` +
    `👤 ${payment.name} | ID: ${id}\n` +
    `💰 Rp${Number(payment.amount).toLocaleString("id-ID")}\n` +
    `🌟 Akun telah diupgrade ke Premium 30 hari.`
  );

  return res.json(updated);
});

router.post("/payments/:id/reject", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const updated = await db
    .update(payments)
    .set({ status: "rejected" })
    .where(eq(payments.id, id))
    .returning()
    .then((r) => r[0]);

  if (!updated) return res.status(404).json({ error: "Tidak ditemukan" });
  return res.json(updated);
});

router.get("/users", requireAdmin, async (req, res) => {
  const result = await db.select().from(users).orderBy(desc(users.createdAt));
  return res.json(result);
});

export default router;
