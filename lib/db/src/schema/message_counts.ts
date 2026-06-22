import { pgTable, serial, text, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messageCounts = pgTable("message_counts", {
  id:      serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull(),
  date:    text("date").notNull(),
  count:   integer("count").notNull().default(0),
});

export const insertMessageCountSchema = createInsertSchema(messageCounts).omit({ id: true });
export type InsertMessageCount = z.infer<typeof insertMessageCountSchema>;
export type MessageCount = typeof messageCounts.$inferSelect;
