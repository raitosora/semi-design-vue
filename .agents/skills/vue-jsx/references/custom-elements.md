# Custom Elements

Vue JSX supports both **consuming** existing Custom Elements and **defining new ones** with the same JSX syntax, in both Virtual DOM and Vapor modes.

---

## 1. Consuming a Custom Element

```tsx
<my-widget value="x" onCustomEvent={(e) => console.log(e.detail.id)} />
```

`my-widget` is treated like any other intrinsic element. To get TypeScript support, augment the JSX types (see §3).

---

## 2. Defining a Custom Element

```ts
// my-widget.ts
import { defineCustomElement } from 'vue'

const MyWidget = defineCustomElement({
  props: { value: String },
  emits: ['custom-event'],
  template: `<div @custom-event="$emit('custom-event', { id: $el.id })">{{ value }}</div>`,
})

customElements.define('my-widget', MyWidget)
```

Then use it in any `.tsx`:

```tsx
<my-widget value="x" onCustomEvent={(e) => console.log(e.detail.id)} />
```

---

## 3. TypeScript Augmentation

Custom elements need explicit type augmentation:

```ts
// types/jsx.d.ts
import type { JSX } from 'vue-jsx'

declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicElements {
      'my-widget': {
        value?: string
        onCustomEvent?: (e: CustomEvent<{ id: string }>) => void
      }
    }
  }
}

export {} // module marker
```

Then `<my-widget />` type-checks with the defined props.

---

## 4. Common Patterns

### Boolean attributes

```ts
declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicElements {
      'my-toggle': { disabled?: boolean }
    }
  }
}
```

```tsx
<my-toggle disabled />
```

### String union props

```ts
declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicElements {
      'my-button': { variant?: 'primary' | 'secondary' }
    }
  }
}
```

```tsx
<my-button variant="primary">Click</my-button>
```

### Event handlers with typed detail

```ts
declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicElements {
      'my-input': {
        onSubmit?: (e: CustomEvent<{ value: string }>) => void
      }
    }
  }
}
```

```tsx
<my-input onSubmit={(e) => console.log(e.detail.value)} />
```

---

## 5. Rules Reminder

When augmenting JSX types:

1. The file MUST be a module (`export {}` or any `import`/`export`).
2. Target `'vue-jsx'`, NOT `'@vue-jsx/runtime'`.

See `jsx-namespace.md` for full details.