#!/bin/bash
# Backfill package downloads: June 2025 to Feb 2026
# ~10s per date, 30-day batches. Much faster than commit backfill.
# npm data available for 18 months; PyPI may have gaps for older dates.

API="http://localhost:3000/api/cron/backfill-packages"
KEY="${ADMIN_API_KEY:?Set ADMIN_API_KEY env var}"

RANGES=(
  "2025-06-01 2025-06-30"
  "2025-07-01 2025-07-31"
  "2025-08-01 2025-08-31"
  "2025-09-01 2025-09-30"
  "2025-10-01 2025-10-31"
  "2025-11-01 2025-11-30"
  "2025-12-01 2025-12-31"
  "2026-01-01 2026-01-31"
  "2026-02-01 2026-02-06"
)

for range in "${RANGES[@]}"; do
  FROM=$(echo $range | cut -d' ' -f1)
  TO=$(echo $range | cut -d' ' -f2)
  echo "=== Backfilling packages $FROM to $TO ==="

  RESULT=$(curl -s -X POST \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"from\":\"$FROM\",\"to\":\"$TO\"}" \
    "$API")

  echo "$RESULT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    for r in data.get('results', []):
        dl = r.get('totalDownloads', 0)
        print(f'  {r[\"date\"]}: {r[\"status\"]} - downloads={dl:,} [{r[\"durationMs\"]}ms]')
except Exception as e:
    print(f'  Error: {e}')
"

  echo "Waiting 10s..."
  sleep 10
done

echo "=== Package backfill complete ==="
