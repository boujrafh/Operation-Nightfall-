#!/usr/bin/env bash
# Sets up the GitHub side of Operation Nightfall. Safe to run many times
# (Doc 06 rule I-8): every step is create-if-missing or update-in-place.
#
# Usage: scripts/bootstrap-github.sh <owner/repo> [project-owner]
# Needs: gh CLI logged in with scopes: repo, project, workflow.
set -euo pipefail

REPO="${1:?usage: bootstrap-github.sh <owner/repo> [project-owner]}"
OWNER="${REPO%%/*}"
PROJECT_OWNER="${2:-$OWNER}"
PROJECT_TITLE="Nightfall Board"
STATUS_OPTIONS=("Backlog" "Ready" "In Progress" "In Test" "In Review" "Done")

log() { printf '\033[1;33m==>\033[0m %s\n' "$*"; }

# ------------------------------------------------------------------ repository
log "Repository $REPO"
if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public --description "8-bit stealth game in the MSX2 style, as an offline PWA"
fi
gh repo edit "$REPO" --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false \
  --delete-branch-on-merge --enable-issues --enable-projects >/dev/null

# ------------------------------------------------------------------ labels
log "Labels"
label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }
label "type:feature" "1d76db" "New feature"
label "type:bug" "d73a4a" "Something is broken"
label "type:chore" "cfd3d7" "Tooling, CI, maintenance"
label "type:docs" "0075ca" "Documentation"
for area in core render input audio ai world ui save pwa content ci; do
  label "area:$area" "5468d9" "Area: $area"
done
label "priority:p0" "b60205" "Must have"
label "priority:p1" "fbca04" "Should have"
label "priority:p2" "c5def5" "Could have"

# ------------------------------------------------------------------ milestones
log "Milestones"
milestone() {
  local title="$1" desc="$2"
  if ! gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title' | grep -Fxq "$title"; then
    gh api "repos/$REPO/milestones" -f title="$title" -f description="$desc" >/dev/null
  fi
}
milestone "M0 Foundation" "Repository, tooling, CI/CD, GitHub Project"
milestone "M1 Prototype One Room" "v0.0.1 - one screen, 2 guards, detection, alert"
milestone "M2 Three Rooms" "v0.0.2 - Chapter 0 complete"
milestone "M3 PWA and Mobile" "v0.1.0 - installable, offline, touch"
milestone "M4 Outer Heaven Walls" "v0.2.0 - Chapters 1-3, first bosses"
milestone "M5 Nightfall" "v0.3.0 to v1.0.0 - Chapters 4-7, full game"

# ------------------------------------------------------------------ project
# GitHub Projects only has a GraphQL API. Where GraphQL is unavailable (for
# example from a Claude Code cloud session) this step is skipped with a note.
setup_project() {
  PROJECT_NUMBER="$(gh project list --owner "$PROJECT_OWNER" --format json --limit 100 \
    --jq ".projects[] | select(.title == \"$PROJECT_TITLE\") | .number" | head -n1)" || return 1
  if [ -z "$PROJECT_NUMBER" ]; then
    PROJECT_NUMBER="$(gh project create --owner "$PROJECT_OWNER" --title "$PROJECT_TITLE" --format json --jq '.number')" || return 1
  fi
  gh project link "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --repo "$REPO" >/dev/null 2>&1 || true
  # Status column options: replace the default set with ours (same result every run).
  local field_id options
  field_id="$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json \
    --jq '.fields[] | select(.name == "Status") | .id')" || return 1
  options="$(printf '%s\n' "${STATUS_OPTIONS[@]}" | \
    awk 'BEGIN{printf "["} {if (NR>1) printf ","; printf "{name:\"%s\",color:GRAY,description:\"\"}", $0} END{printf "]"}')"
  gh api graphql -f query="
mutation {
  updateProjectV2Field(input: {
    fieldId: \"$field_id\",
    singleSelectOptions: $options
  }) { projectV2Field { ... on ProjectV2SingleSelectField { name } } }
}" >/dev/null || return 1
  echo "  project #$PROJECT_NUMBER ready - enable its built-in workflows in the Project settings:"
  echo "  'Auto-add to project' (this repo), 'Item added -> Backlog', 'Pull request merged -> Done', 'Item closed -> Done'."
}
log "Project \"$PROJECT_TITLE\""
PROJECT_NUMBER=""
if ! setup_project; then
  PROJECT_NUMBER=""
  echo "  WARNING: GitHub Projects is not reachable here (GraphQL). Create the board by hand:"
  echo "  github.com/$PROJECT_OWNER -> Projects -> New project -> Board, title \"$PROJECT_TITLE\","
  echo "  Status columns: ${STATUS_OPTIONS[*]}; then turn on the 'Auto-add to project' workflow for $REPO."
fi

# ------------------------------------------------------------------ issues
log "Issues"
issue() {
  local title="$1" milestone="$2" labels="$3" body="$4"
  local existing
  existing="$(gh issue list --repo "$REPO" --state all --limit 200 --json title,url \
    --jq ".[] | select(.title == \"$title\") | .url" | head -n1)"
  if [ -z "$existing" ]; then
    existing="$(gh issue create --repo "$REPO" --title "$title" --milestone "$milestone" \
      --label "$labels" --body "$body")"
    echo "  created: $title"
  fi
  if [ -n "$PROJECT_NUMBER" ]; then
    gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$existing" >/dev/null 2>&1 || true
  fi
}
M0="M0 Foundation"; M1="M1 Prototype One Room"; M2="M2 Three Rooms"; M3="M3 PWA and Mobile"
issue "Repository bootstrap: docs, README, LICENSE, bootstrap script" "$M0" "type:docs,area:ci,priority:p0" "Doc 07 #1. Done when the script runs twice without duplicates and the 7 documents are in docs/."
issue "Tooling: ESLint, Prettier, type checking, Vitest, Playwright" "$M0" "type:chore,area:ci,priority:p0" "Doc 07 #2. Done when lint, typecheck and tests run."
issue "Single-file build with size budget" "$M0" "type:chore,area:ci,priority:p0" "Doc 07 #3. dist/index.html works with no other files."
issue "CI and deployment to GitHub Pages" "$M0" "type:chore,area:ci,priority:p0" "Doc 07 #4."
issue "Core: fixed 60 Hz loop, scene manager, event bus" "$M1" "type:feature,area:core,priority:p0" "Doc 07 #5."
issue "Renderer: palette, letterbox scaling, bitmap font, sprites, dithering" "$M1" "type:feature,area:render,priority:p0" "Doc 07 #6."
issue "Keyboard input by physical key (WASD / ZQSD)" "$M1" "type:feature,area:input,priority:p0" "Doc 07 #7."
issue "Tilemap, collisions and room 0-1" "$M1" "type:feature,area:world,priority:p0" "Doc 07 #8."
issue "Player movement in 8 directions" "$M1" "type:feature,area:core,priority:p0" "Doc 07 #9."
issue "Guard patrols on waypoint routes" "$M1" "type:feature,area:ai,priority:p0" "Doc 07 #10."
issue "Vision cones with line of sight" "$M1" "type:feature,area:ai,priority:p0" "Doc 07 #11."
issue "Alert states, guard behaviour and A* pathfinding" "$M1" "type:feature,area:ai,priority:p0" "Doc 07 #12."
issue "Hiding spots and footstep noise" "$M1" "type:feature,area:ai,priority:p0" "Doc 07 #13."
issue "Chip audio engine, infiltration and alert music" "$M1" "type:feature,area:audio,priority:p0" "Doc 07 #14."
issue "Minimal HUD: life bar and alert badge" "$M1" "type:feature,area:ui,priority:p0" "Doc 07 #15."
issue "Room transitions and room memory" "$M2" "type:feature,area:world,priority:p0" "Doc 07 #16."
issue "Rooms 0-2 and 0-3 plus content validation" "$M2" "type:feature,area:content,priority:p0" "Doc 07 #17."
issue "Inventory and idempotent pickups" "$M2" "type:feature,area:core,priority:p0" "Doc 07 #18."
issue "Cardboard box" "$M2" "type:feature,area:core,priority:p0" "Doc 07 #19."
issue "Takedown from behind and item drops" "$M2" "type:feature,area:core,priority:p0" "Doc 07 #20."
issue "Doors and key cards" "$M2" "type:feature,area:world,priority:p0" "Doc 07 #21."
issue "Codec: window, triggers and Chapter 0 dialogue" "$M2" "type:feature,area:ui,priority:p0" "Doc 07 #22."
issue "Save system with checksum, fallback and CONTINUE" "$M2" "type:feature,area:save,priority:p0" "Doc 07 #23."
issue "Scenes: title, briefing, pause, options, game over, chapter end" "$M2" "type:feature,area:ui,priority:p0" "Doc 07 #24."
issue "Remaining music and sound effects" "$M2" "type:feature,area:audio,priority:p1" "Doc 07 #25."
issue "PWA manifest and pixel-art icons" "$M3" "type:feature,area:pwa,priority:p0" "Doc 07 #26."
issue "Service worker, offline play and update prompt" "$M3" "type:feature,area:pwa,priority:p0" "Doc 07 #27."
issue "Touch controls" "$M3" "type:feature,area:input,priority:p0" "Doc 07 #28."
issue "Responsive layout: landscape and portrait handheld" "$M3" "type:feature,area:render,priority:p0" "Doc 07 #29."
issue "Accessibility options and performance pass" "$M3" "type:feature,area:ui,priority:p1" "Doc 07 #30."
issue "Release v0.1.0" "$M3" "type:chore,area:ci,priority:p0" "Doc 07 #31."

# ------------------------------------------------------------------ pages and protection
log "GitHub Pages (source: GitHub Actions)"
if gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/$REPO/pages" -f build_type=workflow >/dev/null
else
  gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null
fi

log "Branch protection on main"
if gh api "repos/$REPO/branches/main" >/dev/null 2>&1; then
  gh api -X PUT "repos/$REPO/branches/main/protection" --input - >/dev/null <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["ci"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
else
  echo "  main does not exist yet - push it first, then run this script again."
fi

log "Done."
