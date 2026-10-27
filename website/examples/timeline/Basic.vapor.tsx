import { defineVaporComponent, ref } from "vue";
import { Timeline, Typography } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const empty = ref(false),
    actions = ref(0),
    bubbles = ref(0);
  return (
    <section data-timeline-basic="">
      <h3>数据与原生内容</h3>
      <button
        onClick={() => {
          empty.value = !empty.value;
        }}
        type="button"
      >
        {empty.value ? "恢复数据" : "清空数据"}
      </button>
      <div
        onClick={() => {
          bubbles.value++;
        }}
      >
        <Timeline
          aria-label="发布过程时间线"
          data-basic-timeline=""
          dataSource={
            empty.value
              ? []
              : [
                  { content: "提交变更", time: "09:00", type: "success" },
                  {
                    content: "<b>安全显示</b>",
                    extra: "文本不会解释为 HTML",
                    type: "warning",
                  },
                  {
                    content: () => (
                      <Typography.Text strong>
                        {() => <>正在验证</>}
                      </Typography.Text>
                    ),
                    time: "09:30",
                    type: "ongoing",
                  },
                  {
                    content: () => (
                      <button
                        onClick={() => {
                          actions.value++;
                        }}
                        type="button"
                      >
                        查看详情
                      </button>
                    ),
                    extra: "使用原生按钮",
                  },
                ]
          }
        >
          {() => (
            <Timeline.Item time="10:00">{() => <>声明式节点</>}</Timeline.Item>
          )}
        </Timeline>
      </div>
      <p>
        操作 <output data-actions="">{actions.value}</output> / 冒泡{" "}
        <output data-bubbles="">{bubbles.value}</output>
      </p>
      <p>
        非空 dataSource
        优先；空数组恢复声明式内容。时间、辅助信息与正文可使用同步原生渲染函数。
      </p>
    </section>
  );
});
