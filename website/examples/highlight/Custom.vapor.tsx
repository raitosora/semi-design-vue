import { defineVaporComponent } from "vue";
import { Highlight } from "semi-ui-vue";

export default defineVaporComponent(() => (
  <section data-highlight-custom="">
    <h3>关键词对象与样式优先级</h3>
    <p data-highlight-styled="">
      <Highlight
        component="strong"
        highlightClassName="example-highlight"
        highlightStyle={{
          borderRadius: "4px",
          color: "rgb(32, 32, 32)",
          backgroundColor: "rgb(220, 245, 245)",
        }}
        searchWords={[
          {
            text: "Semi",
            className: "keyword-semi",
            style: { color: "rgb(0, 96, 96)" },
          },
          {
            text: "Design",
            className: "keyword-design",
            style: { backgroundColor: "rgb(232, 220, 255)" },
          },
        ]}
        sourceString="Semi Design / Design system"
      />
    </p>
    <p data-highlight-regex="">
      <Highlight
        autoEscape={false}
        searchWords={["v[0-9]+"]}
        sourceString="版本 v2 与 v103；点号 ."
      />
    </p>
    <p>
      对象 style 覆盖全局 highlightStyle
      中的同名属性。正则示例的模式是开发者编写的固定字符串。
    </p>
  </section>
));
