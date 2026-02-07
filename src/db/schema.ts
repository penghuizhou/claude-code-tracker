import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const dailyStats = sqliteTable("daily_stats", {
  date: text("date").primaryKey(),
  totalCommits: integer("total_commits").notNull().default(0),
  // Claude commits (co-author trailer)
  claudeCommits: integer("claude_commits").notNull().default(0),
  opusCommits: integer("opus_commits").notNull().default(0),
  sonnetCommits: integer("sonnet_commits").notNull().default(0),
  haikuCommits: integer("haiku_commits").notNull().default(0),
  otherModelCommits: integer("other_model_commits").notNull().default(0),
  claudePercentage: real("claude_percentage").notNull().default(0),
  // Other AI tool commits (co-author trailer)
  copilotCommits: integer("copilot_commits").notNull().default(0),
  cursorCommits: integer("cursor_commits").notNull().default(0),
  geminiCommits: integer("gemini_commits").notNull().default(0),
  devinCommits: integer("devin_commits").notNull().default(0),
  // Additional commit signals
  claudeCodeGenerated: integer("claude_code_generated").notNull().default(0), // "Generated with Claude Code" watermark
  devinBotCommits: integer("devin_bot_commits").notNull().default(0), // commits by devin-ai-integration[bot]
  dependabotCommits: integer("dependabot_commits").notNull().default(0),
  renovateCommits: integer("renovate_commits").notNull().default(0),
  // AI code review (PRs reviewed per day)
  copilotReviews: integer("copilot_reviews").notNull().default(0),
  coderabbitReviews: integer("coderabbit_reviews").notNull().default(0),
  sourceryReviews: integer("sourcery_reviews").notNull().default(0),
  // PR mentions (PRs created mentioning AI tools)
  claudeCodePRs: integer("claude_code_prs").notNull().default(0),
  copilotPRs: integer("copilot_prs").notNull().default(0),
  cursorPRs: integer("cursor_prs").notNull().default(0),
  devinPRs: integer("devin_prs").notNull().default(0),
  // Aggregates
  allAiCommits: integer("all_ai_commits").notNull().default(0),
  allAiPercentage: real("all_ai_percentage").notNull().default(0),
  allAiReviews: integer("all_ai_reviews").notNull().default(0),
  allAiPRs: integer("all_ai_prs").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const weeklyStats = sqliteTable("weekly_stats", {
  weekStart: text("week_start").primaryKey(),
  totalCommits: integer("total_commits").notNull().default(0),
  claudeCommits: integer("claude_commits").notNull().default(0),
  opusCommits: integer("opus_commits").notNull().default(0),
  sonnetCommits: integer("sonnet_commits").notNull().default(0),
  haikuCommits: integer("haiku_commits").notNull().default(0),
  otherModelCommits: integer("other_model_commits").notNull().default(0),
  claudePercentage: real("claude_percentage").notNull().default(0),
  copilotCommits: integer("copilot_commits").notNull().default(0),
  cursorCommits: integer("cursor_commits").notNull().default(0),
  geminiCommits: integer("gemini_commits").notNull().default(0),
  devinCommits: integer("devin_commits").notNull().default(0),
  claudeCodeGenerated: integer("claude_code_generated").notNull().default(0),
  devinBotCommits: integer("devin_bot_commits").notNull().default(0),
  dependabotCommits: integer("dependabot_commits").notNull().default(0),
  renovateCommits: integer("renovate_commits").notNull().default(0),
  copilotReviews: integer("copilot_reviews").notNull().default(0),
  coderabbitReviews: integer("coderabbit_reviews").notNull().default(0),
  sourceryReviews: integer("sourcery_reviews").notNull().default(0),
  claudeCodePRs: integer("claude_code_prs").notNull().default(0),
  copilotPRs: integer("copilot_prs").notNull().default(0),
  cursorPRs: integer("cursor_prs").notNull().default(0),
  devinPRs: integer("devin_prs").notNull().default(0),
  allAiCommits: integer("all_ai_commits").notNull().default(0),
  allAiPercentage: real("all_ai_percentage").notNull().default(0),
  allAiReviews: integer("all_ai_reviews").notNull().default(0),
  allAiPRs: integer("all_ai_prs").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const ingestionLog = sqliteTable("ingestion_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  status: text("status").notNull(),
  totalCommits: integer("total_commits"),
  claudeCommits: integer("claude_commits"),
  error: text("error"),
  durationMs: integer("duration_ms"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const packageDownloads = sqliteTable("package_downloads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  registry: text("registry").notNull(), // 'npm' or 'pypi'
  packageName: text("package_name").notNull(),
  downloads: integer("downloads").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type DailyStat = typeof dailyStats.$inferSelect;
export type WeeklyStat = typeof weeklyStats.$inferSelect;
export type IngestionLogEntry = typeof ingestionLog.$inferSelect;
export type PackageDownload = typeof packageDownloads.$inferSelect;
