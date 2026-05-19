import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, casesTable, suspectsTable, playersTable, playerProgressTable, gameSettingsTable } from "@workspace/db";
import {
  AdminListCasesQueryParams,
  AdminCreateCaseBody,
  AdminUpdateCaseParams,
  AdminUpdateCaseBody,
  AdminDeleteCaseParams,
  AdminListPlayersQueryParams,
  AdminUpdatePlayerParams,
  AdminUpdatePlayerBody,
  AdminUpdateSettingsBody,
  AdminGetStatsQueryParams,
} from "@workspace/api-zod";

const ADMIN_KEY = "detective123";

function checkAdminKey(key: string | undefined, res: any): boolean {
  if (key !== ADMIN_KEY) {
    res.status(403).json({ error: "Invalid admin key" });
    return false;
  }
  return true;
}

function formatCase(c: typeof casesTable.$inferSelect) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    difficulty: c.difficulty,
    isPublished: c.isPublished,
    isPremium: c.isPremium,
    coverImage: c.coverImage,
    location: c.location,
    crimeType: c.crimeType,
    reward: c.reward,
    isSeasonal: c.isSeasonal,
    seasonName: c.seasonName ?? null,
    seasonColor: c.seasonColor ?? null,
    seasonEndDate: c.seasonEndDate ? c.seasonEndDate.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  };
}

const router: IRouter = Router();

router.get("/admin/cases", async (req, res): Promise<void> => {
  const parsed = AdminListCasesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!checkAdminKey(parsed.data.adminKey, res)) return;

  const cases = await db.select().from(casesTable).orderBy(casesTable.createdAt);
  res.json(cases.map(formatCase));
});

router.post("/admin/cases", async (req, res): Promise<void> => {
  const parsed = AdminCreateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!checkAdminKey(parsed.data.adminKey, res)) return;

  const [caseRow] = await db
    .insert(casesTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      difficulty: parsed.data.difficulty,
      isPremium: parsed.data.isPremium,
      isPublished: false,
      location: parsed.data.location,
      crimeType: parsed.data.crimeType,
      reward: parsed.data.reward,
      evidenceList: parsed.data.evidenceList ?? [],
      isSeasonal: parsed.data.isSeasonal ?? false,
      seasonName: parsed.data.seasonName ?? null,
      seasonColor: parsed.data.seasonColor ?? null,
      seasonEndDate: parsed.data.seasonEndDate ? new Date(parsed.data.seasonEndDate) : null,
    })
    .returning();

  res.status(201).json(formatCase(caseRow));
});

router.patch("/admin/cases/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminUpdateCaseParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!checkAdminKey(parsed.data.adminKey, res)) return;

  const updates: Record<string, any> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.difficulty !== undefined) updates.difficulty = parsed.data.difficulty;
  if (parsed.data.isPremium !== undefined) updates.isPremium = parsed.data.isPremium;
  if (parsed.data.isPublished !== undefined) updates.isPublished = parsed.data.isPublished;
  if (parsed.data.location !== undefined) updates.location = parsed.data.location;
  if (parsed.data.crimeType !== undefined) updates.crimeType = parsed.data.crimeType;
  if (parsed.data.reward !== undefined) updates.reward = parsed.data.reward;
  if (parsed.data.evidenceList !== undefined) updates.evidenceList = parsed.data.evidenceList;
  if (parsed.data.isSeasonal !== undefined) updates.isSeasonal = parsed.data.isSeasonal;
  if (parsed.data.seasonName !== undefined) updates.seasonName = parsed.data.seasonName;
  if (parsed.data.seasonColor !== undefined) updates.seasonColor = parsed.data.seasonColor;
  if (parsed.data.seasonEndDate !== undefined) {
    updates.seasonEndDate = parsed.data.seasonEndDate ? new Date(parsed.data.seasonEndDate) : null;
  }

  const [caseRow] = await db
    .update(casesTable)
    .set(updates)
    .where(eq(casesTable.id, params.data.id))
    .returning();

  if (!caseRow) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  res.json(formatCase(caseRow));
});

router.delete("/admin/cases/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminDeleteCaseParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const adminKey = req.query.adminKey as string;
  if (!checkAdminKey(adminKey, res)) return;

  await db.delete(suspectsTable).where(eq(suspectsTable.caseId, params.data.id));
  await db.delete(casesTable).where(eq(casesTable.id, params.data.id));

  res.sendStatus(204);
});

router.get("/admin/players", async (req, res): Promise<void> => {
  const parsed = AdminListPlayersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!checkAdminKey(parsed.data.adminKey, res)) return;

  const players = await db.select().from(playersTable).orderBy(playersTable.createdAt);

  res.json(
    players.map((p) => ({
      id: p.id,
      sessionId: p.sessionId,
      name: p.name,
      hasPaid: p.hasPaid,
      points: p.points,
      paymentExempt: p.paymentExempt,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.patch("/admin/players/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminUpdatePlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!checkAdminKey(parsed.data.adminKey, res)) return;

  const updates: Record<string, any> = {};
  if (parsed.data.hasPaid !== undefined) updates.hasPaid = parsed.data.hasPaid;
  if (parsed.data.paymentExempt !== undefined) updates.paymentExempt = parsed.data.paymentExempt;

  const [player] = await db
    .update(playersTable)
    .set(updates)
    .where(eq(playersTable.id, params.data.id))
    .returning();

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

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await db.select().from(gameSettingsTable).limit(1);

  if (settings.length === 0) {
    const [newSettings] = await db
      .insert(gameSettingsTable)
      .values({ paymentEnabled: true, paymentAmount: 499, freeTrialCases: 2 })
      .returning();
    res.json(newSettings);
    return;
  }

  res.json(settings[0]);
});

router.patch("/admin/settings", async (req, res): Promise<void> => {
  const parsed = AdminUpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!checkAdminKey(parsed.data.adminKey, res)) return;

  const updates: Record<string, any> = {};
  if (parsed.data.paymentEnabled !== undefined) updates.paymentEnabled = parsed.data.paymentEnabled;
  if (parsed.data.paymentAmount !== undefined) updates.paymentAmount = parsed.data.paymentAmount;
  if (parsed.data.freeTrialCases !== undefined) updates.freeTrialCases = parsed.data.freeTrialCases;

  const existing = await db.select().from(gameSettingsTable).limit(1);

  let settings;
  if (existing.length === 0) {
    [settings] = await db
      .insert(gameSettingsTable)
      .values({ paymentEnabled: true, paymentAmount: 499, freeTrialCases: 2, ...updates })
      .returning();
  } else {
    [settings] = await db
      .update(gameSettingsTable)
      .set(updates)
      .where(eq(gameSettingsTable.id, existing[0].id))
      .returning();
  }

  res.json(settings);
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  const parsed = AdminGetStatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!checkAdminKey(parsed.data.adminKey, res)) return;

  const players = await db.select().from(playersTable);
  const cases = await db.select().from(casesTable);
  const progress = await db.select().from(playerProgressTable);

  res.json({
    totalPlayers: players.length,
    totalCases: cases.length,
    publishedCases: cases.filter((c) => c.isPublished).length,
    totalSolvedCases: progress.filter((p) => p.isSolved).length,
    paidPlayers: players.filter((p) => p.hasPaid).length,
  });
});

export default router;
