import { createComponent, createFor, defineVaporComponent, ref } from "vue";
import type { Ref, ShallowRef } from "vue";
import { Progress } from "semi-ui-vue";

const Counter = defineVaporComponent<{ label: string }>(
  (props) => {
    const count = ref(0);
    return (
      <button
        data-progress-counter={props.label}
        onClick={() => (count.value += 1)}
        type="button"
      >
        {props.label} {count.value}
      </button>
    );
  },
  { props: ["label"] },
);
const FormatItem = defineVaporComponent<{
  label: string;
  percent: Readonly<Ref<number>>;
}>(
  (props) => (
    <span data-progress-list-item={props.label}>
      <Counter label={props.label} />：{props.percent.value}
    </span>
  ),
  { props: ["label", "percent"] },
);
const FormatList = defineVaporComponent<{
  items: readonly string[];
  percent: Readonly<Ref<number>>;
}>(
  (props) =>
    createFor(
      () => props.items,
      (item: ShallowRef<string>) =>
        createComponent(FormatItem, {
          label: () => item.value,
          percent: () => props.percent,
        }),
      (item: string) => item,
    ),
  { props: ["items", "percent"] },
);
const WrappedProgress = defineVaporComponent<{ percent: number }>(
  (props) => (
    <Progress
      aria-label="包装任务"
      motion={false}
      percent={props.percent}
      showInfo
      v-slots={{
        format: ({ percent }) => <strong>包装 {percent.value}</strong>,
      }}
    />
  ),
  { props: ["percent"] },
);

export default defineVaporComponent(() => {
  const value = ref(35);
  const visible = ref(true);
  const items = ref(["甲", "乙"]);
  return (
    <section data-progress-format="">
      <style>{`[data-progress-format] .semi-progress-horizontal { height: auto; min-height: 48px; }
[data-progress-format] .semi-progress-track { height: 4px; min-width: 48px; }
[data-progress-format] .semi-progress-line-text { width: 50%; min-width: 0; flex-shrink: 0; white-space: normal; overflow-wrap: anywhere; line-height: 24px; }
[data-progress-format] [data-progress-list-item] { display: inline-block; margin: 4px; }`}</style>
      <h3>文本与原生格式内容</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (value.value = 70)} type="button">
          更新格式进度
        </button>
        <button onClick={() => (visible.value = !visible.value)} type="button">
          切换条件内容
        </button>
        <button
          onClick={() => (items.value = [...items.value].reverse())}
          type="button"
        >
          反转格式列表
        </button>
      </div>
      <Progress
        aria-label="格式文本"
        format={(percent) => `${percent * 10}‰`}
        motion={false}
        percent={value.value}
        showInfo
        style={{ margin: "20px 0" }}
      />
      <Progress
        aria-label="安全格式文本"
        format={() => '<img src=x onerror="alert(1)">'}
        motion={false}
        percent={50}
        showInfo
        style={{ margin: "20px 0" }}
      />
      <Progress
        aria-label="片段格式"
        format={() => "slot 优先"}
        motion={false}
        percent={value.value}
        showInfo
        style={{ margin: "20px 0" }}
        v-slots={{
          format: ({ percent }) => (
            <>
              <strong data-progress-formatted="">任务 {percent.value}</strong>
              <span v-if={visible.value} data-progress-conditional="">
                {" "}
                条件内容
              </span>
              <FormatList items={items.value} percent={percent} />
            </>
          ),
        }}
      />
      <WrappedProgress percent={value.value} />
      <Progress
        aria-label="外层任务"
        motion={false}
        percent={value.value}
        showInfo
        style={{ margin: "20px 0" }}
        v-slots={{
          format: ({ percent }) => (
            <Progress
              aria-label="内层任务"
              motion={false}
              percent={percent.value}
              showInfo
              type="circle"
            />
          ),
        }}
      />
      <p>
        format slot 接收只读 Ref，读取 percent.value 保留更新；条件内容放在
        fragment 中，列表使用稳定
        key。嵌套示例验证内容所有权；业务可访问结构应优先使用独立进度条。
      </p>
    </section>
  );
});
