// Regex pattern for detecting Claude Code co-author trailers in commit messages.
// Matches: Co-Authored-By: Claude <noreply@anthropic.com>
// Also matches model-specific variants like:
//   Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>
//   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
//   Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>

// BigQuery REGEXP_CONTAINS pattern (RE2 syntax)
export const CLAUDE_COAUTHOR_REGEX =
  "(?i)co-authored-by:\\s*claude.*<.*@anthropic\\.com>";

// Model extraction patterns (RE2 syntax for BigQuery)
export const MODEL_PATTERNS = {
  opus: "(?i)co-authored-by:\\s*claude\\s+(opus|code.*opus).*<.*@anthropic\\.com>",
  sonnet:
    "(?i)co-authored-by:\\s*claude\\s+(sonnet|code.*sonnet).*<.*@anthropic\\.com>",
  haiku:
    "(?i)co-authored-by:\\s*claude\\s+(haiku|code.*haiku).*<.*@anthropic\\.com>",
} as const;

// Date format used throughout the app
export const DATE_FORMAT = "yyyy-MM-dd";

// Max days to backfill per cron run
export const MAX_DAYS_PER_RUN = 3;

// GH Archive PushEvent limitation
export const PUSH_EVENT_COMMIT_CAP = 20;
