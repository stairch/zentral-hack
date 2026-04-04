#!/bin/bash
# DB migration script for Neon
# Requires DATABASE_URL in .env or as an environment variable

SCRIPTS_DIR="$(dirname "$0")/scripts"
ENV_FILE="$(dirname "$0")/.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL is not set."
  echo "   Add it to .env or export it manually:"
  echo "   export DATABASE_URL='postgresql://user:pass@host/dbname'"
  exit 1
fi

echo "Connecting to database..."

# Create migration tracking table if it doesn't exist (with hash column)
psql "$DATABASE_URL" -q <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename    TEXT        PRIMARY KEY,
  hash        TEXT,
  applied_at  TIMESTAMPTZ DEFAULT NOW(),
  applied_by  TEXT        DEFAULT current_user
);
ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS hash TEXT;
SQL

echo ""

APPLIED=0
SKIPPED=0
WARNINGS=()
CHANGED=()

for filepath in $(ls "$SCRIPTS_DIR"/*.sql 2>/dev/null | sort); do
  filename=$(basename "$filepath")
  current_hash=$(md5 -q "$filepath" 2>/dev/null || md5sum "$filepath" | cut -d' ' -f1)

  row=$(psql "$DATABASE_URL" -tAq \
    -c "SELECT hash FROM schema_migrations WHERE filename='$filename'" 2>/dev/null)

  if [ -n "$row" ]; then
    stored_hash="$row"
    if [ "$current_hash" != "$stored_hash" ]; then
      echo "⚠️  changed $filename"
      CHANGED+=("$filename")
    else
      echo "⏭️  skip    $filename"
      SKIPPED=$((SKIPPED + 1))
    fi
  else
    echo "⚙️  apply   $filename"

    output=$(psql "$DATABASE_URL" -f "$filepath" 2>&1)
    exit_code=$?

    if echo "$output" | grep -q "^psql:.*ERROR:"; then
      psql "$DATABASE_URL" -q \
        -c "INSERT INTO schema_migrations(filename, hash) VALUES('$filename', '$current_hash')"
      echo "⚠️  done    $filename (with errors)"
      echo "$output" | grep "ERROR:" | sed 's/^/   /'
      WARNINGS+=("$filename")
      APPLIED=$((APPLIED + 1))
    elif [ $exit_code -ne 0 ]; then
      echo "❌ failed   $filename"
      echo "$output"
      echo ""
      echo "Migration aborted. Fix the error above and re-run."
      exit 1
    else
      psql "$DATABASE_URL" -q \
        -c "INSERT INTO schema_migrations(filename, hash) VALUES('$filename', '$current_hash')"
      echo "✅ done    $filename"
      APPLIED=$((APPLIED + 1))
    fi
  fi
done

TOTAL_WARNINGS=$(( ${#WARNINGS[@]} + ${#CHANGED[@]} ))

echo ""
echo "════════════════════════════════════"
echo "  ✅ Applied:  $APPLIED"
echo "  ⏭️  Skipped:  $SKIPPED"
echo "  ⚠️  Warnings: $TOTAL_WARNINGS"
if [ ${#CHANGED[@]} -gt 0 ]; then
  echo ""
  echo "  Modified after apply (not re-run):"
  for f in "${CHANGED[@]}"; do
    echo "     - $f"
  done
  echo ""
  echo "  To re-run: DELETE FROM schema_migrations WHERE filename='<sql_script_filename>';"
fi
if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo "  ⚠️  Scripts with SQL errors (review recommended):"
  for w in "${WARNINGS[@]}"; do
    echo "     - $w"
  done
fi
echo "════════════════════════════════════"