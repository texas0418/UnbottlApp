# Repo layout note

This repository's root IS the Expo app (package.json, eslint.config.js, and
.github/ all live at the repo root). Heads up for sessions on Simon's Mac: the
local clone lives at `~/Documents/GitHub/UnbottlApp/UnbottlApp` — the OUTER
`~/Documents/GitHub/UnbottlApp` folder is a stale, unrelated-history git wrapper
holding marketing assets and screenshots. Always work in the inner clone; never
commit or push from the outer folder.

# Git workflow (PR-based CI)

`main` is what ships; `dev` is the integration branch. Never commit directly to either.

1. Start every session by branching off `dev`: `git fetch origin && git checkout -b <topic> origin/dev`. Prefer an isolated worktree (`git worktree add`) when other sessions may be active.
2. When the work is done and `npm run typecheck` and `npm run lint` pass locally, push and open a PR into `dev` with `gh pr create --base dev`. CI runs typecheck, lint (with cyclomatic-complexity and function-length limits), a banned-phrase slop check (`scripts/ci/slop-check.sh`), and gitleaks secret scanning. There is no test script in this repo yet; add one and wire it into both workflows when real pure-module tests exist.
3. Do not merge your own PR unless Simon says to; report the PR URL and CI status at the end of the session.
4. Batches of work on `dev` get promoted by a PR into `main` (ask Simon first). That runs the deeper promotion checks, including `expo-doctor`.

# Cross-session memory (GitHub Issues)

To-dos, bugs, and session handoffs live in GitHub Issues, not in README checklists or scratch files.

- Check open issues at session start: `gh issue list --state open`.
- File bugs you find but don't fix as issues; close issues you resolve, referencing the PR (`Closes #N` in the PR body).
- For handoffs, write a dense, self-contained issue comment optimized for LLM ingestion: current state, exact file paths, what was tried and rejected (and why), and the next concrete step. Assume the reader has zero conversation context.
- Pre-ship checklist items carry the `pre-ship` label.
