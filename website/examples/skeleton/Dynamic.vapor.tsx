import { defineVaporComponent, ref } from "vue";
import { Skeleton } from "semi-ui-vue";

const Content = defineVaporComponent(() => {
  const count = ref(0);
  return (
    <div data-skeleton-content="">
      <p>实际内容已显示。切回占位后再次显示会重新挂载。</p>
      <button
        data-skeleton-counter=""
        onClick={() => count.value++}
        type="button"
      >
        内容计数 {count.value}
      </button>
      <input aria-label="实际内容输入框" placeholder="可聚焦的实际内容" />
    </div>
  );
});

export default defineVaporComponent(() => {
  const loading = ref(true);
  const active = ref(false);
  const mounted = ref(true);
  const rows = ref(2);
  const shape = ref<"circle" | "square">("circle");
  return (
    <section data-skeleton-dynamic="" style={{ maxWidth: "420px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (loading.value = !loading.value)} type="button">
          {loading.value ? "显示实际内容" : "显示占位"}
        </button>
        <button onClick={() => (active.value = !active.value)} type="button">
          {active.value ? "关闭动画" : "开启动画"}
        </button>
        <button
          onClick={() => (rows.value = rows.value === 0 ? 3 : 0)}
          type="button"
        >
          {rows.value === 0 ? "显示三行" : "显示零行"}
        </button>
        <button
          onClick={() =>
            (shape.value = shape.value === "circle" ? "square" : "circle")
          }
          type="button"
        >
          切换头像形状
        </button>
        <button onClick={() => (mounted.value = !mounted.value)} type="button">
          {mounted.value ? "卸载 Skeleton" : "挂载 Skeleton"}
        </button>
      </div>
      <p aria-live="polite" data-skeleton-state="">
        {loading.value ? "正在加载" : "加载完成"}
      </p>
      <Skeleton
        v-if={mounted.value}
        active={active.value}
        aria-busy={loading.value}
        aria-label="动态资料区域"
        data-skeleton-dynamic-root=""
        loading={loading.value}
        role="region"
        v-slots={{
          placeholder: () => (
            <>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <Skeleton.Avatar
                  data-skeleton-dynamic-avatar=""
                  shape={shape.value}
                />
                <Skeleton.Title style={{ width: "130px" }} />
              </div>
              <Skeleton.Paragraph
                data-skeleton-dynamic-paragraph=""
                rows={rows.value}
              />
            </>
          ),
          default: () => (
            <>
              <strong data-skeleton-content-heading="">示例资料</strong>
              <Content />
            </>
          ),
        }}
      />
    </section>
  );
});
