import {
  computed,
  defineVaporComponent,
  inject,
  useAttrs,
  useSlots,
} from "vue";
import Col from "../grid/Col.js";
import { listContextKey } from "./context.js";
import { ListContentView } from "./render.js";
import type { ListItemProps, ListItemSlots } from "./types.js";
function dispatch(handler: ListItemProps["onClick"], event: unknown) {
  if (handler) handler(event as MouseEvent);
}
const Component = defineVaporComponent<ListItemProps, {}, string, {}>(
  (props: ListItemProps) => {
    const context = inject(listContextKey, undefined);
    if (!context) throw new Error("List.Item must be inside List.");
    const columns = computed(() => {
      const {
        gutter: _gutter,
        justify: _justify,
        type: _type,
        align: _align,
        ...rest
      } = context.value.grid || {};
      return rest;
    });

    const attrs = useAttrs();
    const slots = useSlots();
    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
      ),
    );
    const header = computed(() => Boolean(slots.header || props.header));
    const main = computed(() => Boolean(slots.main || props.main));
    const extra = computed(() => Boolean(slots.extra || props.extra));
    const align = computed(() =>
      props.align === undefined ? "flex-start" : props.align,
    );
    const content = () => (
      <li
        {...dataAttrs.value}
        class={["semi-list-item", attrs.class, props.className]}
        onClick={(event) =>
          dispatch(props.onClick || context.value.onClick, event)
        }
        onContextmenu={(event) =>
          dispatch(props.onRightClick || context.value.onRightClick, event)
        }
        onMouseenter={(event) => dispatch(props.onMouseEnter, event)}
        onMouseleave={(event) => dispatch(props.onMouseLeave, event)}
        style={props.style}
      >
        {header.value || main.value ? (
          <div
            class={[
              "semi-list-item-body",
              align.value && `semi-list-item-body-${align.value}`,
            ]}
          >
            {header.value ? (
              <div class="semi-list-item-body-header">
                {slots.header ? (
                  <slot name="header" />
                ) : (
                  <ListContentView content={props.header} />
                )}
              </div>
            ) : null}
            {main.value ? (
              <div class="semi-list-item-body-main">
                {slots.main ? (
                  <slot name="main" />
                ) : (
                  <ListContentView content={props.main} />
                )}
              </div>
            ) : null}
          </div>
        ) : null}
        {slots.default ? (
          <slot />
        ) : (
          <ListContentView content={props.children} />
        )}
        {extra.value ? (
          <div class="semi-list-item-extra">
            {slots.extra ? (
              <slot name="extra" />
            ) : (
              <ListContentView content={props.extra} />
            )}
          </div>
        ) : null}
      </li>
    );
    return (
      <>
        {context.value.grid ? (
          <Col {...columns.value}>{content}</Col>
        ) : (
          content()
        )}
      </>
    );
  },
  {
    props: [
      "extra",
      "header",
      "main",
      "align",
      "className",
      "children",
      "style",
      "onClick",
      "onRightClick",
      "onMouseLeave",
      "onMouseEnter",
    ],
    inheritAttrs: false,
  },
);
export const ListItem = Component as typeof Component & {
  new (props: ListItemProps): { $props: ListItemProps; $slots: ListItemSlots };
};
export default ListItem;
export type { ListItemProps, ListItemSlots } from "./types.js";
