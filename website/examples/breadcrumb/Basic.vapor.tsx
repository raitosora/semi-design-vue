import { defineVaporComponent, ref } from "vue";
import { Breadcrumb, provideAriaIdScope } from "semi-ui-vue";

export default defineVaporComponent(() => {
  provideAriaIdScope(
    `breadcrumb-basic-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const empty = ref(false),
    compact = ref(true),
    customSeparator = ref(false),
    active = ref<number | undefined>(undefined),
    events = ref<string[]>([]);
  const record = (name: string) => {
    events.value = [...events.value, name];
  };
  const routes = [
    { name: "首页", href: "#breadcrumb-home", onClick: () => record("item") },
    { name: "<b>安全路径</b>", href: "#breadcrumb-safe", noLink: true },
    { name: "详情", href: "#breadcrumb-details" },
  ];
  return (
    <section data-breadcrumb-basic="">
      <h3>路由、当前页与原生链接</h3>
      <button
        onClick={() => {
          empty.value = !empty.value;
        }}
        type="button"
      >
        {empty.value ? "恢复路由" : "清空路由"}
      </button>
      <button
        onClick={() => {
          active.value = active.value === undefined ? 0 : undefined;
        }}
        type="button"
      >
        切换当前项
      </button>
      <button
        onClick={() => {
          compact.value = !compact.value;
        }}
        type="button"
      >
        切换尺寸
      </button>
      <button
        onClick={() => {
          customSeparator.value = !customSeparator.value;
        }}
        type="button"
      >
        切换分隔符
      </button>
      <button
        onClick={() => {
          events.value = [];
        }}
        type="button"
      >
        清空事件
      </button>
      <div onClick={() => record("bubble")}>
        <Breadcrumb
          activeIndex={active.value}
          aria-label="页面路径"
          compact={compact.value}
          data-basic-breadcrumb=""
          onClick={() => record("parent")}
          routes={empty.value ? [] : routes}
          separator={customSeparator.value ? ">" : "/"}
        >
          {() => <Breadcrumb.Item children="声明式路径" />}
        </Breadcrumb>
      </div>
      <h4>自定义路由正文</h4>
      <Breadcrumb
        data-rendered-breadcrumb=""
        renderItem={(route) => (
          <strong data-rendered-route="">{route.name}</strong>
        )}
        routes={["工作区", "项目说明"]}
      />
      <p>
        事件顺序：<output data-events="">{events.value.join(",")}</output>
      </p>
      <p>
        非空 routes 优先；空数组恢复声明式内容。noLink
        仅移除链接的交互样式，原生 href 和点击仍有效。当前项显示为 span。
      </p>
    </section>
  );
});
