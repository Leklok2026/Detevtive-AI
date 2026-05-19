import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, casesTable, suspectsTable } from "@workspace/db";
import {
  GetCaseParams,
  ListSuspectsParams,
  GetSuspectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

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

router.get("/cases", async (req, res): Promise<void> => {
  const cases = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.isPublished, true))
    .orderBy(casesTable.difficulty);

  res.json(cases.map(formatCase));
});

router.get("/cases/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCaseParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [caseRow] = await db
    .select()
    .from(casesTable)
    .where(and(eq(casesTable.id, params.data.id), eq(casesTable.isPublished, true)));

  if (!caseRow) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  const suspects = await db
    .select()
    .from(suspectsTable)
    .where(eq(suspectsTable.caseId, params.data.id));

  res.json({
    ...formatCase(caseRow),
    evidenceList: caseRow.evidenceList,
    suspects: suspects.map((s) => ({
      id: s.id,
      caseId: s.caseId,
      name: s.name,
      role: s.role,
      backstory: s.backstory,
      photoUrl: s.photoUrl,
      isGuilty: s.isGuilty,
      deceptionLevel: s.deceptionLevel,
      personality: s.personality,
    })),
  });
});

router.get("/cases/:caseId/suspects", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
  const params = ListSuspectsParams.safeParse({ caseId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const suspects = await db
    .select()
    .from(suspectsTable)
    .where(eq(suspectsTable.caseId, params.data.caseId));

  res.json(
    suspects.map((s) => ({
      id: s.id,
      caseId: s.caseId,
      name: s.name,
      role: s.role,
      backstory: s.backstory,
      photoUrl: s.photoUrl,
      isGuilty: s.isGuilty,
      deceptionLevel: s.deceptionLevel,
      personality: s.personality,
    }))
  );
});

router.get("/suspects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSuspectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [suspect] = await db
    .select()
    .from(suspectsTable)
    .where(eq(suspectsTable.id, params.data.id));

  if (!suspect) {
    res.status(404).json({ error: "Suspect not found" });
    return;
  }

  res.json({
    id: suspect.id,
    caseId: suspect.caseId,
    name: suspect.name,
    role: suspect.role,
    backstory: suspect.backstory,
    photoUrl: suspect.photoUrl,
    isGuilty: suspect.isGuilty,
    deceptionLevel: suspect.deceptionLevel,
    personality: suspect.personality,
  });
});

export default router;
