import { defineVaporComponent, ref } from "vue";
import { Descriptions } from "semi-ui-vue";
import type {
  DescriptionsAlign,
  DescriptionsSize,
} from "semi-ui-vue/descriptions";

export default defineVaporComponent(() => {
  const align = ref<DescriptionsAlign>("center"),
    horizontal = ref(false),
    row = ref(false),
    size = ref<DescriptionsSize>("medium"),
    column = ref(3),
    hidden = ref(false);
  return (
    <section data-descriptions-layout="">
      <h3>对齐、双行与跨列</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => {
            align.value =
              align.value === "center"
                ? "justify"
                : align.value === "justify"
                  ? "left"
                  : align.value === "left"
                    ? "plain"
                    : "center";
          }}
          type="button"
        >
          切换对齐
        </button>
        <button
          onClick={() => {
            horizontal.value = !horizontal.value;
          }}
          type="button"
        >
          切换横向布局
        </button>
        <button
          onClick={() => {
            row.value = !row.value;
          }}
          type="button"
        >
          切换双行显示
        </button>
        <button
          onClick={() => {
            size.value =
              size.value === "medium"
                ? "small"
                : size.value === "small"
                  ? "large"
                  : "medium";
          }}
          type="button"
        >
          切换尺寸
        </button>
        <button
          onClick={() => {
            column.value = column.value === 3 ? 2 : 3;
          }}
          type="button"
        >
          切换列数
        </button>
        <button
          onClick={() => {
            hidden.value = !hidden.value;
          }}
          type="button"
        >
          切换隐藏字段
        </button>
      </div>
      <p data-layout-status="">
        {`align=${align.value} / layout=${horizontal.value ? "horizontal" : "vertical"} / column=${column.value} / size=${size.value}`}
      </p>
      <Descriptions
        align={align.value}
        column={column.value}
        data={[
          {
            key: "用户名",
            value: "张三",
            keyStyle: { width: "90px", color: "var(--semi-color-primary)" },
          },
          { key: "账号", value: "SemiDesign", hidden: hidden.value },
          { key: "跨列字段", value: "占用两列", span: 2 },
          { key: "末行字段", value: "未指定 span" },
        ]}
        data-layout-descriptions=""
        layout={horizontal.value ? "horizontal" : "vertical"}
        row={row.value}
        size={size.value}
        style={{ maxWidth: "640px" }}
      />
      <p>
        column 只参与横向分组；跨列项不会拆开。row 改变双行样式，size
        控制双行文字尺寸。keyStyle 只设置字段名，值的样式可在渲染函数中指定。
      </p>
    </section>
  );
});
