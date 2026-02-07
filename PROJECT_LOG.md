# Claude Code Commit Tracker - Project Log

## 2026-02-07: Initial Implementation

### User Input
The user provided a detailed implementation plan for a Claude Code Commit Tracker app:
- **Goal**: Track and visualize Claude Code's footprint in public GitHub commits (~4% currently, projected 20%+ by end of 2026, per SemiAnalysis article)
- **Architecture**: Next.js App Router on Vercel + BigQuery (GH Archive) + Turso (LibSQL) + shadcn/ui + Recharts
- **Key features**: Daily cron to collect data from BigQuery, stats API, interactive dashboard with charts
- **Instruction**: "Implement the following plan" and "keep a detailed log of this project, particularly my input"

### What Was Built (Phase 1-6)
- Full Next.js app with TypeScript, Tailwind v4, shadcn/ui, Recharts
- Drizzle ORM schema, Turso client, BigQuery integration
- API routes (cron/collect, cron/backfill, stats, health)
- Dashboard with charts (CommitTrend, Percentage, ModelBreakdown, StatsCards)
- Dark mode, responsive layout, OG tags

### Issues Encountered
1. `drizzle-kit` config: `driver: "turso"` → `dialect: "turso"`
2. Build-time DB initialization: fixed with Proxy-based lazy init
3. TypeScript cast: `unknown` intermediate cast for Proxy handler

---

## 2026-02-07: Infrastructure Setup & Data Source Pivot

### User Input
- "let's try running it"
- User logged into Turso when prompted
- User provided BigQuery service account JSON key (local file path redacted)
- "also read this: https://www.gharchive.org/"
- "Here is a list of github event types: https://docs.github.com/en/rest/using-the-rest-api/github-event-types"
- "Check GH archive again. Identifying claude-driven commits or pushes may require a different specification of the search"

### What Happened
1. **Turso setup**: Created `claude-code-tracker` database, pushed schema, connected successfully
2. **BigQuery setup**: Configured GCP service account credentials
3. **GH Archive discovery**: PushEvent payloads in 2026 no longer contain commit messages (stripped by GitHub ~Oct 10, 2025). BigQuery query returned 0 commits for 2026 dates.
4. **Investigation**: Tested 6 different dates to pinpoint the change (commits present until Oct 1 2025, gone by Oct 15). Checked raw GH Archive JSON files — same issue. PullRequestEvent bodies also stripped.
5. **Pivot to GitHub Search API**: Discovered `/search/commits` endpoint works perfectly:
   - Feb 5, 2026: **142,335 Claude commits** out of 4,782,503 total (2.98%)
   - Replaced BigQuery with `src/lib/github-search.ts`
   - 5 API calls per date (total + Claude + Opus + Sonnet + Haiku), rate limited at 30/min

### User Input (cont.)
- "If these tests work, I also want to include code commits by all LLMs (in addition to Claude). Specify the LLM source, whether GPT or others, as well as the model version."
- "Also, I want to generate the times series starting in June-2025"
- "while doing this, show me how the dashboard / visualization looks like"

### Multi-AI Expansion
Searched for co-author signatures across all major AI coding tools:

| AI Tool | Co-Author Pattern | Feb 5 Count |
|---------|------------------|-------------|
| **Claude** | `Claude ... <noreply@anthropic.com>` | 142,335 |
| **Cursor** | `Cursor <cursoragent@cursor.com>` | 13,790 |
| **Copilot** | `Copilot <175728472+Copilot@users.noreply.github.com>` | 2,918 |
| **Gemini** | `gemini-code-assist[bot] <176961590+...>` | 2,173 |
| **Devin** | `Devin AI <158243242+devin-ai-integration[bot]@...>` | 122 |

Updated:
- Schema: Added `copilot_commits`, `cursor_commits`, `gemini_commits`, `devin_commits`, `all_ai_commits`, `all_ai_percentage` columns to both daily_stats and weekly_stats
- GitHub Search: Now makes 9 API calls per date (total + 4 Claude models + 4 other AI tools)
- ModelBreakdownChart: Shows all 5 AI tools as stacked bars
- Stats API: Returns all AI tool data + aggregate AI percentage

### Backfill Status
- Running from June 1, 2025 to Feb 6, 2026 (250 days)
- ~25s per day due to rate limiting (9 sequential API calls with 2.5s delays)
- Running as background process in 10-day batches with 65s pauses

### Key Data Points (Early Results)
- June 1, 2025: Claude 0.11% (3,541 commits/day)
- Jan 21, 2026: Claude 2.23% (110,339 commits/day)
- Feb 5, 2026: Claude 2.98% (142,375 commits/day)
- Growth: ~27x increase in absolute Claude commits over 8 months

### Next Steps
- Wait for full backfill to complete
- Deploy to Vercel

---

## 2026-02-07: Comprehensive AI Signals Expansion

### User Input
- "I want to understand how much AI is involved in software engineering, which is what this exercise was for. Are there other interesting descriptions in the github data that might be worth extracting or evaluating?"
- "Add all of these"

### What Was Added
Expanded from 9 API calls/day to 20 API calls/day to capture a comprehensive view of AI in software engineering:

**New Commit Signals** (using `/search/commits`):
| Signal | Query | Feb 5 Count |
|--------|-------|-------------|
| Claude Code watermark | `"Generated with Claude Code"` | 6,513 |
| Devin bot commits | `author:devin-ai-integration[bot]` | 237 |
| Dependabot | `author:dependabot[bot]` | 12,984 |
| Renovate | `author:renovate[bot]` | 14,248 |

**AI Code Review** (using `/search/issues` for PRs with bot comments):
| Bot | Query | Feb 5 Count |
|-----|-------|-------------|
| Copilot Reviews | `commenter:copilot-pull-request-reviewer[bot]` | 13,190 |
| CodeRabbit | `commenter:coderabbitai[bot]` | 10,150 |
| Sourcery | `commenter:sourcery-ai[bot]` | 1,047 |
| **Total AI Reviews** | | **24,387** |

**PR Mentions** (using `/search/issues` for PRs mentioning AI tools):
| Tool | Query | Feb 5 Count |
|------|-------|-------------|
| Claude Code PRs | `"Claude Code" in:body` | 16,968 |
| Copilot PRs | `"GitHub Copilot" in:body` | 5,245 |
| Cursor PRs | `"Cursor" "AI" in:body` | 578 |
| Devin PRs | `author:devin-ai-integration[bot]` | 266 |
| **Total AI PRs** | | **23,057** |

### Files Changed
- `src/db/schema.ts` — Added 14 new columns to daily_stats and weekly_stats
- `src/lib/github-search.ts` — Added `searchIssueCount()` for `/search/issues` endpoint, 11 new queries
- `src/lib/ingest.ts` — Updated to store all new fields, refactored weekly rollup
- `src/lib/types.ts` — Added all new fields to DailyStatRow, WeeklyStatRow, StatsResponse
- `src/app/api/stats/route.ts` — Added totalAllAiReviews, totalAllAiPRs to summary
- `src/components/dashboard/AIReviewChart.tsx` — New: stacked bar chart for CodeRabbit/Copilot/Sourcery reviews
- `src/components/dashboard/PRMentionsChart.tsx` — New: stacked bar chart for AI tool mentions in PRs
- `src/components/dashboard/BotCommitsChart.tsx` — New: stacked bar chart for bot/automation commits
- `src/components/dashboard/StatsCards.tsx` — Updated to show All AI Commits, Claude Share, AI Code Reviews, Growth
- `src/components/dashboard/ClientDashboard.tsx` — Added 3 new chart sections

### Backfill Status
- Dropped all tables, pushed new schema, re-backfilling from June 2025
- ~55s per day (20 API calls), 5-day batches with 30s pauses
- Estimated ~4-5 hours for full 250-day backfill
- Running in background

---

## 2026-02-07: PyPI & npm Package Download Tracking

### User Input
- "Are there other public repositories or datasets like github archive, which might help us understand AI penetration in software?"
- (Compiled comprehensive DATA_SOURCES.md with 60+ sources across 13 categories)
- "Add PyPI and npm download tracking for AI libraries"

### What Was Added
New data pipeline tracking daily download counts for AI SDK packages across both npm and PyPI registries.

**npm packages tracked** (Feb 5 counts):
| Package | Daily Downloads |
|---------|----------------|
| `openai` | 2,130,106 |
| `ai` (Vercel AI SDK) | 1,374,981 |
| `@anthropic-ai/sdk` | 947,438 |
| `@aws-sdk/client-bedrock-runtime` | 569,778 |
| `@langchain/core` | 483,155 |
| `@google/generative-ai` | 338,755 |

**PyPI packages tracked** (Feb 5 counts):
| Package | Daily Downloads |
|---------|----------------|
| `boto3` (baseline) | 61,817,693 |
| `openai` | 6,101,718 |
| `transformers` | 4,520,689 |
| `langchain-core` | 3,425,682 |
| `anthropic` | 2,148,930 |
| `google-generativeai` | 724,271 |

### Files Added/Changed
- `src/db/schema.ts` — Added `package_downloads` table
- `src/lib/package-downloads.ts` — New: npm + PyPI fetch + ingest functions
- `src/app/api/cron/backfill-packages/route.ts` — New: package backfill endpoint
- `src/app/api/package-stats/route.ts` — New: package stats API
- `src/components/dashboard/NpmDownloadsChart.tsx` — New: line chart for npm
- `src/components/dashboard/PyPIDownloadsChart.tsx` — New: line chart for PyPI
- `src/components/dashboard/ClientDashboard.tsx` — Added package download section
- `backfill-packages.sh` — New: monthly batch backfill script
- `DATA_SOURCES.md` — Comprehensive catalog of 60+ data sources for measuring AI in software

### Backfill Status
- Package backfill running in parallel with commit backfill
- ~10s per date (12 API calls: 6 npm + 6 PyPI), 30-day batches
- Much faster than commit backfill
