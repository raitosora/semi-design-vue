# Vapor Mode

Vapor is Vue 3.6's compiler-output mode that bypasses Virtual DOM. The same JSX source compiles to Vapor output when the flag is set.

---

## 1. Opt In

### Vite

```ts
// vite.config.ts
import vueJsx from 'vue-jsx/vite'

export default defineConfig({
  plugins: [vueJsx({ vapor: true, macros: true })],
})
```

### ts-macro.config.ts (must match)

```ts
import vueJsx from 'vue-jsx/volar'

export default {
  plugins: [vueJsx({ vapor: true, macros: true })],
}
```

The two configurations MUST be identical. If Vite says `vapor: true` but TS-Macro does not, editor type-checking will diverge from runtime behavior.

---

## 2. When to Use Vapor

- ✅ Target Vue 3.6+ applications where Virtual DOM overhead is measurable.
- ✅ Migration path from `vue-jsx-vapor` to unified `vue-jsx` is straightforward (same syntax).
- ❌ Stay on default Virtual DOM mode for new projects unless Vue 3.6 is the target.

---

## 3. Behavior Differences from Virtual DOM

Vapor components have slightly different semantics:

- No VDOM diffing — updates are direct DOM mutations.
- Some Composition API features (e.g. lifecycle hooks) behave differently.
- SSR output differs from Virtual DOM SSR.

If you flip from Virtual DOM to Vapor, audit:

- All component contracts (`defineProps`, `defineEmits`).
- Lifecycle hook usage (`onMounted`, `onUnmounted`).
- Any reactive system assumptions (e.g. computed re-evaluation timing).
- SSR entry point.

---

## 4. Quick Check

Before enabling Vapor in an existing project:

- [ ] Vue version is 3.6+ in `package.json`.
- [ ] Vite plugin and TS-Macro plugin have IDENTICAL options.
- [ ] Component lifecycle usage reviewed.
- [ ] SSR entry point (if any) updated.
- [ ] Smoke-tested in dev + production builds.