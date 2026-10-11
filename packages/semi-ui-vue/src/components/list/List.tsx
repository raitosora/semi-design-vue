import {
  computed,
  defineVaporComponent,
  provide,
  useAttrs,
  useSlots,
  type VaporComponentInstance,
  type VaporPublicProps,
} from "vue";
import Row from "../grid/Row.js";
import Spin from "../spin/index.js";
import { useLocaleContext } from "../locale/context.js";
import { listContextKey } from "./context.js";
import { ListData } from "./data.js";
import { ListContentView } from "./render.js";
import Item from "./item.js";
import type { Grid, ListProps, ListSlots } from "./types.js";
export function listRowProps(grid: Grid) {
  return Object.fromEntries(
    ["align", "gutter", "justify", "type"]
      .filter((key) => key in grid)
      .map((key) => [key, grid[key as keyof Grid]]),
  );
}
const ListScope = defineVaporComponent<ListProps, {}, string, {}>(
  (props: ListProps) => {
    provide(
      listContextKey,
      computed(() => ({
        grid: props.grid,
        onClick: props.onClick,
        onRightClick: props.onRightClick,
      })),
    );
    return <slot />;
  },
  { props: ["grid", "onClick", "onRightClick"], inheritAttrs: false },
);
const Component = defineVaporComponent<ListProps, {}, string, {}>(
  (props: ListProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const locale = useLocaleContext(() => "List");
    const empty = computed(
      () => !props.dataSource?.length && !slots.default && !props.children,
    );
    const row = computed(() => (props.grid ? listRowProps(props.grid) : {}));

    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
      ),
    );
    const size = computed(() =>
      props.size === undefined ? "default" : props.size,
    );
    return (
      <div
        {...dataAttrs.value}
        class={[
          "semi-list",
          attrs.class,
          props.className,
          props.layout === "horizontal" && "semi-list-flex",
          size.value && `semi-list-${size.value}`,
          props.grid && "semi-list-grid",
          (props.split === undefined || props.split) && "semi-list-split",
          props.bordered && "semi-list-bordered",
        ]}
        style={props.style}
      >
        {slots.header || props.header ? (
          <div class="semi-list-header" x-semi-prop="header">
            {slots.header ? (
              <slot name="header" />
            ) : (
              <ListContentView content={props.header} />
            )}
          </div>
        ) : null}
        <ListScope
          grid={props.grid}
          onClick={props.onClick}
          onRightClick={props.onRightClick}
        >
          {() => (
            <Spin
              size="large"
              spinning={
                props.loading
                  ? true
                  : props.loading === undefined
                    ? false
                    : props.loading
              }
            >
              {() => (
                <>
                  {props.grid ? (
                    <Row type="flex" {...row.value}>
                      {() => (
                        <>
                          <ListData
                            dataSource={props.dataSource}
                            renderItem={props.renderItem}
                          />
                          {empty.value ? (
                            <div
                              class="semi-list-empty"
                              x-semi-prop={
                                slots.emptyContent || props.emptyContent
                                  ? "emptyContent"
                                  : undefined
                              }
                            >
                              {slots.emptyContent ? (
                                <slot name="emptyContent" />
                              ) : props.emptyContent ? (
                                <ListContentView content={props.emptyContent} />
                              ) : (
                                <ListContentView
                                  content={
                                    locale.value.componentLocale!.emptyText
                                  }
                                />
                              )}
                            </div>
                          ) : null}
                          {slots.default ? (
                            <slot />
                          ) : (
                            <ListContentView content={props.children} />
                          )}
                        </>
                      )}
                    </Row>
                  ) : (
                    <ul class="semi-list-items">
                      <ListData
                        dataSource={props.dataSource}
                        renderItem={props.renderItem}
                      />
                      {empty.value ? (
                        <div
                          class="semi-list-empty"
                          x-semi-prop={
                            slots.emptyContent || props.emptyContent
                              ? "emptyContent"
                              : undefined
                          }
                        >
                          {slots.emptyContent ? (
                            <slot name="emptyContent" />
                          ) : props.emptyContent ? (
                            <ListContentView content={props.emptyContent} />
                          ) : (
                            <ListContentView
                              content={locale.value.componentLocale!.emptyText}
                            />
                          )}
                        </div>
                      ) : null}
                      {slots.default ? (
                        <slot />
                      ) : (
                        <ListContentView content={props.children} />
                      )}
                    </ul>
                  )}
                </>
              )}
            </Spin>
          )}
        </ListScope>
        {slots.footer || props.footer ? (
          <div class="semi-list-footer" x-semi-prop="footer">
            {slots.footer ? (
              <slot name="footer" />
            ) : (
              <ListContentView content={props.footer} />
            )}
          </div>
        ) : null}
        {slots.loadMore || props.loadMore ? (
          <>
            {slots.loadMore ? (
              <slot name="loadMore" />
            ) : (
              <ListContentView content={props.loadMore} />
            )}
          </>
        ) : null}
      </div>
    );
  },
  {
    props: [
      "style",
      "className",
      "children",
      "bordered",
      "footer",
      "header",
      "layout",
      "size",
      "split",
      "emptyContent",
      "dataSource",
      "renderItem",
      "grid",
      "loading",
      "loadMore",
      "onClick",
      "onRightClick",
    ],
    inheritAttrs: false,
  },
);
export const List = Object.assign(Component, { Item }) as unknown as {
  new <T = unknown>(
    props: ListProps<T>,
  ): VaporComponentInstance<ListProps<T> & VaporPublicProps, {}, {}, {}> & {
    $slots: ListSlots;
  };
  Item: typeof Item;
};
export default List;
