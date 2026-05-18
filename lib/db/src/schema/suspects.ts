import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const suspectsTable = pgTable("suspects", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  backstory: text("backstory").notNull(),
  photoUrl: text("photo_url"),
  isGuilty: boolean("is_guilty").notNull().default(false),
  deceptionLevel: integer("deception_level").notNull().default(5),
  personality: text("personality").notNull().default("calm"),
  secretInfo: text("secret_info").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSuspectSchema = createInsertSchema(suspectsTable).omit({ id: true, createdAt: true });
export type InsertSuspect = z.infer<typeof insertSuspectSchema>;
export type Suspect = typeof suspectsTable.$inferSelect;
