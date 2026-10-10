import { safeCardAttrs } from "./attrs.js";
import { computed, defineVaporComponent, useAttrs, useSlots } from "vue";
import { CardActions } from "./actions.js";
import Skeleton from "../skeleton/index.js";
import Space from "../space/index.js";
import Title from "../typography/title.js";
import Meta from "./meta.js";
import { CardContentView } from "./render.js";
import type { CardProps, CardSlots } from "./types.js";

const Component = defineVaporComponent<CardProps, {}, string, {}>(
  (props: CardProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const nativeAttrs = computed(() => safeCardAttrs(attrs));
    const header = computed(() => Boolean(slots.header || props.header));
    const title = computed(() => Boolean(slots.title || props.title));
    const extra = computed(() =>
      Boolean(slots.headerExtraContent || props.headerExtraContent),
    );
    const cover = computed(() => Boolean(slots.cover || props.cover));
    const body = computed(() => Boolean(slots.default || props.children));
    const footer = computed(() => Boolean(slots.footer || props.footer));
    const actions = computed(() =>
      Array.isArray(props.actions)
        ? props.actions.flatMap((content, index) => [{ content, index }])
        : undefined,
    );
    const loading = computed(() =>
      props.loading === undefined ? false : props.loading,
    );
    return (
      <div
        {...nativeAttrs.value}
        aria-busy={loading.value}
        class={[
          "semi-card",
          (props.bordered === undefined || props.bordered) &&
            "semi-card-bordered",
          props.shadows && "semi-card-shadows",
          props.shadows && `semi-card-shadows-${props.shadows}`,
          attrs.class,
          props.className,
        ]}
        style={props.style}
      >
        {header.value || title.value || extra.value ? (
          <div
            class={[
              "semi-card-header",
              (props.headerLine === undefined || props.headerLine) &&
                "semi-card-header-bordered",
            ]}
            style={props.headerStyle}
          >
            {header.value ? (
              <>
                {slots.header ? (
                  <slot name="header" />
                ) : (
                  <CardContentView content={props.header} />
                )}
              </>
            ) : (
              <div class="semi-card-header-wrapper">
                {extra.value ? (
                  <div
                    class="semi-card-header-wrapper-extra"
                    x-semi-prop="headerExtraContent"
                  >
                    {slots.headerExtraContent ? (
                      <slot name="headerExtraContent" />
                    ) : (
                      <CardContentView content={props.headerExtraContent} />
                    )}
                  </div>
                ) : (
                  <CardContentView content={props.headerExtraContent} />
                )}
                {title.value ? (
                  <div
                    class={[
                      "semi-card-header-wrapper-title",
                      extra.value && "semi-card-header-wrapper-spacing",
                    ]}
                  >
                    {slots.title ? (
                      <slot name="title" />
                    ) : typeof props.title === "string" ? (
                      <Title
                        children={props.title}
                        ellipsis={{ showTooltip: true, rows: 1 }}
                        heading={6}
                        x-semi-prop="title"
                      />
                    ) : (
                      <CardContentView content={props.title} />
                    )}
                  </div>
                ) : (
                  <CardContentView content={props.title} />
                )}
              </div>
            )}
          </div>
        ) : null}
        {cover.value ? (
          <div class="semi-card-cover" x-semi-prop="cover">
            {slots.cover ? (
              <slot name="cover" />
            ) : (
              <CardContentView content={props.cover} />
            )}
          </div>
        ) : (
          <CardContentView content={props.cover} />
        )}
        <div class="semi-card-body" style={props.bodyStyle}>
          {body.value ? (
            <Skeleton active loading={loading.value}>
              {{
                placeholder: () => (
                  <div>
                    <Skeleton.Title />
                    <br />
                    <Skeleton.Paragraph rows={3} />
                  </div>
                ),
                default: () => (
                  <>
                    {slots.default ? (
                      <slot />
                    ) : (
                      <CardContentView content={props.children} />
                    )}
                  </>
                ),
              }}
            </Skeleton>
          ) : (
            <CardContentView content={props.children} />
          )}
          {actions.value ? (
            <div class="semi-card-body-actions">
              <Space spacing={12}>
                {() => (
                  <>
                    <CardActions entries={actions.value!} />
                  </>
                )}
              </Space>
            </div>
          ) : null}
        </div>
        {footer.value ? (
          <div
            class={[
              "semi-card-footer",
              props.footerLine && "semi-card-footer-bordered",
            ]}
            style={props.footerStyle}
            x-semi-prop="footer"
          >
            {slots.footer ? (
              <slot name="footer" />
            ) : (
              <CardContentView content={props.footer} />
            )}
          </div>
        ) : (
          <CardContentView content={props.footer} />
        )}
      </div>
    );
  },
  {
    props: [
      "actions",
      "bodyStyle",
      "bordered",
      "className",
      "children",
      "cover",
      "headerExtraContent",
      "footer",
      "footerLine",
      "footerStyle",
      "header",
      "headerLine",
      "headerStyle",
      "loading",
      "shadows",
      "style",
      "title",
    ],
    inheritAttrs: false,
  },
);
export const Card = Object.assign(Component, { Meta }) as typeof Component & {
  new (props: CardProps): { $props: CardProps; $slots: CardSlots };
  Meta: typeof Meta;
};
export default Card;
