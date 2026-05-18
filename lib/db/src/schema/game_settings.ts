import { pgTable, serial, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameSettingsTable = pgTable("game_settings", {
  id: serial("id").primaryKey(),
  paymentEnabled: boolean("payment_enabled").notNull().default(true),
  paymentAmount: integer("payment_amount").notNull().default(499),
  freeTrialCases: integer("free_trial_cases").notNull().default(2),
});

export const insertGameSettingsSchema = createInsertSchema(gameSettingsTable).omit({ id: true });
export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;
export type GameSettings = typeof gameSettingsTable.$inferSelect;
