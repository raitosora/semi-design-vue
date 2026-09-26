import { computed, defineVaporComponent, useAttrs } from "vue";
import type {
  AvatarProps,
  BasicProps,
  GenericProps,
  ParagraphProps,
} from "./types.js";

const blocked = new Set(["innerHTML", "textContent", "class", "style"]);

function nativeAttrs(attrs: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(attrs).filter(([name]) => !blocked.has(name)),
  );
}

function createItem<T extends GenericProps>(kind: string) {
  const Component = defineVaporComponent<T, {}, string, {}>(
    (props: T) => {
      const attrs = useAttrs();
      const prefix = computed(() =>
        props.prefixCls === undefined ? "semi-skeleton" : props.prefixCls,
      );
      const type = computed(() =>
        props.type === undefined ? kind : props.type,
      );
      const className = computed(() => [
        `${prefix.value}-${type.value}`,
        type.value.toUpperCase() === "AVATAR" &&
          `${prefix.value}-${type.value}-${props.size === undefined ? "medium" : props.size}`,
        type.value.toUpperCase() === "AVATAR" &&
          `${prefix.value}-${type.value}-${props.shape === undefined ? "circle" : props.shape}`,
        attrs.class,
        props.className,
      ]);
      return (
        <div
          {...nativeAttrs(attrs)}
          class={className.value}
          style={props.style}
        />
      );
    },
    {
      props: ["prefixCls", "className", "type", "size", "shape", "style"],
      inheritAttrs: false,
    },
  );
  return Component as typeof Component & {
    new (props: T): { $props: T };
  };
}

export const Avatar = createItem<AvatarProps>("avatar");
export const Image = createItem<BasicProps>("image");
export const Title = createItem<BasicProps>("title");
export const Button = createItem<BasicProps>("button");

const ParagraphComponent = defineVaporComponent<ParagraphProps, {}, string, {}>(
  (props: ParagraphProps) => {
    const attrs = useAttrs();
    const prefix = computed(() =>
      props.prefixCls === undefined ? "semi-skeleton" : props.prefixCls,
    );
    const rows = computed(() => (props.rows === undefined ? 4 : props.rows));
    return (
      <ul
        {...nativeAttrs(attrs)}
        class={[`${prefix.value}-paragraph`, attrs.class, props.className]}
        style={props.style}
      >
        {Array(rows.value)
          .fill(null)
          .map((_, index) => (
            <li key={index} />
          ))}
      </ul>
    );
  },
  {
    props: ["prefixCls", "className", "type", "rows", "style"],
    inheritAttrs: false,
  },
);

export const Paragraph = ParagraphComponent as typeof ParagraphComponent & {
  new (props: ParagraphProps): { $props: ParagraphProps };
};
