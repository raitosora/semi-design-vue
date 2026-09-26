import { defineVaporComponent, ref } from "vue";
import { Progress } from "semi-ui-vue";
import type { ProgressProps } from "semi-ui-vue/progress";

export default defineVaporComponent(() => {
  const percent = ref(20);
  const mounted = ref(true);
  const options = ref<
    Pick<
      ProgressProps,
      | "type"
      | "size"
      | "showInfo"
      | "indeterminate"
      | "motion"
      | "width"
      | "strokeWidth"
    >
  >({ showInfo: true });
  return (
    <section data-progress-dynamic="">
      <h3>动态形态与进度</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (percent.value = 80)} type="button">
          更新到 80
        </button>
        <button
          onClick={() => {
            percent.value = 5;
            percent.value = 37.25;
          }}
          type="button"
        >
          快速更新
        </button>
        <button
          onClick={() =>
            (options.value = {
              type: "circle",
              size: "default",
              showInfo: true,
              width: 100,
              strokeWidth: 8,
            })
          }
          type="button"
        >
          切换环形
        </button>
        <button
          onClick={() =>
            (options.value = {
              ...options.value,
              size: "small",
              width: undefined,
            })
          }
          type="button"
        >
          切换小号
        </button>
        <button
          onClick={() =>
            (options.value = {
              ...options.value,
              indeterminate: !options.value.indeterminate,
            })
          }
          type="button"
        >
          切换不确定
        </button>
        <button
          onClick={() =>
            (options.value = {
              type: undefined,
              size: undefined,
              showInfo: undefined,
              indeterminate: undefined,
              motion: undefined,
              width: undefined,
              strokeWidth: undefined,
            })
          }
          type="button"
        >
          设为 undefined
        </button>
        <button onClick={() => (options.value = {})} type="button">
          移除可选属性
        </button>
        <button onClick={() => (mounted.value = !mounted.value)} type="button">
          {mounted.value ? "卸载 Progress" : "挂载 Progress"}
        </button>
      </div>
      <div
        data-progress-live=""
        style={{ marginTop: "20px", minHeight: "110px", maxWidth: "320px" }}
      >
        <Progress
          v-if={mounted.value}
          {...options.value}
          aria-label="动态任务"
          percent={percent.value}
        />
      </div>
      <p>
        线形条的长度和 aria-valuenow 使用目标值；数字以 300ms 动画更新。环形
        aria-valuenow 跟随动画数字。重挂从当前目标值开始。
      </p>
    </section>
  );
});
