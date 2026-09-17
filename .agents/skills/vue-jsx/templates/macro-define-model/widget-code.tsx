/**
 * Vue JSX component using the defineModel macro.
 *
 * Prerequisites:
 * - vite.config.ts: `vueJsx({ macros: true })`
 * - ts-macro.config.ts: matching `vueJsx({ macros: true })`
 *
 * Synchronous reads: do NOT `await nextTick()` after assigning value.value.
 */
import { defineComponent } from 'vue'

export default defineComponent(() => {
  // Required string model — `!` marks required
  const text = defineModel<string>()!

  return () => (
    <div class="counter">
      <input
        value={text.value}
        onInput={(e) => (text.value = (e.target as HTMLInputElement).value)}
      />
      <p>You typed: {text.value}</p>
    </div>
  )
})