import { NextRequest, NextResponse } from "next/server";
import { format, eachDayOfInterval, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ingestDateFast } from "@/lib/ingest";
import { queryMonthSignals } from "@/lib/github-search";
import { DATE_FORMAT } from "@/lib/constants";

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

    const startDate = parseISO(from);
    const endDate = parseISO(to);

    const dates = eachDayOfInterval({ start: startDate, end: endDate })
      .map((d) => format(d, DATE_FORMAT));

    if (dates.length > 60) {
      return NextResponse.json(
        { error: "Maximum 60 days per fast backfill request" },
        { status: 400 }
      );
    }

    // Determine month range for signal checking
    const monthStart = format(startOfMonth(startDate), DATE_FORMAT);
    const monthEnd = format(endOfMonth(endDate), DATE_FORMAT);
    const monthRange = `${monthStart}..${monthEnd}`;

    console.log(`[fast-backfill] Checking signals for ${monthRange}...`);
    const activeSignals = await queryMonthSignals(monthRange);
    console.log(`[fast-backfill] Active signals: ${activeSignals.size}/20 — ${Array.from(activeSignals).join(", ")}`);

    const results = [];
    for (const d of dates) {
      const result = await ingestDateFast(d, activeSignals);
      results.push({ date: d, ...result });
    }

    return NextResponse.json({
      message: `Fast backfilled ${dates.length} day(s) with ${activeSignals.size} active signals`,
      activeSignals: Array.from(activeSignals),
      results,
    });
  } catch (err) {
    console.error("Fast backfill error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
