export interface DayCommitStats {
  date: string;
  totalCommits: number;
  // Claude breakdown
  claudeCommits: number;
  opusCommits: number;
  sonnetCommits: number;
  haikuCommits: number;
  otherModelCommits: number;
  // Other AI tools
  copilotCommits: number;
  cursorCommits: number;
  geminiCommits: number;
  devinCommits: number;
  // Additional commit signals
  claudeCodeGenerated: number; // "Generated with Claude Code" watermark
  devinBotCommits: number; // commits by devin-ai-integration[bot]
  dependabotCommits: number;
  renovateCommits: number;
  // AI code review (PRs reviewed per day)
  copilotReviews: number;
  coderabbitReviews: number;
  sourceryReviews: number;
  // PR mentions (PRs created mentioning AI tools)
  claudeCodePRs: number;
  copilotPRs: number;
  cursorPRs: number;
  devinPRs: number;
  // Aggregates
  allAiCommits: number;
  allAiReviews: number;
  allAiPRs: number;
}

interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
}

const GITHUB_API = "https://api.github.com";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries = 3
): Promise<number> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers });

    if (res.status === 403 || res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      const resetTime = res.headers.get("x-ratelimit-reset");

      let waitMs: number;
      if (retryAfter) {
        waitMs = parseInt(retryAfter, 10) * 1000;
      } else if (resetTime) {
        waitMs =
          Math.max(0, parseInt(resetTime, 10) * 1000 - Date.now()) + 1000;
      } else {
        waitMs = (attempt + 1) * 15000;
      }

      console.log(
        `Rate limited (attempt ${attempt + 1}/${retries + 1}), waiting ${Math.round(waitMs / 1000)}s...`
      );

      if (attempt < retries) {
        await sleep(waitMs);
        continue;
      }
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `GitHub Search API error ${res.status}: ${body.substring(0, 200)}`
      );
    }

    const data: SearchResponse = await res.json();
    return data.total_count;
  }

  throw new Error("Exhausted retries for GitHub Search API");
}

function getHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.cloak-preview+json",
    "User-Agent": "claude-code-tracker",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function searchCommitCount(query: string): Promise<number> {
  const headers = getHeaders();
  const params = new URLSearchParams({ q: query, per_page: "1" });
  return searchWithRetry(
    `${GITHUB_API}/search/commits?${params}`,
    headers
  );
}

async function searchIssueCount(query: string): Promise<number> {
  const headers = getHeaders();
  // Issues endpoint uses standard accept header
  headers.Accept = "application/vnd.github+json";
  const params = new URLSearchParams({ q: query, per_page: "1" });
  return searchWithRetry(
    `${GITHUB_API}/search/issues?${params}`,
    headers
  );
}

// Search queries for each AI tool's co-author signature
const COMMIT_QUERIES = {
  claude: `"Co-Authored-By: Claude" noreply@anthropic.com`,
  opus: `"Co-Authored-By: Claude Opus" noreply@anthropic.com`,
  sonnet: `"Co-Authored-By: Claude Sonnet" noreply@anthropic.com`,
  haiku: `"Co-Authored-By: Claude Haiku" noreply@anthropic.com`,
  copilot: `"Co-authored-by: Copilot" users.noreply.github.com`,
  cursor: `"Co-authored-by: Cursor" cursoragent@cursor.com`,
  gemini: `"Co-authored-by: gemini-code-assist" users.noreply.github.com`,
  devin: `"Co-authored-by: Devin AI" devin-ai-integration`,
  claudeCodeGenerated: `"Generated with Claude Code"`,
} as const;

/**
 * Query GitHub Search API for commit stats on a specific date.
 * Makes ~20 sequential API calls with delays to respect rate limits.
 * Rate limit: 30 requests/min (authenticated).
 * Each date takes ~55 seconds (20 calls x 2.5s delay).
 */
export async function queryCommitStats(
  date: string
): Promise<DayCommitStats> {
  const delay = 2500;

  // --- Commit searches (using /search/commits) ---

  const totalCommits = await searchCommitCount(`committer-date:${date}`);
  await sleep(delay);

  const claudeCommits = await searchCommitCount(
    `${COMMIT_QUERIES.claude} committer-date:${date}`
  );
  await sleep(delay);

  const opusCommits = await searchCommitCount(
    `${COMMIT_QUERIES.opus} committer-date:${date}`
  );
  await sleep(delay);

  const sonnetCommits = await searchCommitCount(
    `${COMMIT_QUERIES.sonnet} committer-date:${date}`
  );
  await sleep(delay);

  const haikuCommits = await searchCommitCount(
    `${COMMIT_QUERIES.haiku} committer-date:${date}`
  );
  await sleep(delay);

  const copilotCommits = await searchCommitCount(
    `${COMMIT_QUERIES.copilot} committer-date:${date}`
  );
  await sleep(delay);

  const cursorCommits = await searchCommitCount(
    `${COMMIT_QUERIES.cursor} committer-date:${date}`
  );
  await sleep(delay);

  const geminiCommits = await searchCommitCount(
    `${COMMIT_QUERIES.gemini} committer-date:${date}`
  );
  await sleep(delay);

  const devinCommits = await searchCommitCount(
    `${COMMIT_QUERIES.devin} committer-date:${date}`
  );
  await sleep(delay);

  const claudeCodeGenerated = await searchCommitCount(
    `${COMMIT_QUERIES.claudeCodeGenerated} committer-date:${date}`
  );
  await sleep(delay);

  const devinBotCommits = await searchCommitCount(
    `author:devin-ai-integration[bot] committer-date:${date}`
  );
  await sleep(delay);

  const dependabotCommits = await searchCommitCount(
    `author:dependabot[bot] committer-date:${date}`
  );
  await sleep(delay);

  const renovateCommits = await searchCommitCount(
    `author:renovate[bot] committer-date:${date}`
  );
  await sleep(delay);

  // --- Issue/PR searches (using /search/issues) ---

  const copilotReviews = await searchIssueCount(
    `is:pr created:${date} commenter:copilot-pull-request-reviewer[bot]`
  );
  await sleep(delay);

  const coderabbitReviews = await searchIssueCount(
    `is:pr created:${date} commenter:coderabbitai[bot]`
  );
  await sleep(delay);

  const sourceryReviews = await searchIssueCount(
    `is:pr created:${date} commenter:sourcery-ai[bot]`
  );
  await sleep(delay);

  const claudeCodePRs = await searchIssueCount(
    `is:pr created:${date} "Claude Code" in:body`
  );
  await sleep(delay);

  const copilotPRs = await searchIssueCount(
    `is:pr created:${date} "GitHub Copilot" in:body`
  );
  await sleep(delay);

  const cursorPRs = await searchIssueCount(
    `is:pr created:${date} "Cursor" "AI" in:body`
  );
  await sleep(delay);

  const devinPRs = await searchIssueCount(
    `is:pr created:${date} author:devin-ai-integration[bot]`
  );

  // --- Aggregates ---

  const allAiCommits =
    claudeCommits + copilotCommits + cursorCommits + geminiCommits + devinCommits;

  const allAiReviews = copilotReviews + coderabbitReviews + sourceryReviews;

  const allAiPRs = claudeCodePRs + copilotPRs + cursorPRs + devinPRs;

  return {
    date,
    totalCommits,
    claudeCommits,
    opusCommits,
    sonnetCommits,
    haikuCommits,
    otherModelCommits:
      claudeCommits - opusCommits - sonnetCommits - haikuCommits,
    copilotCommits,
    cursorCommits,
    geminiCommits,
    devinCommits,
    claudeCodeGenerated,
    devinBotCommits,
    dependabotCommits,
    renovateCommits,
    copilotReviews,
    coderabbitReviews,
    sourceryReviews,
    claudeCodePRs,
    copilotPRs,
    cursorPRs,
    devinPRs,
    allAiCommits,
    allAiReviews,
    allAiPRs,
  };
}
