import { defineVaporComponent } from "vue";
import { Divider } from "semi-ui-vue";

export default defineVaporComponent(() => (
  <section data-divider-basic="">
    <h3>水平分割</h3>
    <p>内容之间使用实线，间距可以是数字或 CSS 长度。</p>
    <Divider data-horizontal-solid="" margin={12} />
    <p>需要弱化层次时使用虚线。</p>
    <Divider dashed={true} data-horizontal-dashed="" margin="12px" />
    <Divider data-style-override="" margin={12} style={{ marginTop: "4px" }} />
    <h3>垂直分割</h3>
    <div>
      <span>阅读</span>
      <Divider data-vertical-solid="" layout="vertical" margin={12} />
      <span>编辑</span>
      <Divider
        dashed={true}
        data-vertical-dashed=""
        layout="vertical"
        margin="12px"
      />
      <span>归档</span>
    </div>
    <p>需要阅读器识别区域分隔时，由调用方明确添加语义。</p>
    <Divider
      aria-label="阅读区域分隔"
      aria-orientation="horizontal"
      margin={12}
      role="separator"
    />
  </section>
));
