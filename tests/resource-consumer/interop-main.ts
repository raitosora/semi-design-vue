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

const dividerLayout = ref<"horizontal" | "vertical">("horizontal");
const dividerVisible = ref(true);
const spaceVertical = ref(false);
const spaceWrap = ref(true);
const spaceSpacing = ref<number | "medium">("medium");
const gridSpan = ref(12);
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
    return () =>
      h("section", { class: "interop-resources" }, [
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
      unmount(): void;
    };
  }
}
window.interopConsumer = {
  async update() {
    spinning.value = false;
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
  async disableButton() {
    iconButtonDisabled.value = true;
    await nextTick();
  },
  unmount() {
    app.unmount();
  },
};
