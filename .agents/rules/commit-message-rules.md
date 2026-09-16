---
description: Git commit message conventions. Use when preparing a commit, writing a commit message, or reviewing commit message format.
---

# Commit Message Rules

> **Scope:** Apply these rules when preparing a commit, generating a commit message, or checking the format of an existing commit message.

## Basic Format

- Follow the Conventional Commits specification and the repository's `commitlint` configuration.
- Prefer the form: `type(scope): short description`.
- `scope` is strongly recommended and should align with the functional domain of the change.
- Keep the subject concise and non-empty. The maximum header length is `108` characters.

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
- Do not omit `scope` when the change is confined to a single functional domain.
- When multiple modules are touched but one domain clearly dominates, prefer that domain as the `scope`.

## Examples

- `refactor(api): reorganize src/api directory and migrate to src/apis`
- `fix(components): fix variable declaration order to resolve use-before-define ESLint errors`
- `style(tests): improve formatting`
- `test(utils): add unit tests for utility functions`

## Merge Commits

- When a merge commit must be preserved, keep the merge message generated automatically by Git.