import { defineVaporComponent, ref } from "vue";
import { OverflowList } from "semi-ui-vue";
import type { OverflowListScrollSlots } from "semi-ui-vue/overflowList";

export default defineVaporComponent(() => {
  const host = ref<HTMLElement | null>(null);
  const mounted = ref(true);
  const direction = ref<"both" | "start" | "end">("both");
  const intersects = ref(0);
  const changes = ref(0);
  const items = Array.from({ length: 6 }, (_, index) => ({
    key: index + 1,
    label: `滚动项 ${index + 1}`,
  }));
  const move = (position: "start" | "middle" | "end") => {
    const node = host.value?.querySelector<HTMLDivElement>(
      ".semi-overflow-list-scroll-wrapper",
    );
    if (node)
      node.scrollLeft =
        position === "start"
          ? 0
          : (node.scrollWidth - node.clientWidth) /
            (position === "middle" ? 2 : 1);
  };
  const slots: OverflowListScrollSlots = {
    visibleItem: (scope) => (
      <button
        data-scroll-item=""
        style={{
          width: "104px",
          height: "40px",
          boxSizing: "border-box",
          margin: "0",
        }}
        type="button"
      >
        {String(scope.item.label)}
      </button>
    ),
    overflowStart: (scope) => (
      <>
        {scope.items.length ? (
          <span
            data-scroll-start=""
            style={{ display: "inline-block", width: "40px" }}
          >
            ←{scope.items.length}
          </span>
        ) : null}
      </>
    ),
    overflowEnd: (scope) => (
      <>
        {scope.items.length ? (
          <span
            data-scroll-end=""
            style={{ display: "inline-block", width: "40px" }}
          >
            {scope.items.length}→
          </span>
        ) : null}
      </>
    ),
  };
  return (
    <section data-overflow-scroll="" ref={host}>
      <h3>滚动模式与交叉观察</h3>
      <button onClick={() => move("start")} type="button">
        滚到开头
      </button>
      <button onClick={() => move("middle")} type="button">
        滚到中间
      </button>
      <button onClick={() => move("end")} type="button">
        滚到末尾
      </button>
      <label>
        溢出提示位置
        <select
          aria-label="溢出提示位置"
          onChange={(event) =>
            (direction.value = (event.target as HTMLSelectElement).value as
              | "both"
              | "start"
              | "end")
          }
          value={direction.value}
        >
          <option value="both">两侧</option>
          <option value="start">起始侧</option>
          <option value="end">结束侧</option>
        </select>
      </label>
      <button onClick={() => (mounted.value = !mounted.value)} type="button">
        {mounted.value ? "卸载滚动列表" : "重挂滚动列表"}
      </button>
      <p>
        交叉通知 <output data-scroll-intersects="">{intersects.value}</output> ·
        可见状态 <output data-scroll-changes="">{changes.value}</output>
      </p>
      {mounted.value ? (
        <OverflowList
          itemKey="key"
          items={items}
          onIntersect={() => intersects.value++}
          onVisibleStateChange={() => changes.value++}
          overflowRenderDirection={direction.value}
          renderMode="scroll"
          style={{ width: "320px", maxWidth: "100%" }}
          v-slots={slots}
          wrapperStyle={{ scrollBehavior: "auto" }}
        />
      ) : null}
    </section>
  );
});
