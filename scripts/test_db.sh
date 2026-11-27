#!/usr/bin/env bash
# Spins up a throwaway local Postgres, applies schema.sql on top of Supabase stubs,
# and runs the access-rule tests. Usage: scripts/test_db.sh
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
pg_bin="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
work_dir="$(mktemp -d)"
trap '"$pg_bin/pg_ctl" -D "$work_dir/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$work_dir"' EXIT

run_as_postgres_user() {
  if [ "$(id -u)" = "0" ]; then
    chown -R postgres "$work_dir"
    su postgres -c "$*"
  else
    bash -c "$*"
  fi
}

run_as_postgres_user "'$pg_bin/initdb' -D '$work_dir/data' -A trust -U postgres >/dev/null"
run_as_postgres_user "'$pg_bin/pg_ctl' -D '$work_dir/data' -o '-k $work_dir -p 54329 -c listen_addresses=' -l '$work_dir/log' start >/dev/null"

psql_cmd=(psql -h "$work_dir" -p 54329 -U postgres -d postgres -q -v ON_ERROR_STOP=1)
"${psql_cmd[@]}" -f "$repo_dir/supabase/tests/supabase_stubs.sql"
"${psql_cmd[@]}" -f "$repo_dir/supabase/schema.sql"
"${psql_cmd[@]}" -f "$repo_dir/supabase/tests/rls_test.sql"

import_sql="$work_dir/import.sql"
fixture="$repo_dir/supabase/tests/fixtures/sheet_sample.csv"
if python3 "$repo_dir/scripts/import_sheet.py" "$fixture" >/dev/null 2>&1; then
  echo "FAILED: strict import should refuse the fixture's bad rows"; exit 1
fi
python3 "$repo_dir/scripts/import_sheet.py" --lenient "$fixture" > "$import_sql" 2>/dev/null
chmod a+r "$import_sql"
"${psql_cmd[@]}" -v import_file="$import_sql" -f "$repo_dir/supabase/tests/import_test.sql"
