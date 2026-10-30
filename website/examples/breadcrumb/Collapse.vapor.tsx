import { defineVaporComponent, ref, nextTick } from "vue";
import { Breadcrumb, provideAriaIdScope } from "semi-ui-vue";

export default defineVaporComponent(() => {
  provideAriaIdScope(
    `breadcrumb-collapse-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const mounted = ref(true),
    max = ref(4),
    collapse = ref(true),
    routes = ref(["首页", "二级", "三级", "四级", "五级", "六级", "详情"]);
  return (
    <section data-breadcrumb-collapse="">
      <h3>数量折叠与省略区域</h3>
      <button
        onClick={() => {
          routes.value = [...routes.value, "新增详情"];
        }}
        type="button"
      >
        增加层级
      </button>
      <button
        onClick={() => {
          max.value = max.value === 4 ? 3 : 4;
        }}
        type="button"
      >
        切换阈值
      </button>
      <button
        onClick={() => {
          collapse.value = !collapse.value;
        }}
        type="button"
      >
        切换自动折叠
      </button>
      <button
        onClick={async () => {
          mounted.value = false;
          await nextTick();
          mounted.value = true;
        }}
        type="button"
      >
        重新挂载
      </button>
      {mounted.value ? (
        <Breadcrumb
          autoCollapse={collapse.value}
          data-collapse-breadcrumb=""
          maxItemCount={max.value}
          routes={routes.value}
        />
      ) : null}
      <h4>悬停查看省略路径</h4>
      <Breadcrumb
        data-popover-breadcrumb=""
        moreType="popover"
        routes={routes.value}
      />
      <h4>自定义省略内容</h4>
      <Breadcrumb
        data-custom-breadcrumb=""
        renderMore={(rest) => (
          <span data-custom-more="">{rest.length} 个层级</span>
        )}
        routes={routes.value}
      />
      <p>
        默认阈值 4 保留首项和最后三项，额外显示省略按钮。点击或 Enter
        展开后，改变 routes、阈值或 autoCollapse
        不会重置展开状态；重新挂载才恢复初始折叠。
      </p>
    </section>
  );
});
