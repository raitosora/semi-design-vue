import { defineVaporComponent, ref } from "vue";
import { Col, ConfigProvider, Row } from "semi-ui-vue";

const tile = {
  background: "var(--semi-color-primary-light-default)",
  border: "1px solid var(--semi-color-primary)",
  borderRadius: "4px",
  padding: "12px 8px",
  textAlign: "center" as const,
};

export default defineVaporComponent(() => {
  const rtl = ref(false);
  const gutter = ref<8 | [16, { xs: number; sm: number; md: number }]>([
    16,
    { xs: 8, sm: 12, md: 20 },
  ]);
  return (
    <section data-grid-responsive="">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (rtl.value = !rtl.value)} type="button">
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
        <button
          onClick={() =>
            (gutter.value = Array.isArray(gutter.value)
              ? 8
              : [16, { xs: 8, sm: 12, md: 20 }])
          }
          type="button"
        >
          切换响应式间距
        </button>
      </div>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <div>
            <Row data-grid-responsive-row="" gutter={gutter.value}>
              {() => (
                <>
                  <Col
                    data-grid-responsive-col=""
                    md={8}
                    sm={12}
                    xl={6}
                    xs={24}
                    xxl={4}
                  >
                    {() => <div style={tile}>列 A</div>}
                  </Col>
                  <Col md={8} sm={12} xl={6} xs={24} xxl={4}>
                    {() => <div style={tile}>列 B</div>}
                  </Col>
                  <Col md={8} sm={12} xl={6} xs={24} xxl={4}>
                    {() => <div style={tile}>列 C</div>}
                  </Col>
                </>
              )}
            </Row>
            <Row
              data-grid-responsive-object-row=""
              gutter={{ xs: 0, sm: 12, md: 16, lg: 24, xl: 28, xxl: 32 }}
            >
              {() => (
                <>
                  <Col
                    data-grid-responsive-object-col=""
                    lg={{ span: 6, offset: 2 }}
                    sm={{ span: 12, order: 2 }}
                    xs={{ span: 24, order: 1 }}
                  >
                    {() => <div style={tile}>对象断点配置</div>}
                  </Col>
                  <Col lg={16} sm={12} xs={24}>
                    {() => <div style={tile}>随屏宽换行</div>}
                  </Col>
                  <Col data-grid-zero-col="" sm={12} xs={0}>
                    {() => <div style={tile}>xs 隐藏，sm 显示</div>}
                  </Col>
                </>
              )}
            </Row>
          </div>
        )}
      </ConfigProvider>
      <p>
        列宽依次为 xs 24、sm 12、md 8、xl 6、xxl
        4；缩放视口可观察换行及纵向间距。
      </p>
    </section>
  );
});
