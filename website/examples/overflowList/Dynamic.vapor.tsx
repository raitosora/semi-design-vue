import { defineVaporComponent, ref, shallowRef, type Ref } from "vue";
import { For } from "vue-jsx/vapor";
import { OverflowList } from "semi-ui-vue";
import type { OverflowListCollapseSlots } from "semi-ui-vue/overflowList";

export default defineVaporComponent(() => {
  const items = shallowRef(
    Array.from({ length: 6 }, (_, index) => ({
      key: index + 1,
      label: `项目 ${index + 1}`,
    })),
  );
  const large = ref(false);
  const hidden = ref(false);
  const mounted = ref(true);
  const selected = ref(0);
  const firstButton = ref<HTMLButtonElement | null>(null);
  let nextKey = 7;
  const tokens = ["原生", "列表"];
  const slots: OverflowListCollapseSlots = {
    visibleItem: (scope) => (
      <>
        <button
          data-overflow-rich=""
          onClick={() => (selected.value = Number(scope.item.key))}
          ref={scope.item.key === 1 ? firstButton : undefined}
          style={{
            fontSize: "inherit",
            width: "5em",
            height: "2.8em",
            boxSizing: "border-box",
            margin: "0",
          }}
          type="button"
        >
          {String(scope.item.label)}
          <br />
          <span data-overflow-nested="">
            <For getKey={(token: string) => token} in={tokens}>
              {(token: Ref<string>) => <small>{token.value}</small>}
            </For>
          </span>
        </button>
        {selected.value === Number(scope.item.key) ? (
          <span aria-label="当前选择" style={{ position: "absolute" }}>
            ✓
          </span>
        ) : null}
      </>
    ),
    overflow: (scope) => (
      <>
        {scope.items.length ? (
          <span
            data-overflow-more=""
            style={{
              display: "inline-block",
              width: "40px",
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
    <section data-overflow-dynamic="">
      <h3>动态字体、原生 fragment 与嵌套 For</h3>
      <button onClick={() => (large.value = !large.value)} type="button">
        {large.value ? "恢复内容字号" : "增大内容字号"}
      </button>
      <button
        onClick={() => {
          const key = nextKey++;
          items.value = [...items.value, { key, label: `项目 ${key}` }];
        }}
        type="button"
      >
        追加项目
      </button>
      <button
        onClick={() => (items.value = [...items.value].reverse())}
        type="button"
      >
        反转项目
      </button>
      <button
        onClick={() => (items.value = items.value.slice(1))}
        type="button"
      >
        移除首项
      </button>
      <button onClick={() => (hidden.value = !hidden.value)} type="button">
        {hidden.value ? "显示容器" : "隐藏容器"}
      </button>
      <button onClick={() => (mounted.value = !mounted.value)} type="button">
        {mounted.value ? "卸载列表" : "重挂列表"}
      </button>
      <button onClick={() => firstButton.value?.focus()} type="button">
        聚焦第一项
      </button>
      <p data-overflow-selected="">选择：{selected.value}</p>
      <div
        style={{
          display: hidden.value ? "none" : "block",
          fontSize: large.value ? "22px" : "16px",
        }}
      >
        {mounted.value ? (
          <OverflowList
            data-overflow-panel="dynamic"
            itemKey="key"
            items={items.value}
            style={{ width: "320px" }}
            v-slots={slots}
          />
        ) : null}
      </div>
    </section>
  );
});
