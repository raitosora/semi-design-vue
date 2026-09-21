---
description: Git commit message conventions. Use when preparing a commit, writing a commit message, or reviewing commit message format.
---

# Commit Message Rules

> **Scope:** Apply these rules when preparing a commit, generating a commit message, or checking the format of an existing commit message.

## Basic Format

- Use `type(scope): short description`, or `type(scope)!: short description` for a breaking change.
- A nonempty `scope` is required and should align with the functional domain of the change. Scope cannot contain whitespace or parentheses.
- Keep the subject concise and non-empty, with no leading/trailing whitespace or control characters. The maximum complete header length is `108` Unicode code points. Bodies are optional.
- Apply the same format to PR titles and the final squash commit header. The executable policy is `scripts/commit-message-policy.mjs`; no commitlint dependency is required.

## Allowed Types

- `init`
- `feat`
- `fix`
- `perf`
- `style`
- `docs`
- `test`
- `refactor`
- `build`
- `ci`
- `chore`
- `revert`
- `wip`
- `workflow`
- `types`
- `release`

## Scope Guidance

- `scope` should reflect the area being changed, for example `api`, `components`, `template`, `tests`.
- Do not omit `scope`; use `repo` for a genuinely repository-wide change.
- When multiple modules are touched but one domain clearly dominates, prefer that domain as the `scope`.

## Examples

- `refactor(api): reorganize src/api directory and migrate to src/apis`
- `fix(components): fix variable declaration order to resolve use-before-define ESLint errors`
- `style(tests): improve formatting`
- `test(utils): add unit tests for utility functions`

## Merge Commits

- When a merge commit must be preserved, keep the merge message generated automatically by Git. Only commits with two or more actual parents are exempt; a subject beginning with `Merge` is not sufficient. Squash commits have one parent and must follow the normal format.

## Commit Boundaries

- Before a complex change, plan independently reviewable commits by responsibility and dependency order. Keep the implementation and its regression tests together; each commit should leave a coherent, working tree.
- Separate independent refactors, behavior changes and CI integration when useful. Do not manufacture extra commits merely to reach a count, and do not defer a large accumulated patch to one commit by default.
- A small, cohesive change can use one commit. A PR may contain multiple logical commits even when it is ultimately squash merged into one main commit.
- Inspect the complete PR commit list as well as the final diff. Choose the merge method deliberately; validate the final squash header, including any appended PR number, before merging.

## Validation

- Install dependencies first. Before committing, run `pnpm check:commit-messages --message-file /path/to/message.txt` and use that same file with `git commit -F`. Before opening or editing a PR, run `pnpm check:commit-messages --title 'ci(repo): enforce commit conventions'` with its proposed title.
- Before pushing, run `pnpm check:commit-messages --base origin/main --head HEAD`. This explicit local range requires the base to be an ancestor; update the base or use the common ancestor when reviewing a diverged branch.
- CI validates every commit reachable from the PR head but not its current base, plus the PR title. Title edits rerun CI. Main pushes validate only the event's `before..after` range. Existing history is not retroactively scanned.
- Range validation reuses the component gate's checkout and event checks. CI uses the actual PR head, not the synthetic checkout merge commit, and reads the title from the event JSON without shell interpolation.
- These commands provide local preflight and CI checks; they do not install or replace Git hooks. Keep existing hooks and verification gates enabled. CI checks alone do not imply a branch ruleset is configured.
