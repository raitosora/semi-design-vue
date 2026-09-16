# Events, Slots, Refs

---

## 1. Events

### Native DOM events

Use `onXxx` props in camelCase. The handler receives a native `Event`:

```tsx
<input
  value={text.value}
  onInput={(e) => (text.value = (e.target as HTMLInputElement).value)}
  onKeydown={(e) => e.key === 'Enter' && submit()}
/>
```

### Event modifiers — NOT supported

`@click.stop`, `@submit.prevent` etc. are NOT supported in JSX form. Call methods directly:

```tsx
<button
  onClick={(e) => {
    e.stopPropagation()
    e.preventDefault()
    doIt()
  }}
/>
```

For repeated patterns, write a small helper:

```ts
const stop = (fn: (e: Event) => void) => (e: Event) => {
  e.stopPropagation()
  fn(e)
}
```

### Custom component events

Define them in the component's emit signature, then listen via `onXxx`:

```tsx
// Child
const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

// Parent
<List onSelect={(id) => console.log(id)} />
```

---

## 2. Slots

### Default slot (single function child)

```tsx
<Layout>{() => <p>Body</p>}</Layout>
```

### Named slots (object form)

```tsx
<Layout>
  {{
    header: () => <h1>Title</h1>,
    default: () => <p>Body</p>,
    footer: () => <small>©</small>,
  }}
</Layout>
```

The `default` key is the unnamed slot. Other keys are named slots.

### Scoped slots

```tsx
<DataTable items={data}>
  {{
    row: (row: Row) => <strong>{row.name}</strong>,
  }}
</DataTable>
```

The slot function receives the slot props.

### Conditional slots

```tsx
<Layout>
  {{
    header: () => <h1>Title</h1>,
    default: () => isLoading.value
      ? <Spinner />
      : <Content />,
  }}
</Layout>
```

### Slot children must be functions

```tsx
// ✅ Correct — render function
<Layout>{() => <p>hi</p>}</Layout>

// ❌ Forbidden — string/element is not a slot function
<Layout>{"hello"}</Layout>
<Layout><p>hi</p></Layout>
```

---

## 3. Refs

### `useRef()` from `vue-jsx`

```tsx
import { useRef } from 'vue-jsx'

const inputRef = useRef<HTMLInputElement>()
return <input ref={inputRef} />
```

`useRef` returns a ref-like object compatible with Vue's ref system. Access the value via `.value`.

### `ref()` from `vue`

```tsx
import { ref } from 'vue'

const r = ref<HTMLInputElement | null>(null)
// later
r.value?.focus()
```

### Component refs

```tsx
import { useRef } from 'vue-jsx'

const childRef = useRef()

return <MyChild ref={childRef} />

// later
childRef.value?.exposedMethod()
```

The exposed surface is what you declared via `defineExpose`.

---

## 4. Forbidden Patterns

| ❌ Anti-pattern | ✅ Correct |
|---|---|
| `onclick={...}` (lowercase) | `onClick={...}` (camelCase) |
| `@click.stop` syntax | `e.stopPropagation()` in handler |
| `<Layout>{"text"}</Layout>` (string child as slot) | `<Layout>{() => <x />}</Layout>` |
| `useRef` from `vue` | `useRef` from `vue-jsx` (preferred) |
| String event names `'click'` | CamelCase event names `onClick` |