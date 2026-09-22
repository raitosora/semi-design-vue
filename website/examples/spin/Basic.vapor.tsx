import { defineVaporComponent } from "vue";
import { Spin } from "semi-ui-vue";

export default defineVaporComponent(() => (
  <section data-spin-basic="">
    <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
      <Spin aria-label="小号加载指示" size="small" />
      <Spin aria-label="中号加载指示" size="middle" />
      <Spin aria-label="大号加载指示" size="large" />
    </div>
    <p>小、中、大默认图标尺寸分别为 14、20、32px。</p>
    <div data-spin-initial="">
      <Spin
        delay={300}
        tip="初次挂载立即显示"
        wrapperClassName="spin-initial-example"
      >
        {() => (
          <p style={{ minHeight: "72px", margin: 0 }}>
            首次 spinning=true，即使设置 delay 也立即显示。
          </p>
        )}
      </Spin>
    </div>
  </section>
));
