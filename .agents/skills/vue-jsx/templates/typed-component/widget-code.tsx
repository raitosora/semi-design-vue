/**
 * Vue JSX component with typed props, emits, and reactive state.
 * Copy and rename the interfaces when authoring a new component.
 */
import { defineComponent, ref } from 'vue'

interface Props {
  size: 'small' | 'large'
  initialCount?: number
}

interface ClickPayload {
  count: number
}

export default defineComponent<Props>((props) => {
  const count = ref(props.initialCount ?? 0)

  // Render
  return () => (
    <button
      class={`btn btn-${props.size}`}
      onClick={() => (count.value += 1)}
    >
      clicked {count.value} times
    </button>
  )
})