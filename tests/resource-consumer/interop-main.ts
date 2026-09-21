import {
  createApp,
  h,
  nextTick,
  ref,
  shallowRef,
  vaporInteropPlugin,
} from "vue";
import {
  ConfigConsumer,
  ConfigProvider,
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

const color = ref("rgb(12, 90, 190)");
const fill = ref<readonly string[]>(["#465fff", "#9caeff"]);
const size = ref<IconSize>("inherit");
const rotate = ref(90);
const configLocale = shallowRef(enUS);
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
      unmount(): void;
    };
  }
}
window.interopConsumer = {
  async update() {
    configLocale.value = zhCN;
    configDirection.value = "ltr";
    configTimeZone.value = 0;
    color.value = "rgb(153, 72, 40)";
    fill.value = ["#994828", "#f4c3aa"];
    size.value = "extra-large";
    rotate.value = 1.5;
    await nextTick();
  },
  unmount() {
    app.unmount();
  },
};
