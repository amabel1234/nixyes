import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const payments = pgTable("payments", {
  id:         serial("id").primaryKey(),
  clerkId:    text("clerk_id").notNull(),
  name:       text("name").notNull(),
  phone:      text("phone").notNull(),
  amount:     integer("amount").notNull(),
  qrisRef:    text("qris_ref"),
  status:     text("status").notNull().default("pending"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, approvedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
