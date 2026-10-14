import { defineVaporComponent, ref } from "vue";
import { Descriptions, Tag, Typography } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const clicks = ref(0),
    bubbles = ref(0),
    useData = ref(true);
  const data = [
    { key: "实际用户数量", value: "1,480,000" },
    {
      key: "7天留存",
      value: () => <Typography.Text strong>{() => <>98%</>}</Typography.Text>,
    },
    {
      key: "垂类标签",
      value: () => <Tag style={{ margin: "0" }}>{() => <>电商</>}</Tag>,
    },
    { key: "原始文本", value: "<b>安全显示</b>" },
    {
      key: "操作",
      value: () => (
        <button
          onClick={() => {
            clicks.value++;
          }}
          type="button"
        >
          查看详情
        </button>
      ),
    },
    { key: "隐藏字段", value: "不应显示", hidden: true },
  ];
  return (
    <section data-descriptions-basic="">
      <h3>键值数据与声明式内容</h3>
      <button
        onClick={() => {
          useData.value = !useData.value;
        }}
        type="button"
      >
        {useData.value ? "清空数据" : "恢复数据"}
      </button>
      <div
        onClick={() => {
          bubbles.value++;
        }}
      >
        <Descriptions
          data={useData.value ? data : []}
          data-basic-descriptions=""
        >
          {() => (
            <Descriptions.Item itemKey="声明式字段">
              {() => <>空数据时显示此内容</>}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
      <p>
        操作 <output data-actions="">{clicks.value}</output> / 外层冒泡{" "}
        <output data-bubbles="">{bubbles.value}</output>
      </p>
      <p>
        非空 data
        优先；空数组恢复声明式内容。复杂值使用同步原生渲染函数，按钮保留原生键盘操作和事件冒泡。
      </p>
    </section>
  );
});
