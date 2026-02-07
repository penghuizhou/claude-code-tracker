import { BigQuery } from "@google-cloud/bigquery";
import {
  CLAUDE_COAUTHOR_REGEX,
  MODEL_PATTERNS,
} from "./constants";

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
    // Fall back to GOOGLE_APPLICATION_CREDENTIALS env var
    bigqueryClient = new BigQuery({ projectId });
  }

  return bigqueryClient;
}

export interface DayCommitStats {
  date: string;
  totalCommits: number;
  claudeCommits: number;
  opusCommits: number;
  sonnetCommits: number;
  haikuCommits: number;
  otherModelCommits: number;
}

/**
 * Query GH Archive for commit stats on a specific date.
 * Uses the githubarchive.day.YYYYMMDD tables which contain PushEvents
 * with commit messages (capped at 20 commits per PushEvent).
 */
export async function queryCommitStats(date: string): Promise<DayCommitStats> {
  const client = getClient();

  // Convert YYYY-MM-DD to YYYYMMDD for table name
  const tableDate = date.replace(/-/g, "");
  const tableName = `githubarchive.day.${tableDate}`;

  const query = `
    WITH commits AS (
      SELECT
        commit.message AS message
      FROM
        \`${tableName}\`,
        UNNEST(JSON_EXTRACT_ARRAY(payload, '$.commits')) AS commit_json
      CROSS JOIN
        UNNEST([STRUCT(
          JSON_EXTRACT_SCALAR(commit_json, '$.message') AS message
        )]) AS commit
      WHERE
        type = 'PushEvent'
    )
    SELECT
      COUNT(*) AS total_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'${CLAUDE_COAUTHOR_REGEX}')) AS claude_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'${MODEL_PATTERNS.opus}')) AS opus_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'${MODEL_PATTERNS.sonnet}')) AS sonnet_commits,
      COUNTIF(REGEXP_CONTAINS(message, r'${MODEL_PATTERNS.haiku}')) AS haiku_commits
    FROM commits
  `;

  const [rows] = await client.query({ query });
  const row = rows[0];

  const claudeCommits = Number(row.claude_commits);
  const opusCommits = Number(row.opus_commits);
  const sonnetCommits = Number(row.sonnet_commits);
  const haikuCommits = Number(row.haiku_commits);

  return {
    date,
    totalCommits: Number(row.total_commits),
    claudeCommits,
    opusCommits,
    sonnetCommits,
    haikuCommits,
    otherModelCommits: claudeCommits - opusCommits - sonnetCommits - haikuCommits,
  };
}
