import { defineVaporComponent, ref } from "vue";
import { Divider } from "semi-ui-vue";

const ContentCounter = defineVaporComponent(() => {
  const count = ref(0);
  return (
    <button onClick={() => count.value++} type="button">
      内容计数 {count.value}
    </button>
  );
});

export default defineVaporComponent(() => {
  const content = ref(true);
  const right = ref(false);
  const vertical = ref(false);
  const mounted = ref(true);
  return (
    <section data-divider-content="">
      <Divider align="left" data-text-left="" margin={16}>
        {() => <>左侧文字</>}
      </Divider>
      <Divider align="center" dashed={true} data-text-center="" margin={16}>
        {() => <>居中文字</>}
      </Divider>
      <Divider align="right" data-text-right="" margin={16}>
        {() => <>右侧文字</>}
      </Divider>
      <Divider data-complex="" margin={16}>
        {() => <strong style={{ padding: "0 8px" }}>自定义内容</strong>}
      </Divider>
      <Divider data-zero="" margin={16}>
        {() => <>{0}</>}
      </Divider>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (content.value = !content.value)} type="button">
          {content.value ? "清空内容" : "恢复内容"}
        </button>
        <button onClick={() => (right.value = !right.value)} type="button">
          切换内容位置
        </button>
        <button
          onClick={() => (vertical.value = !vertical.value)}
          type="button"
        >
          {vertical.value ? "切换水平" : "切换垂直"}
        </button>
        <button onClick={() => (mounted.value = !mounted.value)} type="button">
          {mounted.value ? "卸载动态分割线" : "挂载动态分割线"}
        </button>
      </div>
      <Divider
        v-if={mounted.value}
        align={right.value ? "right" : "center"}
        data-dynamic-text=""
        margin={16}
      >
        {() => <>{content.value ? "动态文字" : ""}</>}
      </Divider>
      <Divider
        v-if={mounted.value}
        align={right.value ? "right" : "center"}
        data-dynamic-complex=""
        layout={vertical.value ? "vertical" : "horizontal"}
        margin={16}
      >
        {() => <ContentCounter />}
      </Divider>
      <p>
        切换文字位置保留内容计数。垂直方向不挂载内容；恢复水平或卸载后重挂会新建内容实例。
      </p>
    </section>
  );
});
