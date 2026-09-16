/**
 * Vue JSX component in a mixed React + Vue codebase.
 *
 * The pragma `/** @jsxImportSource vue-jsx */` declares that THIS file
 * uses Vue's JSX runtime, even if the project's tsconfig.json does not set
 * jsxImportSource globally (because it serves React files too).
 */
import { defineComponent, ref } from 'vue'

interface Props {
  label?: string
}

export default defineComponent<Props>((props) => {
  const n = ref(0)
  return () => (
    <button class="btn" onClick={() => n.value++}>
      {props.label ?? 'click'} {n.value}
    </button>
  )
})