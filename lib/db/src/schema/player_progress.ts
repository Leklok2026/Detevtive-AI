import { pgTable, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playerProgressTable = pgTable("player_progress", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  caseId: integer("case_id").notNull(),
  isSolved: boolean("is_solved").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  solvedAt: timestamp("solved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlayerProgressSchema = createInsertSchema(playerProgressTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlayerProgress = z.infer<typeof insertPlayerProgressSchema>;
export type PlayerProgress = typeof playerProgressTable.$inferSelect;
