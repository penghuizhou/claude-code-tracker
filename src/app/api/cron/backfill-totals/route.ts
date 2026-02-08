import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyStats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 300;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function queryTotalCommits(date: string): Promise<number> {
  const resp = await fetch(
    `https://api.github.com/search/commits?q=committer-date:${date}&per_page=1`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.cloak-preview+json",
      },
    }
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  return data.total_count ?? 0;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { from, to, overrides } = body as {
      from?: string;
      to?: string;
      overrides?: Record<string, number>;
    };

    // Manual override mode: directly set totalCommits for specific dates
    if (overrides) {
      const results = [];
      for (const [date, totalCommits] of Object.entries(overrides)) {
        const existing = await db
          .select()
          .from(dailyStats)
          .where(eq(dailyStats.date, date))
          .limit(1);
        if (existing.length > 0) {
          const row = existing[0];
          const claudePct = totalCommits > 0 ? (row.claudeCommits / totalCommits) * 100 : 0;
          const allAiPct = totalCommits > 0 ? (row.allAiCommits / totalCommits) * 100 : 0;
          await db.update(dailyStats).set({
            totalCommits, claudePercentage: claudePct, allAiPercentage: allAiPct,
            createdAt: new Date().toISOString(),
          }).where(eq(dailyStats.date, date));
          results.push({ date, status: "updated", oldTotal: row.totalCommits, newTotal: totalCommits });
        }
      }
      return NextResponse.json({ message: `Updated ${results.length} overrides`, results });
    }

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Provide "from" and "to" parameters' },
        { status: 400 }
      );
    }

    const results = [];
    const startMs = Date.now();
    let current = new Date(from + "T00:00:00Z");
    const end = new Date(to + "T00:00:00Z");

    while (current <= end) {
      const date = current.toISOString().slice(0, 10);
      const dateStartMs = Date.now();

      try {
        const totalCommits = await queryTotalCommits(date);

        // Fetch existing row to recalculate percentages
        const existing = await db
          .select()
          .from(dailyStats)
          .where(eq(dailyStats.date, date))
          .limit(1);

        if (existing.length > 0) {
          const row = existing[0];
          const claudePct =
            totalCommits > 0
              ? (row.claudeCommits / totalCommits) * 100
              : 0;
          const allAiPct =
            totalCommits > 0
              ? (row.allAiCommits / totalCommits) * 100
              : 0;

          await db
            .update(dailyStats)
            .set({
              totalCommits,
              claudePercentage: claudePct,
              allAiPercentage: allAiPct,
              createdAt: new Date().toISOString(),
            })
            .where(eq(dailyStats.date, date));

          results.push({
            date,
            status: "updated",
            oldTotal: row.totalCommits,
            newTotal: totalCommits,
            durationMs: Date.now() - dateStartMs,
          });
        } else {
          results.push({ date, status: "skipped_no_row" });
        }
      } catch (err) {
        results.push({
          date,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // Rate limit: 30 req/min → 2.1s between requests
      await new Promise((r) => setTimeout(r, 2100));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return NextResponse.json({
      message: `Updated ${results.filter((r) => r.status === "updated").length} days`,
      durationMs: Date.now() - startMs,
      results,
    });
  } catch (err) {
    console.error("Backfill totals error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
