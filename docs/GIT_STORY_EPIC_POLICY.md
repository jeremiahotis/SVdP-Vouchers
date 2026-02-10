# Git Policy for Story and Epic Delivery

## Purpose

This policy defines required Git practices for story-based implementation and epic-level integration.  
Goal: preserve a clear subtask audit trail while keeping PR history reviewable and release-safe.

## Branch Model (Required)

1. Use one branch per story.
2. Story branch naming:
   - `codex/story-<story-id>-<short-slug>`
   - Example: `codex/story-1-5-operational-gates-hooks`
3. Use one integration branch per epic:
   - `feature/<epic-slug>`
   - Example: `feature/shyft-standalone-voucher-platform`
4. Create story branches from the target epic branch when one exists.
5. Keep story code, tests, and story artifact updates on the same story branch.
6. Do not mix multiple stories on a single story branch.

## Commit Strategy (Required)

1. Commit in small slices mapped to a subtask or acceptance criterion.
2. Do not use one large "everything" commit for a story.
3. Commit message format:
   - `<story-id>: <imperative summary>`
   - Example: `1-5: enforce release gates checks in compose CI`
4. Stage only files relevant to that commit slice.
5. Keep commits in chronological implementation order (test -> fix -> refactor/documentation).

## Testing Gates (Required)

1. Run targeted story tests before each commit slice.
2. Run full relevant regression before marking the story PR ready.
3. Do not commit or open a ready PR with failing checks.
4. Include exact test commands in the PR description.

## Pull Request Rules (Required)

### Story PRs

1. Open one PR per story branch.
2. Base story PRs on the epic integration branch when applicable.
3. PR description must include:
   - Story ID
   - Acceptance criteria traceability
   - Test commands run and result summary
4. Keep commit history intact to preserve subtask audit trail.

### Epic PRs

1. Open one epic PR from `feature/<epic-slug>` into its release target branch.
2. Epic PR description must include:
   - Included story IDs
   - Remaining/excluded stories
   - Full regression evidence
3. Do not add unrelated non-epic changes to the epic PR.

## Merge Policy (Required)

1. Story PRs must use merge commits.
2. Do not squash-merge story PRs.
3. Do not rebase-and-merge story PRs when subtask commit history must be preserved.
4. Epic PRs should use merge commits when preserving story-level commit lineage is required.

## Best Practices

1. Rebase story branches on latest epic branch before final review to reduce merge noise.
2. Keep PRs focused and short-lived.
3. Use follow-up commits for review feedback; avoid rewriting shared history after review begins.
4. Update story artifact files in the same PR as the code they describe.

## Quick Commands

```bash
# Start from epic branch
git checkout feature/shyft-standalone-voucher-platform
git pull

# Create story branch
git checkout -b codex/story-1-5-operational-gates-hooks

# Commit by subtask/AC slice
git add <relevant-files>
git commit -m "1-5: <imperative summary>"

# Push and open PR
git push -u origin codex/story-1-5-operational-gates-hooks
gh pr create --base feature/shyft-standalone-voucher-platform --head codex/story-1-5-operational-gates-hooks
```
