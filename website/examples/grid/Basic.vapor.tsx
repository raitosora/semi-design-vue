import { defineVaporComponent } from "vue";
import { Col, Row } from "semi-ui-vue";

const tile = {
  background: "var(--semi-color-primary-light-default)",
  border: "1px solid var(--semi-color-primary)",
  borderRadius: "4px",
  padding: "12px 8px",
  textAlign: "center" as const,
};

export default defineVaporComponent(() => (
  <section data-grid-basic="">
    <h3>24 栅格与换行</h3>
    <Row data-grid-basic-row="" gutter={16}>
      {() => (
        <>
          <Col data-grid-half="" span={12}>
            {() => <div style={tile}>12 / 24</div>}
          </Col>
          <Col span={12}>{() => <div style={tile}>12 / 24</div>}</Col>
          <Col data-grid-third="" span={8}>
            {() => <div style={tile}>8 / 24</div>}
          </Col>
          <Col span={8}>{() => <div style={tile}>8 / 24</div>}</Col>
          <Col span={8}>{() => <div style={tile}>8 / 24</div>}</Col>
        </>
      )}
    </Row>
    <h3>偏移、定位与 Flex 排列</h3>
    <Row data-grid-offset-row="" gutter={[16, 12]}>
      {() => (
        <>
          <Col span={8}>{() => <div style={tile}>8 格</div>}</Col>
          <Col data-grid-offset="" offset={8} span={8}>
            {() => <div style={tile}>偏移 8 格</div>}
          </Col>
          <Col data-grid-push="" push={2} span={6}>
            {() => <div style={tile}>向右 2 格</div>}
          </Col>
          <Col data-grid-pull="" offset={6} pull={1} span={6}>
            {() => <div style={tile}>向左 1 格</div>}
          </Col>
        </>
      )}
    </Row>
    <Row
      align="middle"
      data-grid-flex-row=""
      gutter={8}
      justify="space-between"
      style={{ clear: "both", minHeight: "90px", width: "100%" }}
      type="flex"
    >
      {() => (
        <>
          <Col data-grid-order-first="" order={2} span={6}>
            {() => <div style={tile}>A · order 2</div>}
          </Col>
          <Col data-grid-order-second="" order={1} span={6}>
            {() => <div style={tile}>B · order 1</div>}
          </Col>
        </>
      )}
    </Row>
    <p>视觉顺序不改变 DOM 和键盘顺序；交互流程请按 DOM 顺序设计。</p>
  </section>
));
