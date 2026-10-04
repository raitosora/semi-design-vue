import {
  computed,
  createComponent,
  defineVaporComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useAttrs,
  useSlots,
} from "vue";
import Avatar from "./Avatar.js";
import { provideAvatarGroup } from "./group-context.js";
import type { AvatarGroupEntry, AvatarGroupValues } from "./group-context.js";
import type {
  AvatarGroupItem,
  AvatarGroupProps,
  AvatarGroupSlots,
} from "./group-types.js";
import { nativeAvatarContent, OwnedAvatarContent } from "./render.js";

const groupKeys = new Set([
  "children",
  "v-slots",
  "shape",
  "size",
  "overlapFrom",
  "maxCount",
  "renderMore",
  "class",
  "className",
]);

/** Match isNumber's boxed-number support without coercing arbitrary user objects. */
function numberLimit(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (value === null || typeof value !== "object") return undefined;
  try {
    return Number.prototype.valueOf.call(value) as number;
  } catch {
    // valueOf performs the built-in Number brand check, not user conversion.
    return undefined;
  }
}

/** This context boundary owns additional content without registering it as an input Avatar. */
const MoreBoundary = defineVaporComponent<
  { source: AvatarGroupValues },
  {},
  string,
  {}
>(
  (props: { source: AvatarGroupValues }) => {
    provideAvatarGroup(computed(() => props.source));
    return <slot />;
  },
  { props: ["source"], inheritAttrs: false },
);

const AvatarGroupComponent = defineVaporComponent<
  AvatarGroupProps,
  {},
  string,
  {}
>(
  () => {
    const attrs = useAttrs() as Readonly<AvatarGroupProps>;
    const slots = useSlots();
    const root = ref<HTMLDivElement | null>(null);
    const entries = shallowRef<readonly AvatarGroupEntry[]>([]);
    const ordered = shallowRef<readonly AvatarGroupEntry[]>([]);
    let disposed = false;
    let observer: MutationObserver | undefined;
    const refresh = () => {
      const current = root.value;
      if (!current || disposed) return;
      const next = entries.value
        .filter((entry) => {
          const element = entry.element();
          return element && current.contains(element);
        })
        .sort((a, b) => {
          const left = a.element()!;
          const right = b.element()!;
          return left.compareDocumentPosition(right) & 4 ? -1 : 1;
        });
      if (
        next.length !== ordered.value.length ||
        next.some((entry, index) => entry !== ordered.value[index])
      )
        ordered.value = next;
    };
    const register = (entry: AvatarGroupEntry) => {
      entries.value = [...entries.value, entry];
      refresh();
      return () => {
        entries.value = entries.value.filter((item) => item !== entry);
        refresh();
      };
    };
    const collapsed = computed(() => {
      const maxCount = numberLimit(attrs.maxCount);
      const all = ordered.value;
      // Match the fixed upstream's arithmetic and Array#slice semantics, including NaN and infinities.
      if (
        !slots.default ||
        maxCount === undefined ||
        !(all.length - maxCount > 0)
      )
        return {
          visible: all,
          rest: [] as readonly AvatarGroupEntry[],
          count: 0,
        };
      return {
        visible: all.slice(0, maxCount),
        rest: all.slice(maxCount),
        count: all.length - maxCount,
      };
    });
    const source = computed<AvatarGroupValues>(() => ({
      size: attrs.size === undefined ? "medium" : attrs.size,
      shape: attrs.shape === undefined ? "circle" : attrs.shape,
      overlapFrom:
        attrs.overlapFrom === undefined
          ? "start"
          : attrs.overlapFrom === "start" || attrs.overlapFrom === "end"
            ? attrs.overlapFrom
            : undefined,
      rest: Object.fromEntries(
        Object.entries(attrs).filter(([key]) => !groupKeys.has(key)),
      ),
      register,
      getState: (id) => {
        const index = ordered.value.findIndex((entry) => entry.id === id);
        return { index, hidden: index >= collapsed.value.visible.length };
      },
    }));
    provideAvatarGroup(source);
    const moreSource = computed<AvatarGroupValues>(() => ({
      ...source.value,
      register: () => () => undefined,
      getState: () => ({
        index: collapsed.value.visible.length,
        hidden: false,
      }),
    }));
    const descriptions = computed<readonly AvatarGroupItem[]>(() =>
      Object.freeze(
        collapsed.value.rest.map((entry) =>
          Object.freeze({
            id: entry.id,
            index: ordered.value.indexOf(entry),
            props: Object.freeze({ ...entry.props() }),
            label: entry.label(),
          }),
        ),
      ),
    );
    const moreAlt = computed(
      () =>
        ` Number of remaining Avatars：${collapsed.value.count},${descriptions.value
          .map((item) => item.label)
          .filter((label) => label.length > 0)
          .join(",")}`,
    );
    const moreBranch = computed(() => {
      const renderer = attrs.renderMore;
      const count = collapsed.value.count;
      const remaining = descriptions.value;
      return () =>
        nativeAvatarContent(
          typeof renderer === "function"
            ? renderer(count, remaining)
            : undefined,
        );
    });
    const MoreContent = defineVaporComponent(() =>
      createComponent(OwnedAvatarContent, null, {
        $: [() => ({ name: "default", fn: moreBranch.value })],
      }),
    );
    onMounted(() => {
      refresh();
      const current = root.value;
      const Observer = current?.ownerDocument.defaultView?.MutationObserver;
      if (!current || !Observer) return;
      observer = new Observer(refresh);
      observer.observe(current, { childList: true, subtree: true });
    });
    onBeforeUnmount(() => {
      disposed = true;
      observer?.disconnect();
      entries.value = [];
      ordered.value = [];
    });
    return (
      <div class="semi-avatar-group" ref={root} role="list">
        <slot />
        <MoreBoundary
          v-if={collapsed.value.count > 0}
          source={moreSource.value}
        >
          {() => (
            <>
              <MoreContent v-if={typeof attrs.renderMore === "function"} />
              <Avatar
                alt={moreAlt.value}
                children={`+${collapsed.value.count}`}
                className="semi-avatar-item-more"
                v-else
              />
            </>
          )}
        </MoreBoundary>
      </div>
    );
  },
  { props: [], inheritAttrs: false },
);

type AvatarGroupComponentType = typeof AvatarGroupComponent & {
  new (props: AvatarGroupProps): {
    $props: AvatarGroupProps;
    $slots: AvatarGroupSlots;
  };
};
export const AvatarGroup = AvatarGroupComponent as AvatarGroupComponentType;
export default AvatarGroup;
export type {
  AvatarGroupProps,
  AvatarGroupSlots,
  AvatarGroupItem,
  AvatarGroupShape,
  AvatarGroupSize,
  AvatarGroupOverlapFrom,
} from "./group-types.js";
