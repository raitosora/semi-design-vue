import { defineVaporComponent, ref } from "vue";
import { Col, Row } from "semi-ui-vue";

const tile = {
  background: "var(--semi-color-primary-light-default)",
  border: "1px solid var(--semi-color-primary)",
  borderRadius: "4px",
  padding: "10px 8px",
};

const StatefulCell = defineVaporComponent<{ label: string }>((props) => {
  const count = ref(0);
  return (
    <button onClick={() => (count.value += 1)} type="button">
      {props.label} {count.value}
    </button>
  );
});

export default defineVaporComponent(() => {
  const show = ref(true);
  const mounted = ref(true);
  const items = ref(["甲", "乙", "丙"]);
  const spacing = ref<0 | 16>(16);
  return (
    <section data-grid-dynamic="">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (show.value = !show.value)} type="button">
          {show.value ? "隐藏条件列" : "显示条件列"}
        </button>
        <button
          onClick={() => (items.value = [...items.value].reverse())}
          type="button"
        >
          反转列
        </button>
        <button
          onClick={() => (items.value = [...items.value, "丁"])}
          type="button"
        >
          添加列
        </button>
        <button
          onClick={() => (items.value = items.value.slice(1))}
          type="button"
        >
          移除首列
        </button>
        <button
          onClick={() => (spacing.value = spacing.value === 16 ? 0 : 16)}
          type="button"
        >
          切换零间距
        </button>
        <button onClick={() => (mounted.value = !mounted.value)} type="button">
          {mounted.value ? "卸载 Row" : "挂载 Row"}
        </button>
      </div>
      <Row
        v-if={mounted.value}
        data-grid-dynamic-row=""
        gutter={[spacing.value, 12]}
      >
        {() => (
          <>
            <Col data-grid-stateful="" span={6}>
              {() => <StatefulCell label="计数" />}
            </Col>
            <Col v-if={show.value} data-grid-conditional="" span={6}>
              {() => <div style={tile}>条件列</div>}
            </Col>
            {items.value.map((item) => (
              <Col data-grid-list-item={item} key={item} span={6}>
                {() => <div style={tile}>{item}</div>}
              </Col>
            ))}
            <Col data-grid-nested-host="" span={24}>
              {() => (
                <Row data-grid-nested-row="" gutter={8}>
                  {() => (
                    <>
                      <Col data-grid-nested-col="" span={12}>
                        {() => <div style={tile}>内层 A</div>}
                      </Col>
                      <Col span={12}>
                        {() => <div style={tile}>内层 B</div>}
                      </Col>
                    </>
                  )}
                </Row>
              )}
            </Col>
          </>
        )}
      </Row>
      <p>嵌套 Row 使用自己的间距；更新外层间距不会重置保留的计数按钮。</p>
    </section>
  );
});
