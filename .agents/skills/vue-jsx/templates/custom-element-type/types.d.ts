/**
 * JSX type augmentation for a Custom Element.
 *
 * Rules (enforced by vue-jsx rules):
 * 1. This file MUST be a module — the `export {}` at the end makes it so.
 *    Without it, `declare module 'vue-jsx'` becomes ambient and shadows the real package.
 * 2. Target `vue-jsx`. Augmenting `@vue-jsx/runtime` has NO effect on JSX checking.
 */
import type { JSX } from 'vue-jsx'

declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicElements {
      'my-widget': {
        value?: string
        disabled?: boolean
        onCustomEvent?: (e: CustomEvent<{ id: string }>) => void
      }
    }
  }
}

export {}