import { defineVaporComponent } from "vue";
import { Space } from "semi-ui-vue";

export default defineVaporComponent(() => (
  <section data-space-basic="">
    <h3>方向与预设间距</h3>
    <Space data-space-default="">
      {() => (
        <>
          <button type="button">保存</button>
          <button type="button">取消</button>
        </>
      )}
    </Space>
    <Space data-space-vertical="" spacing="medium" vertical={true}>
      {() => (
        <>
          <span>第一步：填写</span>
          <span>第二步：确认</span>
        </>
      )}
    </Space>
    <h3>自定义横纵间距</h3>
    <Space data-space-numeric="" spacing={12}>
      {() => (
        <>
          <span>12px</span>
          <span>横向与纵向</span>
        </>
      )}
    </Space>
    <Space data-space-tuple="" spacing={[12, "loose"]}>
      {() => (
        <>
          <span>横向 12px</span>
          <span>纵向宽松</span>
        </>
      )}
    </Space>
    <Space
      className="space-custom"
      data-space-style=""
      spacing="tight"
      style={{ columnGap: "3px" }}
    >
      {() => (
        <>
          <span>样式覆盖</span>
          <span>列间距</span>
        </>
      )}
    </Space>
    <p>Space 只创建一个容器；子内容仍由原生 slot 挂载。</p>
  </section>
));
