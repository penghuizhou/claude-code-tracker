import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyStats } from "@/db/schema";
import { desc } from "drizzle-orm";
import { format, subDays, addDays, parseISO } from "date-fns";
import { ingestDate } from "@/lib/ingest";
import { DATE_FORMAT, MAX_DAYS_PER_RUN } from "@/lib/constants";

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the latest ingested date
    const latest = await db
      .select({ date: dailyStats.date })
      .from(dailyStats)
      .orderBy(desc(dailyStats.date))
      .limit(1);

    // Default to 3 days ago if no data exists
    const yesterday = format(subDays(new Date(), 1), DATE_FORMAT);
    let startDate: string;

    if (latest.length === 0) {
      startDate = format(subDays(new Date(), 3), DATE_FORMAT);
    } else {
      // Start from the day after the latest ingested date
      const nextDate = addDays(parseISO(latest[0].date), 1);
      startDate = format(nextDate, DATE_FORMAT);
    }

    // Collect dates to ingest (up to MAX_DAYS_PER_RUN, not beyond yesterday)
    const dates: string[] = [];
    let current = parseISO(startDate);
    const yesterdayDate = parseISO(yesterday);

    for (let i = 0; i < MAX_DAYS_PER_RUN && current <= yesterdayDate; i++) {
      dates.push(format(current, DATE_FORMAT));
      current = addDays(current, 1);
    }

    if (dates.length === 0) {
      return NextResponse.json({
        message: "Already up to date",
        latestDate: latest[0]?.date,
      });
    }

    // Ingest each date sequentially
    const results = [];
    for (const date of dates) {
      const result = await ingestDate(date);
      results.push({ date, ...result });
    }

    return NextResponse.json({
      message: `Ingested ${dates.length} day(s)`,
      results,
    });
  } catch (err) {
    console.error("Cron collect error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
