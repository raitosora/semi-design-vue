import { computed, defineVaporComponent, useAttrs } from "vue";
import { Avatar, Button, Image, Paragraph, Title } from "./item.js";
import type { SkeletonProps, SkeletonSlots } from "./types.js";

const blocked = new Set(["innerHTML", "textContent", "class", "style"]);

const Component = defineVaporComponent<SkeletonProps, {}, string, {}>(
  (props: SkeletonProps) => {
    const attrs = useAttrs();
    const nativeAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([name]) => !blocked.has(name)),
      ),
    );
    return (
      <>
        {props.loading === undefined || props.loading ? (
          <div
            {...nativeAttrs.value}
            class={[
              "semi-skeleton",
              Boolean(props.active) && "semi-skeleton-active",
              attrs.class,
              props.className,
            ]}
            style={props.style}
            x-semi-prop="placeholder"
          >
            <slot name="placeholder" />
          </div>
        ) : (
          <slot />
        )}
      </>
    );
  },
  {
    props: [
      "active",
      "loading",
      "placeholder",
      "className",
      "style",
      "children",
    ],
    inheritAttrs: false,
  },
);

export const Skeleton = Object.assign(Component, {
  Avatar,
  Title,
  Button,
  Paragraph,
  Image,
}) as typeof Component & {
  new (props: SkeletonProps): {
    $props: SkeletonProps;
    $slots: SkeletonSlots;
  };
  Avatar: typeof Avatar;
  Title: typeof Title;
  Button: typeof Button;
  Paragraph: typeof Paragraph;
  Image: typeof Image;
};

export default Skeleton;
