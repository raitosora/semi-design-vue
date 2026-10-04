import {
  computed,
  createComponent,
  createFor,
  defineVaporComponent,
  provide,
  useAttrs,
} from "vue";
import type { ShallowRef } from "vue";
import Tag from "./Tag.js";
import Popover from "../popover/Popover.js";
import type {
  PopoverProps,
  PopoverTriggerScope,
  PopoverSlots,
} from "../popover/types.js";
import { tagTriggerKey } from "./trigger-context.js";
import { TagContentView } from "./render.js";
import { tagCallbacks } from "./input.js";
import { createTagGroupEntries } from "./group-input.js";
import type { TagGroupEntry } from "./group-input.js";
import type { TagContent, TagProps } from "./types.js";
import type { TagGroupProps } from "./group-types.js";

const TriggerBoundary = /* @__PURE__ */ defineVaporComponent<
  { scope: PopoverTriggerScope },
  {},
  string,
  {}
>(
  (props: { scope: PopoverTriggerScope }) => {
    provide(
      tagTriggerKey,
      computed(() => props.scope),
    );
    return <slot />;
  },
  { props: ["scope"], inheritAttrs: false },
);
const Item = /* @__PURE__ */ defineVaporComponent<
  { entry: TagGroupEntry; group: TagGroupProps },
  {},
  string,
  {}
>(
  (props) => {
    const item = computed(() => props.entry.value as TagProps);
    const value = computed<TagProps>(() => ({
      ...item.value,
      size: item.value.size || props.group.size || "default",
      avatarShape:
        item.value.avatarShape || props.group.avatarShape || "square",
      tagKey:
        item.value.tagKey ||
        (typeof item.value.children === "string" ||
        typeof item.value.children === "number"
          ? item.value.children
          : undefined),
      onClose: (children, event, tagKey) => {
        const callbacks = [
          ...tagCallbacks(item.value.onClose),
          ...tagCallbacks(props.group.onTagClose),
        ];
        for (const callback of callbacks) callback(children, event, tagKey);
      },
    }));
    return (
      <>
        <TagContentView
          v-if={props.group.mode === "custom"}
          content={props.entry.value as TagContent}
        />
        <Tag v-else {...value.value} />
      </>
    );
  },
  { props: ["entry", "group"], inheritAttrs: false },
);
const TagGroupComponent = /* @__PURE__ */ defineVaporComponent<
  TagGroupProps,
  {},
  string,
  {}
>(
  () => {
    const props = useAttrs() as Readonly<TagGroupProps>;
    const entriesFor = createTagGroupEntries();
    const entries = computed(() => entriesFor(props));
    const merged = computed(() => {
      const all = entries.value;
      const max = props.maxTagCount;
      const count = props.restCount || all.length - (max ?? 0);
      return max !== undefined && count > 0
        ? { normal: all.slice(0, max), rest: all.slice(max), count }
        : { normal: all, rest: [], count: 0 };
    });
    const popup = computed<PopoverProps>(() => ({
      showArrow: true,
      trigger: "hover",
      position: "top",
      autoAdjustOverflow: true,
      className: "semi-tag-rest-group-popover",
      ...props.popoverProps,
    }));
    const tree = (list: () => readonly TagGroupEntry[]) =>
      createFor(
        list,
        (entry: ShallowRef<TagGroupEntry>) =>
          createComponent(Item, {
            entry: () => entry.value,
            group: () => props,
          }),
        (entry) => entry.key,
      );
    const Normal = defineVaporComponent(() => tree(() => merged.value.normal));
    const Rest = defineVaporComponent(() => tree(() => merged.value.rest));
    const hasContent = computed(() =>
      Object.prototype.hasOwnProperty.call(props.popoverProps ?? {}, "content"),
    );
    const Plus = defineVaporComponent(() => (
      <Tag
        closable={false}
        color="grey"
        onMouseEnter={props.onPlusNMouseEnter}
        size={props.size ?? "default"}
        style={{ backgroundColor: "transparent" }}
      >
        {() => <>+{merged.value.count}</>}
      </Tag>
    ));
    const triggerSlot = (scope: PopoverTriggerScope) => (
      <TriggerBoundary scope={scope}>{() => <Plus />}</TriggerBoundary>
    );
    const contentSlot = () => <Rest />;
    const popupSlots = computed<PopoverSlots>(() => ({
      default: triggerSlot,
      ...(hasContent.value ? {} : { content: contentSlot }),
    }));
    return (
      <div
        class={[
          "semi-tag-group",
          props.class,
          props.className,
          {
            "semi-tag-group-max": !!props.maxTagCount,
            "semi-tag-group-small": props.size === "small",
            "semi-tag-group-large": (props.size ?? "default") === "large",
          },
        ]}
        style={props.style}
      >
        <Normal />
        <template v-if={merged.value.count > 0}>
          <Popover
            v-if={props.showPopover}
            {...popup.value}
            v-slots={popupSlots.value}
          />
          <Plus v-else />
        </template>
      </div>
    );
  },
  { props: [], inheritAttrs: false },
);
export const TagGroup = TagGroupComponent;
export default TagGroup;
export type { TagGroupProps } from "./group-types.js";
