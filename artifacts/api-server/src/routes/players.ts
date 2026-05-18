import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playersTable, playerProgressTable } from "@workspace/db";
import {
  CreatePlayerBody,
  GetPlayerQueryParams,
  GetPlayerProgressQueryParams,
  PurchaseCaseBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/player", async (req, res): Promise<void> => {
  const parsed = GetPlayerQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.sessionId, parsed.data.sessionId));

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.json({
    id: player.id,
    sessionId: player.sessionId,
    name: player.name,
    hasPaid: player.hasPaid,
    points: player.points,
    paymentExempt: player.paymentExempt,
    createdAt: player.createdAt.toISOString(),
  });
});

router.post("/player", async (req, res): Promise<void> => {
  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.sessionId, parsed.data.sessionId));

  if (existing.length > 0) {
    const player = existing[0];
    res.json({
      id: player.id,
      sessionId: player.sessionId,
      name: player.name,
      hasPaid: player.hasPaid,
      points: player.points,
      paymentExempt: player.paymentExempt,
      createdAt: player.createdAt.toISOString(),
    });
    return;
  }

  const [player] = await db
    .insert(playersTable)
    .values({
      sessionId: parsed.data.sessionId,
      name: parsed.data.name,
      hasPaid: false,
      points: 0,
      paymentExempt: false,
    })
    .returning();

  res.json({
    id: player.id,
    sessionId: player.sessionId,
    name: player.name,
    hasPaid: player.hasPaid,
    points: player.points,
    paymentExempt: player.paymentExempt,
    createdAt: player.createdAt.toISOString(),
  });
});

router.get("/player/progress", async (req, res): Promise<void> => {
  const parsed = GetPlayerProgressQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.sessionId, parsed.data.sessionId));

  if (!player) {
    res.json([]);
    return;
  }

  const progress = await db
    .select()
    .from(playerProgressTable)
    .where(eq(playerProgressTable.playerId, player.id));

  res.json(
    progress.map((p) => ({
      id: p.id,
      playerId: p.playerId,
      caseId: p.caseId,
      isSolved: p.isSolved,
      attempts: p.attempts,
      solvedAt: p.solvedAt ? p.solvedAt.toISOString() : null,
    }))
  );
});

router.post("/purchase", async (req, res): Promise<void> => {
  const parsed = PurchaseCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.sessionId, parsed.data.sessionId));

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  await db
    .update(playersTable)
    .set({ hasPaid: true })
    .where(eq(playersTable.id, player.id));

  res.json({ success: true, message: "Payment successful! All premium cases unlocked." });
});

export default router;
