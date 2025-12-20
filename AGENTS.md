# Agent Instructions

## Issue Tracking

This project uses **bd (beads)** for issue tracking.
Run `bd prime` for workflow context, or install hooks (`bd hooks install`) for auto-injection.

**Quick reference:**

- `bd ready` - Find unblocked work
- `bd create "Title" --type task --priority 2` - Create issue
- `bd close <id>` - Complete work
- `bd sync` - Sync with git (run at session end)

For full workflow details: `bd prime`

## Bd CLI Commands

Key bd commands for project management:

- `bd ready` - Show ready work (no blockers)
- `bd create --title="..." --type=task|bug|feature --priority=0-4` - Create issue
- `bd update <id> --status=in_progress` - Claim work
- `bd close <id>` - Mark complete
- `bd sync` - Sync with git
- `bd show <id>` - View issue details
- `bd list --status=open` - List open issues
- `bd blocked` - Show blocked issues
- `bd dep add <issue> <depends-on>` - Add dependency
- `bd --help` - Full help

Always run `bd sync` and `git push` at session end per mandatory workflow.

## Coding Agent Integration with bd

The coding agent (e.g., opencode) MUST use bd for ALL task and issue management to ensure seamless integration with the project's workflow. Do NOT use internal todo systems like todowrite/todoread; bd is the authoritative source.

### Task Management Guidelines:

- **Creating Tasks:** Use `bd create --title="Task Description" --type=task --priority=<0-4>` for any new tasks or multi-step work. Parse the issue ID from output for future references.
- **Reading Tasks:** Use `bd list` or `bd ready` to view available work instead of internal reads.
- **Updating Status:** Use `bd update <id> --status=in_progress` when starting work, and `bd update <id> --status=completed` when done (but do not close yet).
- **Completing Tasks:** Use `bd close <id>` only after full verification.
- **Pre-Completion Check:** Before declaring "all tasks done," run `bd list --status=open` and ensure no open issues remain. If any exist, continue working.
- **Dependencies:** Use `bd dep add` for task dependencies if needed.
- **Session End:** Always enforce the mandatory workflow below, including `bd sync`.

This ensures universal use of bd, with no silos between the coding agent and project tracking.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
