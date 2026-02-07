import { db } from "./db";
import { dailyStats, weeklyStats, ingestionLog } from "@/db/schema";
import { queryCommitStats } from "./github-search";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { and, gte, lte, sql } from "drizzle-orm";
import { DATE_FORMAT } from "./constants";

export async function ingestDate(dateStr: string): Promise<{
  status: "success" | "error";
  stats?: { totalCommits: number; claudeCommits: number; allAiCommits: number };
  error?: string;
  durationMs: number;
}> {
  const start = Date.now();

  try {
    const stats = await queryCommitStats(dateStr);
    const claudePct =
      stats.totalCommits > 0
        ? (stats.claudeCommits / stats.totalCommits) * 100
        : 0;
    const allAiPct =
      stats.totalCommits > 0
        ? (stats.allAiCommits / stats.totalCommits) * 100
        : 0;

    const row = {
      date: stats.date,
      totalCommits: stats.totalCommits,
      claudeCommits: stats.claudeCommits,
      opusCommits: stats.opusCommits,
      sonnetCommits: stats.sonnetCommits,
      haikuCommits: stats.haikuCommits,
      otherModelCommits: stats.otherModelCommits,
      claudePercentage: claudePct,
      copilotCommits: stats.copilotCommits,
      cursorCommits: stats.cursorCommits,
      geminiCommits: stats.geminiCommits,
      devinCommits: stats.devinCommits,
      claudeCodeGenerated: stats.claudeCodeGenerated,
      devinBotCommits: stats.devinBotCommits,
      dependabotCommits: stats.dependabotCommits,
      renovateCommits: stats.renovateCommits,
      copilotReviews: stats.copilotReviews,
      coderabbitReviews: stats.coderabbitReviews,
      sourceryReviews: stats.sourceryReviews,
      claudeCodePRs: stats.claudeCodePRs,
      copilotPRs: stats.copilotPRs,
      cursorPRs: stats.cursorPRs,
      devinPRs: stats.devinPRs,
      allAiCommits: stats.allAiCommits,
      allAiPercentage: allAiPct,
      allAiReviews: stats.allAiReviews,
      allAiPRs: stats.allAiPRs,
    };

    await db
      .insert(dailyStats)
      .values(row)
      .onConflictDoUpdate({
        target: dailyStats.date,
        set: {
          ...row,
          createdAt: new Date().toISOString(),
        },
      });

    await updateWeeklyRollup(dateStr);

    const durationMs = Date.now() - start;
    await db.insert(ingestionLog).values({
      date: dateStr,
      status: "success",
      totalCommits: stats.totalCommits,
      claudeCommits: stats.claudeCommits,
      durationMs,
    });

    return {
      status: "success",
      stats: {
        totalCommits: stats.totalCommits,
        claudeCommits: stats.claudeCommits,
        allAiCommits: stats.allAiCommits,
      },
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);

    await db.insert(ingestionLog).values({
      date: dateStr,
      status: "error",
      error: errorMsg,
      durationMs,
    });

    return { status: "error", error: errorMsg, durationMs };
  }
}

// All numeric columns to sum in weekly rollup
const SUMMED_COLUMNS = [
  "totalCommits",
  "claudeCommits",
  "opusCommits",
  "sonnetCommits",
  "haikuCommits",
  "otherModelCommits",
  "copilotCommits",
  "cursorCommits",
  "geminiCommits",
  "devinCommits",
  "claudeCodeGenerated",
  "devinBotCommits",
  "dependabotCommits",
  "renovateCommits",
  "copilotReviews",
  "coderabbitReviews",
  "sourceryReviews",
  "claudeCodePRs",
  "copilotPRs",
  "cursorPRs",
  "devinPRs",
  "allAiCommits",
  "allAiReviews",
  "allAiPRs",
] as const;

async function updateWeeklyRollup(dateStr: string): Promise<void> {
  const date = new Date(dateStr + "T00:00:00Z");
  const weekStartDate = startOfWeek(date, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(date, { weekStartsOn: 1 });

  const weekStartStr = format(weekStartDate, DATE_FORMAT);
  const weekEndStr = format(weekEndDate, DATE_FORMAT);

  // Build select object dynamically for all summed columns
  const selectObj: Record<string, ReturnType<typeof sql>> = {};
  for (const col of SUMMED_COLUMNS) {
    selectObj[col] = sql<number>`COALESCE(SUM(${sql.identifier(col)}), 0)`;
  }

  const result = await db
    .select(selectObj)
    .from(dailyStats)
    .where(
      and(gte(dailyStats.date, weekStartStr), lte(dailyStats.date, weekEndStr))
    );

  const r = result[0];
  const totalCommits = Number(r.totalCommits);
  const claudeCommits = Number(r.claudeCommits);
  const allAiCommits = Number(r.allAiCommits);
  const claudePct =
    totalCommits > 0 ? (claudeCommits / totalCommits) * 100 : 0;
  const allAiPct =
    totalCommits > 0 ? (allAiCommits / totalCommits) * 100 : 0;

  const weeklyRow = {
    weekStart: weekStartStr,
    totalCommits,
    claudeCommits,
    opusCommits: Number(r.opusCommits),
    sonnetCommits: Number(r.sonnetCommits),
    haikuCommits: Number(r.haikuCommits),
    otherModelCommits: Number(r.otherModelCommits),
    claudePercentage: claudePct,
    copilotCommits: Number(r.copilotCommits),
    cursorCommits: Number(r.cursorCommits),
    geminiCommits: Number(r.geminiCommits),
    devinCommits: Number(r.devinCommits),
    claudeCodeGenerated: Number(r.claudeCodeGenerated),
    devinBotCommits: Number(r.devinBotCommits),
    dependabotCommits: Number(r.dependabotCommits),
    renovateCommits: Number(r.renovateCommits),
    copilotReviews: Number(r.copilotReviews),
    coderabbitReviews: Number(r.coderabbitReviews),
    sourceryReviews: Number(r.sourceryReviews),
    claudeCodePRs: Number(r.claudeCodePRs),
    copilotPRs: Number(r.copilotPRs),
    cursorPRs: Number(r.cursorPRs),
    devinPRs: Number(r.devinPRs),
    allAiCommits,
    allAiPercentage: allAiPct,
    allAiReviews: Number(r.allAiReviews),
    allAiPRs: Number(r.allAiPRs),
  };

  await db
    .insert(weeklyStats)
    .values(weeklyRow)
    .onConflictDoUpdate({
      target: weeklyStats.weekStart,
      set: {
        ...weeklyRow,
        createdAt: new Date().toISOString(),
      },
    });
}
