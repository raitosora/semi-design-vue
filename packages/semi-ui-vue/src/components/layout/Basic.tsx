import {
  computed,
  createDynamicComponent,
  createSlot,
  defineVaporComponent,
  useAttrs,
} from "vue";
import type { BasicProps, BasicSlots } from "./types.js";

const blockedAttrs = new Set([
  "innerHTML",
  "textContent",
  "inner-html",
  "text-content",
  "x-semi-prop",
]);

interface BasicPart {
  new (props: BasicProps): { $props: BasicProps; $slots: BasicSlots };
}

export function makeBasic(
  defaultTag: keyof HTMLElementTagNameMap,
  defaultType: string,
): BasicPart {
  const Component = defineVaporComponent<BasicProps, {}, string, {}>(
    (props: BasicProps) => {
      const attrs = useAttrs();
      const nativeAttrs = computed(() =>
        Object.fromEntries(
          Object.entries(attrs).filter(
            ([name]) => !blockedAttrs.has(name) && name !== "class",
          ),
        ),
      );
      const prefix = computed(() =>
        props.prefixCls === undefined ? "semi-layout" : props.prefixCls,
      );
      return createDynamicComponent(
        () => (props.tagName === undefined ? defaultTag : props.tagName),
        {
          class: () => [
            `${prefix.value}-${props.type === undefined ? defaultType : props.type}`,
            attrs.class,
            props.className,
          ],
          style: () => props.style,
          "x-semi-prop": "children",
          $: [() => nativeAttrs.value],
        },
        { default: () => createSlot() },
        1,
      );
    },
    {
      props: ["prefixCls", "className", "tagName", "type", "style", "children"],
      inheritAttrs: false,
    },
  );
  return Component as unknown as BasicPart;
}

export const Header = makeBasic("header", "header");
export const Footer = makeBasic("footer", "footer");
export const Content = makeBasic("main", "content");
