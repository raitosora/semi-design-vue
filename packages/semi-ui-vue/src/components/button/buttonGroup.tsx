import {
  computed,
  defineVaporComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
} from "vue";
import { provideButtonGroup } from "./group-context.js";
import type { ButtonGroupEntry } from "./group-context.js";
import type { ButtonGroupProps, ButtonGroupSlots } from "./types.js";

const prefixCls = "semi-button";

/** Vapor anchors and empty branches are not rendered children. */
function hasFollowingContent(button: HTMLButtonElement, owned: WeakSet<Node>) {
  let node = button.nextSibling;
  while (node) {
    if (
      !owned.has(node) &&
      (node.nodeType === 1 || (node.nodeType === 3 && node.textContent?.trim()))
    )
      return true;
    node = node.nextSibling;
  }
  return false;
}

function lineClass(entry: ButtonGroupEntry) {
  const {
    theme = "light",
    type = "primary",
    disabled = false,
  } = entry.readProps();
  if (theme === "outline") return undefined;
  return [
    `${prefixCls}-group-line`,
    `${prefixCls}-group-line-${theme}`,
    `${prefixCls}-group-line-${type}`,
    disabled && `${prefixCls}-group-line-disabled`,
  ]
    .filter(Boolean)
    .join(" ");
}

const ButtonGroupComponent = defineVaporComponent<
  ButtonGroupProps,
  {},
  string,
  {}
>(
  () => {
    const attrs = useAttrs() as Readonly<Record<string, unknown>>;
    const root = ref<HTMLElement | null>(null);
    const entries = new Map<ButtonGroupEntry, HTMLSpanElement | undefined>();
    const owned = new WeakSet<Node>();
    let disposed = false;
    let observer: MutationObserver | undefined;
    const refresh = () => {
      const current = root.value;
      if (!current || disposed) return;
      for (const [entry, previous] of entries) {
        const direct = entry.element.parentElement === current;
        entry.setDirect(direct);
        const className =
          direct && hasFollowingContent(entry.element, owned)
            ? lineClass(entry)
            : undefined;
        if (!className) {
          previous?.remove();
          entries.set(entry, undefined);
        } else {
          const line = previous ?? current.ownerDocument.createElement("span");
          owned.add(line);
          line.dataset.semiButtonLine = "";
          if (line.className !== className) line.className = className;
          if (entry.element.nextSibling !== line) entry.element.after(line);
          entries.set(entry, line);
        }
      }
    };
    const register = (entry: ButtonGroupEntry) => {
      entries.set(entry, undefined);
      // Initial mount and native-root replacements are reconciled only after insertion.
      return () => {
        entries.get(entry)?.remove();
        entries.delete(entry);
        refresh();
      };
    };
    const group = computed(() => {
      const present = new Set<string>();
      const values: Record<string, unknown> = {};
      for (const key of ["disabled", "size", "type", "theme", "colorful"]) {
        if (Object.hasOwn(attrs, key)) {
          present.add(key);
          values[key] = attrs[key];
        }
      }
      present.add("size");
      if (values.size === undefined) values.size = "default";
      return { ...values, present, register };
    });
    provideButtonGroup(group);
    onMounted(() => {
      refresh();
      const current = root.value;
      const Observer = current?.ownerDocument.defaultView?.MutationObserver;
      if (!current || !Observer) return;
      observer = new Observer((records) => {
        const external = records.some(
          (record) =>
            !owned.has(record.target) &&
            (record.type !== "childList" ||
              [...record.addedNodes, ...record.removedNodes].some(
                (node) => !owned.has(node),
              )),
        );
        if (external) refresh();
      });
      observer.observe(current, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class", "disabled"],
      });
    });
    onBeforeUnmount(() => {
      disposed = true;
      observer?.disconnect();
      for (const line of entries.values()) line?.remove();
      entries.clear();
    });
    return (
      <div
        aria-label={attrs["aria-label"] as string | undefined}
        class={[`${prefixCls}-group`, attrs.class, attrs.className]}
        ref={root}
        role="group"
        style={attrs.style as ButtonGroupProps["style"]}
      >
        <slot />
      </div>
    );
  },
  { props: [], inheritAttrs: false },
);

type ButtonGroupComponentType = typeof ButtonGroupComponent & {
  new (props: ButtonGroupProps): {
    $props: ButtonGroupProps;
    $slots: ButtonGroupSlots;
  };
};
export const ButtonGroup = ButtonGroupComponent as ButtonGroupComponentType;
export default ButtonGroup;
export type { ButtonGroupProps, ButtonGroupSlots, Theme } from "./types.js";
