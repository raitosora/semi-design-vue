import { defineVaporComponent } from "vue";
import { Button } from "semi-ui-vue";

const types = [
  ["primary", "主要"],
  ["secondary", "次要"],
  ["tertiary", "第三"],
  ["warning", "警告"],
  ["danger", "危险"],
] as const;

export default defineVaporComponent(() => (
  <section data-button-basic="">
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {types.map(([type, text]) => (
        <Button key={type} text={text} type={type} />
      ))}
    </div>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        marginTop: "12px",
      }}
    >
      <Button size="large" text="大号" />
      <Button text="默认尺寸" />
      <Button size="small" text="小号" />
      <Button block={true} data-block-button="" text="块级操作" />
    </div>
    <p>text 是标量快捷方式；原生 Vapor 的默认内容必须以函数 slot 传入。</p>
  </section>
));
