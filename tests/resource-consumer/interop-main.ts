import { checkAvatarInterop } from "./avatar-interop.js";
import "semi-ui-vue/styles/components/avatar.css";
import {
  createApp,
  h,
  nextTick,
  ref,
  shallowRef,
  vaporInteropPlugin,
} from "vue";
import {
  Spin,
  Divider,
  Space,
  Row,
  Col,
  Layout,
  Skeleton,
  Highlight,
  Progress,
  Tooltip,
  Popover,
  Collapsible,
  OverflowList,
  provideAriaIdScope,
  Button,
  ButtonGroup,
  SplitButtonGroup,
  IconButton,
  ConfigConsumer,
  ConfigProvider,
  LocaleProvider,
  LocaleConsumer,
  type LocaleContextSource,
  useConfigContext,
  type ConfigContextSource,
} from "semi-ui-vue";
import type { PopoverTriggerScope } from "semi-ui-vue/popover";
import type { TooltipTriggerScope } from "semi-ui-vue/tooltip";
import type { ProgressSlots } from "semi-ui-vue/progress";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";
import Icon, { type IconSize, type IconSvgScope } from "semi-icons-vue";
import IconHome from "semi-icons-vue/IconHome";
import IconForm from "semi-icons-lab-vue/IconForm";
import IllustrationNoContent from "semi-illustrations-vue/IllustrationNoContent";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/icons.css";
import "semi-ui-vue/styles/components/spin.css";
import "semi-ui-vue/styles/components/iconButton.css";
import "semi-ui-vue/styles/components/button.css";
import "semi-ui-vue/styles/components/divider.css";
import "semi-ui-vue/styles/components/space.css";
import "semi-ui-vue/styles/components/grid.css";
import "semi-ui-vue/styles/components/layout.css";
import "semi-ui-vue/styles/components/skeleton.css";
import "semi-ui-vue/styles/components/highlight.css";
import "semi-ui-vue/styles/components/progress.css";
import "semi-ui-vue/styles/components/tooltip.css";
import "semi-ui-vue/styles/components/popover.css";
import "semi-ui-vue/styles/components/collapsible.css";
import "semi-ui-vue/styles/components/overflowList.css";

const dividerLayout = ref<"horizontal" | "vertical">("horizontal");
const dividerVisible = ref(true);
const spaceVertical = ref(false);
const spaceWrap = ref(true);
const spaceSpacing = ref<number | "medium">("medium");
const gridSpan = ref(12);
const layoutSiderVisible = ref(true);
const skeletonLoading = ref(true);
const highlightText = ref("Before Semi after SEMI.");
const highlightTag = ref("mark");
const tooltipVisible = ref(false);
const tooltipContent = ref("Interop Tooltip content");
const overflowScrollWidth = ref(140);
const overflowScrollLabel = ref("Interop scroll");
const overflowScrollNotifications = ref(0);
const overflowScrollItems = [{ key: "a" }, { key: "b" }, { key: "c" }];
const overflowWidth = ref(155);
const overflowLabel = ref("Interop");
const collapsibleOpen = ref(true);
const collapsibleText = ref("Interop Collapsible content");
const popoverVisible = ref(false);
const popoverContent = ref("Interop Popover content");
const progressPercent = ref(25);
const progressType = ref<"line" | "circle">("line");
const spinning = ref(true);
const iconButtonLabel = ref("Save");
const iconButtonDisabled = ref(false);
const iconButtonClicks = ref(0);
const color = ref("rgb(12, 90, 190)");
const fill = ref<readonly string[]>(["#465fff", "#9caeff"]);
const size = ref<IconSize>("inherit");
const rotate = ref(90);
const configLocale = shallowRef(enUS);
const standaloneLocale = shallowRef(enUS);
function localeOutput(name: string) {
  return h(
    LocaleConsumer,
    { componentName: "Pagination" },
    {
      default: ({
        locale,
      }: {
        readonly locale: LocaleContextSource<"Pagination">;
      }) =>
        h(
          "output",
          { class: `interop-locale-${name}` },
          `${locale.value.localeCode}|${locale.value.componentLocale?.page}|${locale.value.dateFnsLocale.code}`,
        ),
    },
  );
}
const configDirection = ref<"rtl" | "ltr">("rtl");
const configTimeZone = ref(8);
const ConfigHookReader = {
  setup() {
    const config = useConfigContext();
    return () =>
      h(
        "output",
        { class: "interop-config-hook" },
        `${config.value.locale?.code}|${config.value.direction}|${String(config.value.timeZone)}`,
      );
  },
};
const app = createApp({
  setup() {
    provideAriaIdScope("interop-resource-consumer");
    return () =>
      h("section", { class: "interop-resources" }, [
        h(
          OverflowList,
          {
            className: "interop-overflow-list",
            items: [{ key: "a" }, { key: "b" }, { key: "c" }],
            itemKey: "key",
            minVisibleItems: 0,
            collapseFrom: "end",
            style: { width: `${overflowWidth.value}px` },
          },
          {
            visibleItem: ({ item }: { item: Record<string, unknown> }) =>
              h(
                "button",
                {
                  "data-interop-overflow-item": String(item.key),
                  style: {
                    flex: "0 0 60px",
                    width: "60px",
                    padding: "0",
                    border: "0",
                  },
                },
                `${overflowLabel.value} ${String(item.key)}`,
              ),
            overflow: ({ items }: { items: Record<string, unknown>[] }) =>
              h(
                "button",
                {
                  "data-interop-overflow-count": items.length,
                  style: {
                    flex: "0 0 30px",
                    width: "30px",
                    padding: "0",
                    border: "0",
                  },
                },
                `+${items.length}`,
              ),
          },
        ),
        h(
          OverflowList,
          {
            className: "interop-scroll-overflow-list",
            items: overflowScrollItems,
            itemKey: "key",
            renderMode: "scroll",
            style: { width: `${overflowScrollWidth.value}px` },
            onVisibleStateChange: () => overflowScrollNotifications.value++,
          },
          {
            visibleItem: (scope: { readonly item: Record<string, unknown> }) =>
              h(
                "button",
                {
                  "data-interop-scroll-item": String(scope.item.key),
                  style: { width: "60px", padding: "0", border: "0" },
                },
                `${overflowScrollLabel.value} ${String(scope.item.key)}`,
              ),
            overflowStart: (scope: {
              readonly items: Record<string, unknown>[];
            }) =>
              h(
                "button",
                {
                  "data-interop-scroll-before": scope.items
                    .map((item) => item.key)
                    .join(","),
                  style: { width: "20px", padding: "0", border: "0" },
                },
                "Before",
              ),
            overflowEnd: (scope: {
              readonly items: Record<string, unknown>[];
            }) =>
              h(
                "button",
                {
                  "data-interop-scroll-after": scope.items
                    .map((item) => item.key)
                    .join(","),
                  style: { width: "20px", padding: "0", border: "0" },
                },
                "After",
              ),
          },
        ),
        h(
          Collapsible,
          {
            className: "interop-collapsible",
            isOpen: collapsibleOpen.value,
            motion: false,
          },
          {
            default: () =>
              h(
                "div",
                {
                  "data-interop-collapsible-content": "",
                  style: { height: "40px" },
                },
                collapsibleText.value,
              ),
          },
        ),
        h(
          Divider,
          {
            className: "interop-divider",
            align: spinning.value ? "left" : "right",
            layout: dividerLayout.value,
            dashed: true,
            margin: 10,
            role: "separator",
          },
          {
            default: () =>
              dividerVisible.value
                ? h("span", { "data-divider-label": "" }, iconButtonLabel.value)
                : [],
          },
        ),
        h(
          Space,
          {
            className: "interop-space",
            align: spinning.value ? "start" : "end",
            vertical: spaceVertical.value,
            wrap: spaceWrap.value,
            spacing: spaceSpacing.value,
            role: "group",
            "aria-label": "Interop actions",
          },
          {
            default: () => [
              h(
                "button",
                { "data-space-action": "first" },
                iconButtonLabel.value,
              ),
              h("button", { "data-space-action": "second" }, "second"),
            ],
          },
        ),
        h(
          Row,
          {
            type: "flex",
            gutter: 16,
            className: "interop-grid-row",
            style: { width: "240px" },
          },
          {
            default: () =>
              h(
                Col,
                { span: gridSpan.value, className: "interop-grid-col" },
                {
                  default: () =>
                    h("span", { "data-grid-label": "" }, iconButtonLabel.value),
                },
              ),
          },
        ),
        h(
          Layout,
          {
            className: "interop-layout",
            style: { width: "240px", height: "80px" },
          },
          {
            default: () => [
              layoutSiderVisible.value
                ? h(
                    Layout.Sider,
                    {
                      className: "interop-layout-sider",
                      style: { width: "40px", flex: "0 0 40px" },
                    },
                    { default: () => h("span", "Navigation") },
                  )
                : null,
              h(
                Layout.Content,
                { className: "interop-layout-content" },
                {
                  default: () =>
                    h(
                      "output",
                      { "data-layout-label": "" },
                      iconButtonLabel.value,
                    ),
                },
              ),
            ],
          },
        ),
        h(
          Tooltip,
          {
            wrapperId: "interop-tooltip-popup",
            motion: false,
            trigger: "click",
            visible: tooltipVisible.value,
            content: tooltipContent.value,
            "onUpdate:visible": (value: boolean) =>
              (tooltipVisible.value = value),
          },
          {
            default: (scope: TooltipTriggerScope) =>
              h(
                "button",
                {
                  ...scope.attrs,
                  ...scope.triggerProps,
                  ref: (value) =>
                    scope.triggerRef(value instanceof Element ? value : null),
                  "data-interop-tooltip": "",
                },
                "Interop Tooltip trigger",
              ),
          },
        ),
        h(
          Popover,
          {
            motion: false,
            trigger: "click",
            visible: popoverVisible.value,
            content: popoverContent.value,
            "onUpdate:visible": (value: boolean) =>
              (popoverVisible.value = value),
          },
          {
            content: () =>
              h(
                "button",
                { "data-interop-popover-content": "" },
                popoverContent.value,
              ),
            default: (scope: PopoverTriggerScope) =>
              h(
                "button",
                {
                  ...scope.attrs,
                  ...scope.triggerProps,
                  ref: (value) =>
                    scope.triggerRef(value instanceof Element ? value : null),
                  "data-interop-popover": "",
                },
                "Interop Popover trigger",
              ),
          },
        ),
        h(
          Progress,
          {
            className: "interop-progress",
            percent: progressPercent.value,
            type: progressType.value,
            showInfo: true,
            motion: false,
            "aria-label": "Interop upload",
          },
          {
            format: ({
              percent,
            }: Parameters<NonNullable<ProgressSlots["format"]>>[0]) => [
              h("b", { "data-interop-percent": "" }, percent.value),
              h("i", " complete"),
            ],
          },
        ),
        h("section", { "data-interop-highlight": "" }, [
          h(Highlight, {
            sourceString: highlightText.value,
            searchWords: [
              {
                text: "semi",
                className: "interop-word",
                style: { color: "rgb(4, 5, 6)" },
              },
              "<b>",
              "&amp;",
              "+",
            ],
            component: highlightTag.value,
            highlightClassName: "interop-highlight",
            highlightStyle: { color: "rgb(1, 2, 3)" },
          }),
        ]),
        h(
          Skeleton,
          {
            className: "interop-skeleton",
            loading: skeletonLoading.value,
            active: true,
            role: "status",
          },
          {
            placeholder: () => [
              h(Skeleton.Avatar, { size: "small" }),
              h(Skeleton.Paragraph, { rows: 2 }),
            ],
            default: () =>
              h("output", { "data-skeleton-label": "" }, iconButtonLabel.value),
          },
        ),
        h(
          IconButton,
          {
            loading: spinning.value,
            disabled: iconButtonDisabled.value,
            className: "interop-icon-button",
            "aria-label": "Interop action",
            onClick: () => iconButtonClicks.value++,
          },
          {
            default: () =>
              h(
                "span",
                { "data-interop-button-label": "" },
                iconButtonLabel.value,
              ),
            icon: () =>
              h(
                "span",
                { "data-interop-button-icon": "", "aria-hidden": true },
                "*",
              ),
          },
        ),
        h(
          Button,
          {
            className: "interop-button",
            loading: spinning.value,
            onClick: () => iconButtonClicks.value++,
          },
          {
            default: () =>
              h(
                "span",
                { "data-interop-button-label": "" },
                iconButtonLabel.value,
              ),
            icon: () =>
              h(
                "span",
                { "data-interop-button-icon": "", "aria-hidden": true },
                "*",
              ),
          },
        ),
        h(
          ButtonGroup,
          {
            className: "interop-button-group",
            disabled: true,
            type: "danger",
            size: "small",
          },
          {
            default: () => [
              h(
                Button,
                { className: "interop-group-inherited" },
                { default: () => h("span", "Inherited") },
              ),
              h(
                Button,
                {
                  className: "interop-group-own",
                  disabled: undefined,
                  type: "warning",
                },
                { default: () => h("span", "Own") },
              ),
            ],
          },
        ),
        h(
          SplitButtonGroup,
          { className: "interop-split-button-group" },
          {
            default: () => [
              h(
                Button,
                { className: "interop-split-first" },
                { default: () => h("span", "First") },
              ),
              h(
                Button,
                { className: "interop-split-last" },
                { default: () => h("span", "Last") },
              ),
            ],
          },
        ),
        h(
          "output",
          { class: "interop-button-clicks" },
          String(iconButtonClicks.value),
        ),
        h(
          Spin,
          {
            spinning: spinning.value,
            wrapperClassName: "interop-spin",
            tip: "Loading",
            delay: 60,
          },
          {
            default: () => h("input", { value: "retained" }),
            indicator: () => h("span", { "data-interop-indicator": "" }, "*"),
          },
        ),
        h(
          LocaleProvider,
          { locale: standaloneLocale.value },
          {
            default: () => [
              localeOutput("standalone"),
              h(
                LocaleProvider,
                { locale: zhCN },
                { default: () => localeOutput("nested") },
              ),
              h(
                LocaleProvider,
                { locale: undefined },
                { default: () => localeOutput("default") },
              ),
            ],
          },
        ),
        h(
          ConfigProvider,
          {
            locale: configLocale.value,
            direction: configDirection.value,
            timeZone: configTimeZone.value,
          },
          {
            default: () =>
              h(
                ConfigProvider,
                {},
                {
                  default: () => [
                    h(ConfigHookReader),
                    h(
                      LocaleProvider,
                      { locale: zhCN },
                      { default: () => localeOutput("configured") },
                    ),
                    h(
                      ConfigConsumer,
                      {},
                      {
                        default: ({
                          config,
                        }: {
                          readonly config: ConfigContextSource;
                        }) =>
                          h(
                            "output",
                            { class: "interop-config-slot" },
                            `${config.value.locale?.code}|${config.value.direction}|${String(config.value.timeZone)}`,
                          ),
                      },
                    ),
                  ],
                },
              ),
          },
        ),
        h(IconHome, {
          color: color.value,
          size: 32,
          "aria-label": "Interop home",
        }),
        h(
          Icon,
          {
            "aria-label": "Interop wrapped generated icon",
            className: "interop-wrapped-icon",
            color: color.value,
            prefixCls: "semi",
            rotate: rotate.value,
            size: size.value,
            spin: true,
            style: { fontSize: size.value === "inherit" ? "31px" : undefined },
            type: "primary",
          },
          {
            svg: () => h(IconHome, { "aria-hidden": true, size: "inherit" }),
          },
        ),
        h(
          Icon,
          {
            "aria-label": "Interop custom icon",
            className: "interop-custom-icon",
            color: color.value,
            fill: fill.value,
            prefixCls: "consumer",
          },
          {
            svg: (scope: IconSvgScope) =>
              h(
                "svg",
                {
                  "data-fill": scope.fill?.join(","),
                  "data-icon-id": scope.id,
                  height: scope.size,
                  viewBox: "0 0 12 12",
                  width: scope.size,
                },
                [
                  h("defs", [
                    h("linearGradient", { id: `${scope.id}-gradient` }, [
                      h("stop", {
                        offset: "0",
                        "stop-color": scope.fill?.[0] ?? "currentColor",
                      }),
                      h("stop", {
                        offset: "1",
                        "stop-color": scope.fill?.[1] ?? "currentColor",
                      }),
                    ]),
                  ]),
                  h("path", {
                    d: "M1 1h10v10H1z",
                    fill: `url(#${scope.id}-gradient)`,
                  }),
                ],
              ),
          },
        ),
        h(IconForm, { size: 40, "aria-label": "Interop form" }),
        h(IllustrationNoContent, {
          size: 120,
          "aria-label": "Interop illustration",
        }),
      ]);
  },
});
app.use(vaporInteropPlugin);
app.mount("#resource-consumer");

declare global {
  interface Window {
    interopConsumer: {
      update(): Promise<void>;
      disableButton(): Promise<void>;
      updateDivider(
        layout: "horizontal" | "vertical",
        visible: boolean,
      ): Promise<void>;
      updateSpace(
        vertical: boolean,
        wrap: boolean,
        spacing: number | "medium",
      ): Promise<void>;
      updateGrid(span: number): Promise<void>;
      checkAvatar(): Promise<string>;
      updateOverflowList(width: number): Promise<void>;
      updateOverflowScroll(width: number): Promise<void>;
      getOverflowScrollNotifications(): number;
      updateCollapsible(open: boolean): Promise<void>;
      updateLayout(visible: boolean): Promise<void>;
      unmount(): void;
    };
  }
}
window.interopConsumer = {
  checkAvatar: checkAvatarInterop,
  async update() {
    spinning.value = false;
    skeletonLoading.value = false;
    highlightText.value = "Updated Semi <b> &amp; +";
    highlightTag.value = "em";
    tooltipContent.value = "Updated interop Tooltip content";
    popoverContent.value = "Updated interop Popover content";
    progressPercent.value = 42.5;
    progressType.value = "circle";
    iconButtonLabel.value = "Updated";
    configLocale.value = zhCN;
    standaloneLocale.value = zhCN;
    configDirection.value = "ltr";
    configTimeZone.value = 0;
    color.value = "rgb(153, 72, 40)";
    fill.value = ["#994828", "#f4c3aa"];
    size.value = "extra-large";
    rotate.value = 1.5;
    await nextTick();
  },
  async updateDivider(layout, visible) {
    dividerLayout.value = layout;
    dividerVisible.value = visible;
    await nextTick();
    await Promise.resolve();
    await nextTick();
  },
  async updateSpace(vertical, wrap, spacing) {
    spaceVertical.value = vertical;
    spaceWrap.value = wrap;
    spaceSpacing.value = spacing;
    await nextTick();
    await Promise.resolve();
    await nextTick();
  },
  async updateGrid(span) {
    gridSpan.value = span;
    await nextTick();
  },
  async updateOverflowScroll(width) {
    overflowScrollWidth.value = width;
    overflowScrollLabel.value = "Updated interop scroll";
    await nextTick();
  },
  getOverflowScrollNotifications() {
    return overflowScrollNotifications.value;
  },
  async updateOverflowList(width) {
    overflowWidth.value = width;
    overflowLabel.value = "Updated interop";
    await nextTick();
  },
  async updateCollapsible(open) {
    collapsibleOpen.value = open;
    collapsibleText.value = "Updated interop Collapsible content";
    await nextTick();
  },
  async updateLayout(visible) {
    layoutSiderVisible.value = visible;
    await nextTick();
    await Promise.resolve();
    await nextTick();
  },
  async disableButton() {
    iconButtonDisabled.value = true;
    await nextTick();
  },
  unmount() {
    app.unmount();
  },
};
