import { NextRequest, NextResponse } from "next/server";
import { queryDateRange, type BQDayStats } from "@/lib/bigquery";
import { db } from "@/lib/db";
import { dailyStats, ingestionLog } from "@/db/schema";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { from, to } = body as { from?: string; to?: string };

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Provide "from" and "to" parameters' },
        { status: 400 }
      );
    }

    const startMs = Date.now();

    // Single BigQuery query returns all days in range with all signals
    const days = await queryDateRange(from, to);

    // Store each day
    const results = [];
    for (const day of days) {
      const claudePct =
        day.totalCommits > 0
          ? (day.claudeCommits / day.totalCommits) * 100
          : 0;
      const allAiCommits =
        day.claudeCommits + day.copilotCommits + day.cursorCommits +
        day.geminiCommits + day.devinCommits;
      const allAiPct =
        day.totalCommits > 0
          ? (allAiCommits / day.totalCommits) * 100
          : 0;

      const row = {
        date: day.date,
        totalCommits: day.totalCommits,
        claudeCommits: day.claudeCommits,
        opusCommits: day.opusCommits,
        sonnetCommits: day.sonnetCommits,
        haikuCommits: day.haikuCommits,
        otherModelCommits: day.otherModelCommits,
        claudePercentage: claudePct,
        copilotCommits: day.copilotCommits,
        cursorCommits: day.cursorCommits,
        geminiCommits: day.geminiCommits,
        devinCommits: day.devinCommits,
        claudeCodeGenerated: day.claudeCodeGenerated,
        devinBotCommits: day.devinBotCommits,
        dependabotCommits: day.dependabotCommits,
        renovateCommits: day.renovateCommits,
        // BigQuery doesn't have issue/PR data — set to 0
        copilotReviews: 0,
        coderabbitReviews: 0,
        sourceryReviews: 0,
        claudeCodePRs: 0,
        copilotPRs: 0,
        cursorPRs: 0,
        devinPRs: 0,
        allAiCommits,
        allAiPercentage: allAiPct,
        allAiReviews: 0,
        allAiPRs: 0,
      };

      await db
        .insert(dailyStats)
        .values(row)
        .onConflictDoUpdate({
          target: dailyStats.date,
          set: { ...row, createdAt: new Date().toISOString() },
        });

      results.push({
        date: day.date,
        status: "success",
        totalCommits: day.totalCommits,
        claudeCommits: day.claudeCommits,
        allAiCommits,
        copilotCommits: day.copilotCommits,
        dependabotCommits: day.dependabotCommits,
      });
    }

    const totalMs = Date.now() - startMs;

    // Log
    await db.insert(ingestionLog).values({
      date: `${from}_to_${to}`,
      status: "success",
      totalCommits: days.reduce((s, d) => s + d.totalCommits, 0),
      claudeCommits: days.reduce((s, d) => s + d.claudeCommits, 0),
      durationMs: totalMs,
    });

    return NextResponse.json({
      message: `BigQuery backfilled ${days.length} days in ${(totalMs / 1000).toFixed(1)}s`,
      durationMs: totalMs,
      days: days.length,
      results,
    });
  } catch (err) {
    console.error("BigQuery backfill error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
