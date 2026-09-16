# Scene: Migrate from `vue-jsx-vapor` to Unified `vue-jsx`

**Use this scene** when the user is on `vue-jsx-vapor` and wants to migrate to the unified `vue-jsx` package.

Full details in `references/migration.md` §2.

---

## Workflow

1. **Update Vite plugin import**
   ```diff
   - import vueJsx from 'vue-jsx-vapor/vite'
   + import vueJsx from 'vue-jsx/vite'
   ```

2. **Rename ESLint rule prefixes**
   ```diff
   - 'vue-jsx-vapor/define-style': 'warn',
   - 'vue-jsx-vapor/jsx-sort-props': 'warn',
   + 'vue-jsx/define-style': 'warn',
   + 'vue-jsx/jsx-sort-props': 'warn',
   ```

3. **Update `ts-macro.config.ts`** to match new plugin options:
   ```ts
   import vueJsx from 'vue-jsx/volar'

   export default {
     plugins: [vueJsx({ macros: true /* same options as before */ })],
   }
   ```

4. **Audit any `vue-jsx-vapor` imports** left in source code:
   ```bash
   grep -r "vue-jsx-vapor" src/ --include="*.ts" --include="*.tsx"
   ```
   Replace all matches.

5. **Decide on Vapor mode**:
   - If you want to keep Vapor output, set `vapor: true` in both Vite and TS-Macro.
   - If you want default Virtual DOM output, omit the option.

6. **Smoke test**.

7. **Run the Validate checklist.**

---

## Validate Checklist

- [ ] No `vue-jsx-vapor` imports remain.
- [ ] ESLint config uses `vue-jsx/` prefix.
- [ ] Vite plugin and TS-Macro plugin options match exactly.
- [ ] Vapor flag (if used) is consistent across plugins.
- [ ] Dev + production builds succeed.
- [ ] Type check passes.