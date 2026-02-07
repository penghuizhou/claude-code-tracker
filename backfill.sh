#!/bin/bash
# Backfill script: June 2025 to Feb 2026
# Now makes ~20 API calls per date (~55s each)
# Runs in 5-day batches with 30s pause between batches
# Total: ~250 days = ~50 batches x ~5min each = ~4-5 hours

API="http://localhost:3000/api/cron/backfill"
KEY="${ADMIN_API_KEY:?Set ADMIN_API_KEY env var}"

# Define date ranges (5-day batches to stay within rate limits)
RANGES=(
  "2025-06-01 2025-06-05"
  "2025-06-06 2025-06-10"
  "2025-06-11 2025-06-15"
  "2025-06-16 2025-06-20"
  "2025-06-21 2025-06-25"
  "2025-06-26 2025-06-30"
  "2025-07-01 2025-07-05"
  "2025-07-06 2025-07-10"
  "2025-07-11 2025-07-15"
  "2025-07-16 2025-07-20"
  "2025-07-21 2025-07-25"
  "2025-07-26 2025-07-31"
  "2025-08-01 2025-08-05"
  "2025-08-06 2025-08-10"
  "2025-08-11 2025-08-15"
  "2025-08-16 2025-08-20"
  "2025-08-21 2025-08-25"
  "2025-08-26 2025-08-31"
  "2025-09-01 2025-09-05"
  "2025-09-06 2025-09-10"
  "2025-09-11 2025-09-15"
  "2025-09-16 2025-09-20"
  "2025-09-21 2025-09-25"
  "2025-09-26 2025-09-30"
  "2025-10-01 2025-10-05"
  "2025-10-06 2025-10-10"
  "2025-10-11 2025-10-15"
  "2025-10-16 2025-10-20"
  "2025-10-21 2025-10-25"
  "2025-10-26 2025-10-31"
  "2025-11-01 2025-11-05"
  "2025-11-06 2025-11-10"
  "2025-11-11 2025-11-15"
  "2025-11-16 2025-11-20"
  "2025-11-21 2025-11-25"
  "2025-11-26 2025-11-30"
  "2025-12-01 2025-12-05"
  "2025-12-06 2025-12-10"
  "2025-12-11 2025-12-15"
  "2025-12-16 2025-12-20"
  "2025-12-21 2025-12-25"
  "2025-12-26 2025-12-31"
  "2026-01-01 2026-01-05"
  "2026-01-06 2026-01-10"
  "2026-01-11 2026-01-15"
  "2026-01-16 2026-01-20"
  "2026-01-21 2026-01-25"
  "2026-01-26 2026-01-31"
  "2026-02-01 2026-02-06"
)

for range in "${RANGES[@]}"; do
  FROM=$(echo $range | cut -d' ' -f1)
  TO=$(echo $range | cut -d' ' -f2)
  echo "=== Backfilling $FROM to $TO ==="

  RESULT=$(curl -s -X POST \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}" \
    "$API")

  # Print summary
  echo "$RESULT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    for r in data.get('results', []):
        s = r.get('stats', {})
        tc = s.get('totalCommits', 0)
        cc = s.get('claudeCommits', 0)
        ai = s.get('allAiCommits', 0)
        pct = (cc/tc*100) if tc else 0
        print(f'  {r[\"date\"]}: {r[\"status\"]} - claude={cc:,} ai={ai:,} ({pct:.2f}%) [{r[\"durationMs\"]}ms]')
except:
    print('  Error parsing response')
"

  echo "Waiting 30s for rate limit cooldown..."
  sleep 30
done

echo "=== Backfill complete ==="
