import { BigQuery } from "@google-cloud/bigquery";

let bigqueryClient: BigQuery | null = null;

function getClient(): BigQuery {
  if (bigqueryClient) return bigqueryClient;

  const serviceAccountKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.GCP_PROJECT_ID;

  if (serviceAccountKey) {
    const credentials = JSON.parse(serviceAccountKey);
    bigqueryClient = new BigQuery({
      projectId: projectId || credentials.project_id,
      credentials,
    });
  } else {
    bigqueryClient = new BigQuery({ projectId });
  }

  return bigqueryClient;
}

export interface BQDayStats {
  date: string;
  totalCommits: number;
  claudeCommits: number;
  opusCommits: number;
  sonnetCommits: number;
  haikuCommits: number;
  otherModelCommits: number;
  copilotCommits: number;
  cursorCommits: number;
  geminiCommits: number;
  devinCommits: number;
  claudeCodeGenerated: number;
  devinBotCommits: number;
  dependabotCommits: number;
  renovateCommits: number;
}

/**
 * Query GH Archive via BigQuery for ALL commit signals across a date range.
 * Returns per-day breakdown. A single query scans the entire range.
 * Works for dates where GH Archive still has commit messages (before ~Oct 2025).
 *
 * Cost: ~10-30 GB per month scanned, well within free tier (1 TB/month).
 */
export async function queryDateRange(
  fromDate: string,
  toDate: string
): Promise<BQDayStats[]> {
  const client = getClient();

  // Build table wildcard: githubarchive.day.2024*
  // For a range like 2024-06-01 to 2024-08-31, we use _TABLE_SUFFIX filtering
  const fromSuffix = fromDate.replace(/-/g, "");
  const toSuffix = toDate.replace(/-/g, "");

  // Use the githubarchive.month tables for efficiency (one table per month)
  // Format: githubarchive.month.YYYYMM
  // Fall back to day tables for partial months
  const fromYear = fromDate.substring(0, 4);
  const fromMonth = fromDate.substring(5, 7);
  const toYear = toDate.substring(0, 4);
  const toMonth = toDate.substring(5, 7);

  // Build list of month table references
  const monthTables: string[] = [];
  let y = parseInt(fromYear), m = parseInt(fromMonth);
  const ey = parseInt(toYear), em = parseInt(toMonth);
  while (y < ey || (y === ey && m <= em)) {
    monthTables.push(`githubarchive.month.${y}${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }

  // Build UNION ALL of month tables
  const unionParts = monthTables.map(t =>
    `SELECT created_at, type, payload FROM \`${t}\` WHERE type = 'PushEvent'`
  ).join("\n    UNION ALL\n    ");

  const query = `
    WITH events AS (
      ${unionParts}
    ),
    commits AS (
      SELECT
        SUBSTR(CAST(created_at AS STRING), 1, 10) AS day_str,
        JSON_EXTRACT_SCALAR(commit_json, '$.message') AS message,
        JSON_EXTRACT_SCALAR(commit_json, '$.author.name') AS author_name
      FROM
        events,
        UNNEST(JSON_EXTRACT_ARRAY(payload, '$.commits')) AS commit_json
      WHERE
        SUBSTR(CAST(created_at AS STRING), 1, 10) BETWEEN '${fromDate}' AND '${toDate}'
    )
    SELECT
      day_str AS date,
      COUNT(*) AS total_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'(?i)co-authored-by:\\s*claude.*<.*@anthropic\\.com>')) AS claude_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'(?i)co-authored-by:\\s*claude\\s+(opus|code.*opus).*<.*@anthropic\\.com>')) AS opus_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'(?i)co-authored-by:\\s*claude\\s+(sonnet|code.*sonnet).*<.*@anthropic\\.com>')) AS sonnet_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'(?i)co-authored-by:\\s*claude\\s+(haiku|code.*haiku).*<.*@anthropic\\.com>')) AS haiku_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'(?i)co-authored-by:\\s*copilot.*users\\.noreply\\.github\\.com')) AS copilot_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'(?i)co-authored-by:\\s*cursor.*cursoragent@cursor\\.com')) AS cursor_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'(?i)co-authored-by:\\s*gemini-code-assist.*users\\.noreply\\.github\\.com')) AS gemini_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'(?i)co-authored-by:\\s*devin\\s+ai.*devin-ai-integration')) AS devin_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'Generated with Claude Code')) AS claude_code_generated,
      COUNTIF(LOWER(author_name) = 'devin-ai-integration[bot]') AS devin_bot_commits,
      COUNTIF(LOWER(author_name) = 'dependabot[bot]') AS dependabot_commits,
      COUNTIF(LOWER(author_name) = 'renovate[bot]') AS renovate_commits
    FROM commits
    GROUP BY day_str
    ORDER BY day_str
  `;

  console.log(`[BigQuery] Querying ${fromDate} to ${toDate}...`);
  const startMs = Date.now();
  const [rows] = await client.query({ query });
  const elapsed = Date.now() - startMs;
  console.log(`[BigQuery] Got ${rows.length} days in ${elapsed}ms`);

  return rows.map((row: Record<string, unknown>) => {
    const claudeCommits = Number(row.claude_commits);
    const opusCommits = Number(row.opus_commits);
    const sonnetCommits = Number(row.sonnet_commits);
    const haikuCommits = Number(row.haiku_commits);

    return {
      date: String(row.date),
      totalCommits: Number(row.total_commits),
      claudeCommits,
      opusCommits,
      sonnetCommits,
      haikuCommits,
      otherModelCommits: Math.max(0, claudeCommits - opusCommits - sonnetCommits - haikuCommits),
      copilotCommits: Number(row.copilot_commits),
      cursorCommits: Number(row.cursor_commits),
      geminiCommits: Number(row.gemini_commits),
      devinCommits: Number(row.devin_commits),
      claudeCodeGenerated: Number(row.claude_code_generated),
      devinBotCommits: Number(row.devin_bot_commits),
      dependabotCommits: Number(row.dependabot_commits),
      renovateCommits: Number(row.renovate_commits),
    };
  });
}
