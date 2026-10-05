import { defineVaporComponent } from "vue";
import { Badge } from "semi-ui-vue";
const cases = [
  { label: "零", count: 0 },
  { label: "无默认阈值", count: 100 },
  { label: "阈值相等", count: 99, overflowCount: 99 },
  { label: "超过阈值", count: 100, overflowCount: 99 },
  { label: "阈值零", count: 100, overflowCount: 0 },
  { label: "负数", count: -3 },
  { label: "小数", count: 1.5 },
  { label: "NaN", count: Number.NaN },
  { label: "Infinity", count: Number.POSITIVE_INFINITY },
  { label: "null", count: null },
  { label: "undefined", count: undefined },
  { label: "文本", count: "NEW" },
  { label: "转义文本", count: "<b>文本</b>" },
] as const;
export default defineVaporComponent(() => (
  <section data-badge-basic="">
    <h3>数字边界与独立显示</h3>
    <div
      data-boundaries=""
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "24px",
        padding: "16px",
      }}
    >
      {cases.map((item) => (
        <div key={item.label} style={{ display: "grid", gap: "8px" }}>
          <span>{item.label}</span>
          <Badge
            count={item.count}
            overflowCount={
              "overflowCount" in item ? item.overflowCount : undefined
            }
          />
        </div>
      ))}
    </div>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "40px",
        padding: "24px",
      }}
    >
      <Badge count={7}>{() => <button type="button">收件箱</button>}</Badge>
      <Badge count={99} data-basic-dot="" dot>
        {() => <button type="button">有新消息</button>}
      </Badge>
      <Badge count="NEW" data-standalone="" theme="light" />
      <Badge
        count={() => (
          <span style={{ color: "var(--semi-color-success)" }}>✓</span>
        )}
      >
        {() => <span>自定义标记</span>}
      </Badge>
    </div>
  </section>
));
