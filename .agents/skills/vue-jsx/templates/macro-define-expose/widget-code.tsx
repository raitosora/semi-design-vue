/**
 * Vue JSX component exposing methods via defineExpose, accessed by parent through ref.
 *
 * Prerequisites:
 * - vite.config.ts: `vueJsx({ macros: true })`
 * - ts-macro.config.ts: matching `vueJsx({ macros: true })`
 */
import { defineComponent, ref } from 'vue'
import { defineExpose, useRef } from 'vue-jsx'

const Counter = defineComponent(() => {
  const count = ref(0)

  defineExpose({
    increment: () => (count.value += 1),
    get value() { return count.value },
  })

  return () => <span class="count">{count.value}</span>
})

export default defineComponent(() => {
  const counterRef = useRef<InstanceType<typeof Counter>>()

  return () => (
    <div>
      <Counter ref={counterRef} />
      <button onClick={() => counterRef.value?.increment()}>+ from parent</button>
    </div>
  )
})