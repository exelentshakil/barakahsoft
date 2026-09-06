#!/usr/bin/env bash
# Push the reusable BarakahSoft credentials to a project's Vercel production env
# in one shot. Hobby plan has no team-level Shared Environment Variables, so
# this script is the workaround: source of truth stays in one .env.local,
# every demo project pulls from it instead of re-typing secrets per project.
#
# Usage:
#   ./push-shared-env.sh <project-dir> [VAR_NAME ...]
#
# With no var names given, pushes the default set (Gemini + Supabase).
# Must be run from an interactive shell — each `vercel env add` may prompt.

set -euo pipefail

PROJECT_DIR="${1:?Usage: push-shared-env.sh <project-dir> [VAR_NAME ...]}"
shift || true

SOURCE_ENV="$HOME/Apps/claude-code/barakahsoft/.env.local"
DEFAULT_VARS=(GEMINI_API_KEY SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_SUPABASE_URL)
VARS=("${@:-${DEFAULT_VARS[@]}}")

if [ ! -f "$SOURCE_ENV" ]; then
  echo "Missing $SOURCE_ENV" >&2
  exit 1
fi

cd "$PROJECT_DIR"

for VAR in "${VARS[@]}"; do
  VALUE="$(grep "^${VAR}=" "$SOURCE_ENV" | head -1 | cut -d= -f2-)"
  if [ -z "$VALUE" ]; then
    echo "skip: $VAR not found in $SOURCE_ENV"
    continue
  fi
  echo "$VALUE" | npx vercel env add "$VAR" production
done

echo "Done. Redeploy to apply: npx vercel --prod --yes"
