# Template: vapor-config

**Scene**: configure-project
**Intent**: Vite + TS-Macro configuration files for Vapor Mode.
**Status**: ready

## When to use

- Project targets Vue 3.6+ with Vapor (no Virtual DOM) output.
- You want identical plugin options across Vite and TS-Macro.

## When NOT to use

- Vue < 3.6 — Vapor requires Vue 3.6.
- You want default Virtual DOM — omit the `vapor` option.

## Acceptance

- [ ] Both `vite.config.ts` and `ts-macro.config.ts` set `vapor: true`.
- [ ] Both have `macros: true` if using macros.
- [ ] No other JSX plugin is present.

## Code

- `vite.config.ts` — Vite plugin setup.
- `ts-macro.config.ts` — TS-Macro editor setup.