import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const users = pgTable("users", {
  id:           serial("id").primaryKey(),
  clerkId:      text("clerk_id").notNull().unique(),
  email:        text("email").notNull().default(""),
  name:         text("name"),
  isPremium:    boolean("is_premium").notNull().default(false),
  premiumUntil: timestamp("premium_until"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
