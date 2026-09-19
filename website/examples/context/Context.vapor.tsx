import { defineVaporComponent, ref, shallowRef } from "vue";
import {
  createStaticContext,
  provideSemiContext,
  useSemiContext,
  type SemiContext,
  type SemiContextInput,
} from "semi-ui-vue";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

function describe(context: SemiContext | undefined) {
  return context
    ? `${context.locale?.code}|${String(context.direction)}|${String(context.date?.timeZone)}`
    : "已释放";
}

const Readout = defineVaporComponent<{ nested?: boolean }>(
  (props) => {
    const context = useSemiContext();
    return (
      <output
        data-context-inner={props.nested ? "" : undefined}
        data-context-outer={props.nested ? undefined : ""}
        dir={context.value.direction}
      >
        {describe(context.value)}
      </output>
    );
  },
  { props: ["nested"] },
);

const Nested = defineVaporComponent<{ input: SemiContextInput }>(
  (props) => {
    provideSemiContext(() => props.input);
    return (
      <p>
        内层：
        <Readout nested />
      </p>
    );
  },
  { props: ["input"] },
);

export default defineVaporComponent(() => {
  const english = ref(false);
  const inner = shallowRef<SemiContextInput>({ direction: "rtl" });
  const context = provideSemiContext(() => ({
    locale: english.value ? enUS : zhCN,
    date: { timeZone: english.value ? 0 : 8 },
  }));
  const staticContext = createStaticContext(context);
  const staticText = ref("尚未读取");
  return (
    <section data-context-demo="">
      <p>
        外层：
        <Readout />
      </p>
      <Nested input={inner.value} />
      <p>
        静态接口：<output data-context-static="">{staticText.value}</output>
      </p>
      <button
        onClick={() => {
          english.value = !english.value;
        }}
      >
        切换语言与时区
      </button>
      <button
        onClick={() => {
          inner.value = {};
        }}
      >
        移除内层覆盖
      </button>
      <button
        onClick={() => {
          inner.value = { direction: undefined };
        }}
      >
        显式清空方向
      </button>
      <button
        onClick={() => {
          inner.value = { direction: "rtl" };
        }}
      >
        恢复内层 RTL
      </button>
      <button
        onClick={() => {
          staticText.value = describe(staticContext.get());
        }}
      >
        读取静态上下文
      </button>
    </section>
  );
});
