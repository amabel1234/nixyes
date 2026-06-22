import { Router } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, payments, users } from "@workspace/db";

const router = Router();

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

router.post("/", async (req, res) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const { name, phone, amount, qrisRef } = req.body;
  if (!name || !phone || !amount) {
    return res.status(400).json({ error: "name, phone, dan amount wajib diisi" });
  }

  const payment = await db
    .insert(payments)
    .values({ clerkId, name, phone: String(phone), amount: Number(amount), qrisRef: qrisRef ?? null })
    .returning()
    .then((r) => r[0]);

  await sendTelegramNotification(
    `💳 <b>Pembayaran Baru!</b>\n\n` +
    `👤 Nama: ${name}\n` +
    `📱 No HP: ${phone}\n` +
    `💰 Jumlah: Rp${Number(amount).toLocaleString("id-ID")}\n` +
    `🔖 Ref QRIS: ${qrisRef || "-"}\n` +
    `🆔 Payment ID: ${payment.id}\n\n` +
    `Ketik /approve_${payment.id} untuk menyetujui.`
  );

  return res.status(201).json(payment);
});

router.get("/my", async (req, res) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const result = await db.select().from(payments).where(eq(payments.clerkId, clerkId));
  return res.json(result);
});

export default router;
