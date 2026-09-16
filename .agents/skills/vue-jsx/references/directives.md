# Vue Directives in JSX

Vue directives are written directly in JSX using the JSX attribute form — never as string literals.

---

## Directive Reference Table

| Directive | JSX syntax | Notes |
|---|---|---|
| `v-if` | `v-if={cond}` | Pair with `v-else-if`, `v-else` siblings. Prefer ternary or `&&` for simple cases. |
| `v-show` | `v-show={visible}` | Toggles `display` only (cheaper than `v-if`). |
| `v-for` | `v-for={item in list}` | ALWAYS pair with `key`. Item can be destructured: `v-for={({ id, name }) in list}`. |
| `v-model` | `v-model={value}` or `v-model:foo={value}` | For components, prefer the `defineModel` macro (synchronous). |
| `v-bind` / `:` | `{...obj}` spread, or `v-bind={obj}` | Use `v-bind` for object binding. |
| `v-on` / `@` | `onClick={...}`, `onInput={...}` | camelCase. NO modifiers in JSX form. |
| `v-slot` | `v-slot={{ default: (p) => <x /> }}` | Slot name → render function. |
| `v-pre` | `v-pre` (no value) | Skips compilation of children. |
| `v-once` | `v-once` (no value) | One-time render. |
| `v-html` | `v-html={str}` | Raw HTML; sanitize input. |
| `v-text` | `v-text={str}` | Sets `textContent`. |
| `v-memo` | `v-memo={[dep1, dep2]}` | Memoizes sub-tree until deps change. |
| `v-cloak` | n/a in JSX | Use CSS `[v-cloak] { display: none }` or remove via `v-show`. |
| Custom | `v-name={value}` | Resolved by Vue at runtime. |

---

## Examples

### Conditional rendering

```tsx
// v-if
<div v-if={ok}>yes</div>
<div v-else-if={maybe}>maybe</div>
<div v-else>no</div>

// Ternary (preferred for simple cases)
{ok ? <span>yes</span> : <span>no</span>}

// Short-circuit
{cond && <Tag>shown</Tag>}
```

### List rendering

```tsx
// v-for with key
<ul>
  {list.map((item) => <li v-for={item} key={item.id}>{item.name}</li>)}
</ul>

// Destructured
{list.map(({ id, name }) => <li v-for={{ id, name }} key={id}>{name}</li>)}
```

`key` MUST be a stable primitive (id), not the array index unless the list is truly static.

### `v-show`

```tsx
<div v-show={visible}>toggles display</div>
```

### `v-model` with raw value

```tsx
const text = ref('')
return <input v-model={text.value} />
```

With components, prefer `defineModel` (see `macros.md`).

### `v-bind` object

```tsx
const props = { id: 'x', class: 'a' }
return <div v-bind={props}>hi</div>
// or use spread
return <div {...props}>hi</div>
```

### `v-slot`

```tsx
<DataTable items={data}>
  {{
    default: (row) => <span>{row.name}</span>,
    footer: () => <p>End</p>,
  }}
</DataTable>
```

See `events-slots-refs.md` for full slot patterns.

### `v-html` (with caution)

```tsx
const safe = computed(() => DOMPurify.sanitize(raw.value))
return <article v-html={safe.value} />
```

Always sanitize — raw `v-html` is an XSS vector.

### `v-once` and `v-memo`

```tsx
// Static — never re-renders
<StaticHeader v-once />

// Renders only while deps unchanged
<ExpensiveList v-memo={[items.length, filter.value]} items={items} />
```

---

## Event Modifiers — NOT Supported

JSX does not support `v-on:click.stop` style modifiers. Call them in the handler:

```tsx
<div
  onClick={(e) => {
    e.stopPropagation()
    e.preventDefault()
    doIt()
  }}
/>
```

For repeated patterns, wrap into a helper or use Vue's `withModifiers` (if available).

---

## ESLint Ordering

Always use `jsx-sort-props` with directive reservations:

```ts
'vue-jsx/jsx-sort-props': [
  2,
  {
    reservedFirst: ['v-if', 'v-for', 'v-show'],
    reservedLast: ['v-slot', 'v-model'],
  },
],
```

This ensures directives always sit at the top/bottom in a consistent order.