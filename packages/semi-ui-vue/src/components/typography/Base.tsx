import {
  computed,
  createDynamicComponent,
  setStaticTemplateRef,
  defineVaporComponent,
  inject,
  onBeforeUnmount,
  provide,
  shallowRef,
  useAttrs,
  useSlots,
  watch,
} from "vue";
import type { Block, InjectionKey, Ref, VaporRenderResult } from "vue";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import { useLocaleContext } from "../locale/context.js";
import Tooltip from "../tooltip/Tooltip.js";
import Popover from "../popover/Popover.js";
import type { TooltipTriggerScope } from "../tooltip/types.js";
import { TypographyContentView } from "./render.js";
import {
  ellipsisOptions,
  cssEllipsis,
  typographyPopover,
  mergeTypographyAttrs,
  typographyKeys,
  validateContent,
} from "./input.js";
import { useTypographyMeasure } from "./measure.js";
import Decorations from "./decorations.js";
import Copyable from "./copyable.js";
import type {
  BaseTypographyProps,
  CopyableConfig,
  CopyEvent,
  ShowTooltip,
  TypographyBaseSize,
} from "./types.js";
const sizeKey: InjectionKey<Readonly<Ref<TypographyBaseSize>>> = Symbol(
  "semi-typography-size",
);
const defaults = {
  copyable: false,
  delete: false,
  disabled: false,
  ellipsis: false,
  icon: "",
  mark: false,
  underline: false,
  strong: false,
  link: false,
  type: "primary",
  spacing: "normal",
  size: "normal",
  className: "",
  children: null,
} as const;
export const Base = defineVaporComponent<BaseTypographyProps, {}, string, {}>(
  (props) => {
    const containerDefaults = createDefaultPropsResolver(
      semiGlobal,
      "Typography",
      { component: "article" },
    );
    const attrs = useAttrs();
    const slots = useSlots();
    const hasSlot = computed(() => Boolean(slots.default));
    const locale = useLocaleContext(() => "Typography");
    const inheritedSize = inject(
      sizeKey,
      shallowRef<TypographyBaseSize>("normal"),
    );
    const source = computed(() => {
      validateContent(props.children);
      validateContent(props.icon);
      return {
        ...defaults,
        ...Object.fromEntries(
          Object.entries(props).filter(([, value]) => value !== undefined),
        ),
      } as BaseTypographyProps;
    });
    const size = computed(() =>
      source.value.size === "inherit"
        ? inheritedSize.value
        : source.value.size!,
    );
    provide(sizeKey, size);
    const root = shallowRef<HTMLElement | null>(null);
    const operation = shallowRef<HTMLElement | null>(null);
    const textElement = shallowRef<HTMLElement | null>(null);
    const expanded = shallowRef(false);
    let active = true;
    onBeforeUnmount(() => {
      active = false;
    });
    const options = computed(() =>
      ellipsisOptions(
        source.value.ellipsis,
        locale.value.componentLocale!.expand,
        locale.value.componentLocale!.collapse,
      ),
    );
    const enabled = computed(
      () =>
        Boolean(source.value.ellipsis) &&
        !hasSlot.value &&
        typeof source.value.children === "string",
    );
    const css = computed(() =>
      cssEllipsis(source.value.copyable, options.value),
    );
    const measured = useTypographyMeasure(root, textElement, operation, () => ({
      text:
        typeof source.value.children === "string"
          ? source.value.children
          : undefined,
      options: options.value,
      enabled: enabled.value,
      css: css.value,
      expanded: expanded.value,
      strong: Boolean(source.value.strong),
    }));
    watch(
      () => source.value.children,
      () => {
        expanded.value = false;
      },
    );
    const show = computed(
      () =>
        enabled.value &&
        !expanded.value &&
        measured.overflow.value &&
        !options.value.expandable &&
        options.value.expandText === undefined &&
        Boolean(options.value.showTooltip),
    );
    const tip = computed<ShowTooltip>(() =>
      typeof options.value.showTooltip === "object"
        ? { type: "tooltip", ...options.value.showTooltip }
        : { type: "tooltip" },
    );
    const popover = computed(() =>
      typographyPopover(tip.value.type, show.value),
    );
    const expansionText = computed(() =>
      expanded.value ? options.value.collapseText : options.value.expandText,
    );
    const toggle = (event: CopyEvent) => {
      if (!active) return;
      options.value.onExpand?.(!expanded.value, event);
      if (
        (options.value.expandable && !expanded.value) ||
        (options.value.collapsible && expanded.value)
      )
        expanded.value = !expanded.value;
    };
    const copyConfig = computed<CopyableConfig>(() => {
      const custom =
        typeof source.value.copyable === "object" &&
        source.value.copyable !== null
          ? source.value.copyable
          : {};
      const content = custom.content ?? source.value.children;
      if (
        typeof content === "function" ||
        (hasSlot.value && custom.content == null)
      )
        throw new TypeError(
          "Typography copying native content requires copyable.content.",
        );
      return { content: String(content), ...custom };
    });
    const classes = computed(() => [
      "semi-typography",
      source.value.class,
      source.value.className,
      {
        [`semi-typography-${source.value.type}`]:
          source.value.type && !source.value.link,
        [`semi-typography-${size.value}`]: size.value,
        [`semi-typography-${source.value.spacing}`]: source.value.spacing,
        "semi-typography-link": source.value.link,
        "semi-typography-disabled": source.value.disabled,
        [`semi-typography-${source.value.heading}`]: /^h[1-6]$/.test(
          source.value.heading ?? "",
        ),
        [`semi-typography-${source.value.heading}-weight-${source.value.weight}`]:
          /^h[1-6]$/.test(source.value.heading ?? "") &&
          source.value.weight &&
          Number.isNaN(Number(source.value.weight)),
        "semi-typography-ellipsis": enabled.value,
        "semi-typography-ellipsis-single-line":
          enabled.value && options.value.rows === 1,
        "semi-typography-ellipsis-multiple-line":
          enabled.value && (options.value.rows ?? 0) > 1,
        "semi-typography-ellipsis-multiple-line-text":
          enabled.value &&
          (options.value.rows ?? 0) > 1 &&
          source.value.component === "span",
        "semi-typography-ellipsis-overflow-ellipsis":
          enabled.value &&
          options.value.rows === 1 &&
          css.value &&
          !expanded.value,
        "semi-typography-ellipsis-overflow-ellipsis-text":
          enabled.value &&
          options.value.rows === 1 &&
          css.value &&
          !expanded.value &&
          source.value.component === "span",
      },
    ]);
    const renderRoot = (scope?: TooltipTriggerScope): VaporRenderResult => {
      const block = createDynamicComponent(
        () =>
          source.value.component === undefined
            ? containerDefaults.resolve({}).component
            : source.value.component,
        {
          $: [
            () =>
              mergeTypographyAttrs(
                show.value ? (scope?.triggerProps ?? {}) : {},
                attrs,
              ),
          ],
          class: () => classes.value,
          style: () => ({
            ...(!Number.isNaN(Number(source.value.weight))
              ? { fontWeight: source.value.weight }
              : {}),
            ...source.value.style,
            ...(enabled.value &&
            css.value &&
            !expanded.value &&
            (options.value.rows ?? 0) > 1
              ? { WebkitLineClamp: options.value.rows }
              : {}),
          }),
        },
        {
          default: () =>
            (
              <>
                <Decorations source={source.value}>
                  {() => (
                    <>
                      {source.value.icon ? (
                        <span class="semi-typography-icon" x-semi-prop="icon">
                          <TypographyContentView content={source.value.icon} />
                        </span>
                      ) : null}
                      {source.value.link ? (
                        <span
                          class={[
                            "semi-typography-link-text",
                            {
                              "semi-typography-link-underline":
                                source.value.underline,
                            },
                          ]}
                        >
                          {enabled.value ? (
                            <span
                              onMouseenter={measured.schedule}
                              ref={textElement}
                            >
                              {expanded.value ||
                              !measured.overflow.value ||
                              css.value
                                ? source.value.children
                                : measured.text.value}
                              {options.value.suffix}
                            </span>
                          ) : hasSlot.value ? (
                            <slot />
                          ) : (
                            <TypographyContentView
                              content={source.value.children}
                            />
                          )}
                        </span>
                      ) : enabled.value ? (
                        <span
                          onMouseenter={measured.schedule}
                          ref={textElement}
                        >
                          {expanded.value ||
                          !measured.overflow.value ||
                          css.value
                            ? source.value.children
                            : measured.text.value}
                          {options.value.suffix}
                        </span>
                      ) : hasSlot.value ? (
                        <slot />
                      ) : (
                        <TypographyContentView
                          content={source.value.children}
                        />
                      )}
                    </>
                  )}
                </Decorations>
                {enabled.value &&
                measured.overflow.value &&
                (options.value.expandable ||
                  options.value.expandText !== undefined ||
                  options.value.collapsible ||
                  options.value.collapseText !== undefined) ? (
                  <a
                    aria-label={expansionText.value}
                    class="semi-typography-ellipsis-expand"
                    onClick={(event: unknown) => toggle(event as CopyEvent)}
                    onKeypress={(value: unknown) => {
                      const event = value as KeyboardEvent;
                      if (event.key === "Enter" || event.keyCode === 13)
                        toggle(event);
                    }}
                    role="button"
                    tabindex={0}
                  >
                    {expansionText.value}
                  </a>
                ) : null}
                {source.value.copyable ? (
                  <Copyable {...copyConfig.value} forwardRef={operation} />
                ) : null}
              </>
            ) as Block,
        },
        1,
      );
      setStaticTemplateRef(
        block as Parameters<typeof setStaticTemplateRef>[0],
        (value: unknown) => {
          const element = value as HTMLElement | null;
          root.value = element;
          scope?.triggerRef(element);
        },
      );
      return block;
    };
    const customTip = computed(
      () => () =>
        tip.value.renderTooltip!(source.value.children, () => renderRoot()),
    );
    return (
      <>
        {typeof tip.value.renderTooltip === "function" && show.value ? (
          <TypographyContentView content={customTip.value} />
        ) : options.value.showTooltip && enabled.value ? (
          popover.value ? (
            <Popover
              content={source.value.children as string}
              position="top"
              showArrow
              {...tip.value.opts}
              className={[
                "semi-typography-ellipsis-popover",
                tip.value.opts?.className,
              ]
                .filter(Boolean)
                .join(" ")}
              condition={show.value && tip.value.opts?.condition !== false}
              visible={show.value ? tip.value.opts?.visible : false}
            >
              {(scope) => renderRoot(scope)}
            </Popover>
          ) : (
            <Tooltip
              content={source.value.children as string}
              position="top"
              {...tip.value.opts}
              condition={show.value && tip.value.opts?.condition !== false}
              visible={show.value ? tip.value.opts?.visible : false}
            >
              {(scope) => renderRoot(scope)}
            </Tooltip>
          )
        ) : (
          renderRoot()
        )}
      </>
    );
  },
  { props: [...typographyKeys], inheritAttrs: false },
);
export default Base;
