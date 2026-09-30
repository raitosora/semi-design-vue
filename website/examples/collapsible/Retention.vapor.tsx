import { defineVaporComponent, ref } from "vue";
import { Collapsible } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const open = ref(false);
  return (
    <section data-collapsible-retention="">
      <h3>保留 DOM、延迟挂载和预览高度</h3>
      <button onClick={() => (open.value = !open.value)} type="button">
        切换保留面板
      </button>
      <Collapsible data-collapsible-panel="keep" isOpen={open.value} keepDOM>
        {() => <input aria-label="保留输入" value="保留我的输入" />}
      </Collapsible>
      <Collapsible
        data-collapsible-panel="lazy"
        isOpen={open.value}
        keepDOM
        lazyRender
      >
        {() => <input aria-label="延迟输入" value="首次展开后保留" />}
      </Collapsible>
      <Collapsible
        collapseHeight={48}
        collapseHeightAdaptive
        data-collapsible-panel="preview"
        fade
        isOpen={open.value}
      >
        {() => (
          <p style={{ margin: "0", height: "24px" }}>自适应预览高度为 24px</p>
        )}
      </Collapsible>
      <p>
        高度裁剪不等于隐藏语义；业务应自行管理保留内容的 inert、ARIA 和焦点。
      </p>
    </section>
  );
});
