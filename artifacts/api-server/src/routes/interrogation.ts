import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, suspectsTable, casesTable, playersTable, playerProgressTable } from "@workspace/db";
import { InterrogateSuspectBody, SubmitGuessBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/interrogate", async (req, res): Promise<void> => {
  const parsed = InterrogateSuspectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [suspect] = await db
    .select()
    .from(suspectsTable)
    .where(eq(suspectsTable.id, parsed.data.suspectId));

  if (!suspect) {
    res.status(404).json({ error: "Suspect not found" });
    return;
  }

  const [caseRow] = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.id, parsed.data.caseId));

  const moods = ["calm", "nervous", "angry", "defensive", "crying"];
  const moodIndex = Math.min(
    Math.floor((parsed.data.history?.length ?? 0) / 3),
    moods.length - 1
  );
  const currentMood = suspect.isGuilty
    ? moods[Math.min(moodIndex + 1, moods.length - 1)]
    : "calm";

  const systemPrompt = `You are ${suspect.name}, a ${suspect.role} being interrogated by a detective.

Background: ${suspect.backstory}
Secret information: ${suspect.secretInfo}
Personality: ${suspect.personality}
Are you guilty: ${suspect.isGuilty ? "YES - you committed the crime but will NOT admit it" : "NO - you are innocent"}
Deception level: ${suspect.deceptionLevel}/10 (higher = more evasive and manipulative)
Crime being investigated: ${caseRow?.crimeType ?? "unknown"} in ${caseRow?.location ?? "unknown location"}
Your current emotional state: ${currentMood}

IMPORTANT RULES:
- NEVER directly admit guilt even if guilty
- If guilty: deflect, redirect suspicion to others, provide partial truths, act ${currentMood}
- If innocent: answer more honestly but may still hide personal secrets unrelated to the crime
- Keep responses to 2-4 sentences, conversational
- Stay in character at all times
- Respond in Arabic if the detective's message is in Arabic, otherwise respond in English
- Your responses should reflect your personality and emotional state
- Do NOT break character or mention you are an AI`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...(parsed.data.history ?? []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: parsed.data.message },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 300,
    messages,
  });

  const response = completion.choices[0]?.message?.content ?? "...";

  res.json({
    response,
    suspectMood: currentMood,
  });
});

router.post("/guess", async (req, res): Promise<void> => {
  const parsed = SubmitGuessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [suspect] = await db
    .select()
    .from(suspectsTable)
    .where(eq(suspectsTable.id, parsed.data.suspectId));

  if (!suspect) {
    res.status(404).json({ error: "Suspect not found" });
    return;
  }

  const [caseRow] = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.id, parsed.data.caseId));

  const correct = suspect.isGuilty;

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.sessionId, parsed.data.sessionId));

  if (player) {
    const existing = await db
      .select()
      .from(playerProgressTable)
      .where(
        eq(playerProgressTable.playerId, player.id)
      );

    const caseProgress = existing.find((p) => p.caseId === parsed.data.caseId);

    if (caseProgress) {
      await db
        .update(playerProgressTable)
        .set({
          attempts: caseProgress.attempts + 1,
          isSolved: correct || caseProgress.isSolved,
          solvedAt: correct && !caseProgress.isSolved ? new Date() : caseProgress.solvedAt,
        })
        .where(eq(playerProgressTable.id, caseProgress.id));
    } else {
      await db.insert(playerProgressTable).values({
        playerId: player.id,
        caseId: parsed.data.caseId,
        isSolved: correct,
        attempts: 1,
        solvedAt: correct ? new Date() : null,
      });
    }

    if (correct) {
      await db
        .update(playersTable)
        .set({ points: player.points + (caseRow?.reward ?? 100) })
        .where(eq(playersTable.id, player.id));
    }
  }

  res.json({
    correct,
    message: correct
      ? `Excellent work, Detective! You have correctly identified the culprit.`
      : `That suspect is innocent. Keep investigating — the real criminal is still out there.`,
    pointsEarned: correct ? (caseRow?.reward ?? 100) : 0,
  });
});

export default router;
