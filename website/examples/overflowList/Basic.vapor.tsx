import { defineVaporComponent, ref } from "vue";
import { OverflowList } from "semi-ui-vue";
import type { OverflowListCollapseSlots } from "semi-ui-vue/overflowList";

export default defineVaporComponent(() => {
  const width = ref(320);
  const start = ref(false);
  const minimum = ref(0);
  const notifications = ref(0);
  const items = Array.from({ length: 6 }, (_, index) => ({
    key: index + 1,
    label: `项目 ${index + 1}`,
  }));
  const slots: OverflowListCollapseSlots = {
    visibleItem: (scope) => (
      <button
        data-overflow-item=""
        style={{
          width: "80px",
          height: "36px",
          boxSizing: "border-box",
          margin: "0",
        }}
        type="button"
      >
        {String(scope.item.label)}
      </button>
    ),
    overflow: (scope) => (
      <>
        {scope.items.length ? (
          <span
            data-overflow-more=""
            style={{
              display: "inline-block",
              width: "40px",
              lineHeight: "36px",
              textAlign: "center",
            }}
          >
            +{scope.items.length}
          </span>
        ) : null}
      </>
    ),
  };
  return (
    <section data-overflow-basic="">
      <h3>折叠方向、最小项数与尺寸</h3>
      <button onClick={() => (start.value = !start.value)} type="button">
        {start.value ? "从末尾折叠" : "从开始折叠"}
      </button>
      <button
        onClick={() => (minimum.value = minimum.value ? 0 : 3)}
        type="button"
      >
        {minimum.value ? "取消最小项数" : "至少保留三项"}
      </button>
      <label>
        容器宽度
        <input
          aria-label="折叠容器宽度"
          max="560"
          min="120"
          onInput={(event) =>
            (width.value = Number((event.target as HTMLInputElement).value))
          }
          type="range"
          value={width.value}
        />
      </label>
      <p>溢出通知：{notifications.value}</p>
      <OverflowList
        collapseFrom={start.value ? "start" : "end"}
        data-overflow-panel="basic"
        itemKey="key"
        items={items}
        minVisibleItems={minimum.value}
        onOverflow={() => notifications.value++}
        style={{ width: `${width.value}px` }}
        v-slots={slots}
      />
    </section>
  );
});
