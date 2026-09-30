import { defineVaporComponent, ref } from "vue";
import Collapsible from "semi-ui-vue/collapsible";

export default defineVaporComponent(() => {
  const open = ref(true);
  const childOpen = ref(false);
  const mounted = ref(true);
  const extra = ref(false);
  const key = ref(0);
  return (
    <section data-collapsible-dynamic="">
      <h3>动态高度、嵌套与卸载</h3>
      <button onClick={() => (open.value = !open.value)} type="button">
        切换外层
      </button>
      <button onClick={() => (extra.value = !extra.value)} type="button">
        增减内容
      </button>
      <button onClick={() => key.value++} type="button">
        重新测量
      </button>
      <button onClick={() => (mounted.value = !mounted.value)} type="button">
        {mounted.value ? "卸载面板" : "重挂面板"}
      </button>
      {mounted.value ? (
        <Collapsible
          data-collapsible-panel="dynamic"
          isOpen={open.value}
          reCalcKey={key.value}
        >
          {() => (
            <>
              <p data-collapsible-owned="">父级动态内容：{key.value}</p>
              {extra.value ? (
                <div style={{ height: "120px" }}>追加内容</div>
              ) : null}
              <button
                onClick={() => (childOpen.value = !childOpen.value)}
                type="button"
              >
                切换内层
              </button>
              <Collapsible
                data-collapsible-panel="nested"
                isOpen={childOpen.value}
              >
                {() => <p style={{ padding: "20px" }}>嵌套内容</p>}
              </Collapsible>
            </>
          )}
        </Collapsible>
      ) : null}
    </section>
  );
});
