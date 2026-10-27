import { defineVaporComponent, ref } from "vue";
import { Timeline } from "semi-ui-vue";
import { IconTickCircle, IconAlertTriangle } from "semi-icons-vue";

export default defineVaporComponent(() => {
  const mode = ref<"left" | "right" | "center" | "alternate">("left"),
    custom = ref(false),
    detail = ref(false);
  return (
    <section data-timeline-layout="">
      <h3>排列、状态与自定义节点</h3>
      <button
        onClick={() => {
          mode.value =
            mode.value === "left"
              ? "right"
              : mode.value === "right"
                ? "center"
                : mode.value === "center"
                  ? "alternate"
                  : "left";
        }}
        type="button"
      >
        切换排列
      </button>
      <button
        onClick={() => {
          custom.value = !custom.value;
        }}
        type="button"
      >
        切换自定义圆点
      </button>
      <button
        onClick={() => {
          detail.value = !detail.value;
        }}
        type="button"
      >
        更新节点字段
      </button>
      <p data-mode="">{mode.value}</p>
      <Timeline data-layout-timeline="" mode={mode.value}>
        {() => (
          <>
            <Timeline.Item
              dot={custom.value ? () => <IconTickCircle /> : undefined}
              extra={detail.value ? "更新后的辅助信息" : "已完成"}
              time={detail.value ? "10:00" : "09:00"}
              type="success"
            >
              {() => <>第一个节点</>}
            </Timeline.Item>
            <Timeline.Item
              color={detail.value ? "rgb(140, 40, 180)" : undefined}
              dot={custom.value ? () => <IconAlertTriangle /> : undefined}
              position="right"
              time="09:20"
              type="warning"
            >
              {() => <>第二个节点，显式 right</>}
            </Timeline.Item>
            <Timeline.Item time="09:30" type="ongoing">
              {() => <>第三个节点</>}
            </Timeline.Item>
            <Timeline.Item extra="请检查任务" type="error">
              {() => <>第四个节点</>}
            </Timeline.Item>
            <Timeline.Item>{() => <>默认状态</>}</Timeline.Item>
          </>
        )}
      </Timeline>
      <p>
        left/right 模式强制节点位置；center/alternate 才采用 truthy
        position。没有横向、pending 或 reverse 属性。
      </p>
    </section>
  );
});
