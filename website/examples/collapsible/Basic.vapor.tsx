import { defineVaporComponent, ref } from "vue";
import { Collapsible } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const open = ref(false);
  const motion = ref(true);
  const duration = ref(250);
  const completed = ref(0);
  return (
    <section data-collapsible-basic="">
      <h3>受控展开与动画</h3>
      <button
        aria-controls="collapsible-basic-content"
        aria-expanded={open.value}
        onClick={() => (open.value = !open.value)}
        type="button"
      >
        切换内容
      </button>
      <button onClick={() => (motion.value = !motion.value)} type="button">
        {motion.value ? "关闭动画" : "开启动画"}
      </button>
      <label>
        动画时长
        <input
          aria-label="动画时长"
          min="0"
          onInput={(event) =>
            (duration.value = Number((event.target as HTMLInputElement).value))
          }
          type="number"
          value={duration.value}
        />
      </label>
      <p data-collapsible-completed="">完成次数：{completed.value}</p>
      <Collapsible
        data-collapsible-panel="basic"
        duration={duration.value}
        fade
        id="collapsible-basic-content"
        isOpen={open.value}
        motion={motion.value}
        onMotionEnd={() => completed.value++}
      >
        {() => (
          <div
            style={{ padding: "12px", background: "var(--semi-color-fill-0)" }}
          >
            <p>Semi Design 以内容优先进行设计。</p>
            <p>内容由父组件拥有，展开状态由 isOpen 控制。</p>
          </div>
        )}
      </Collapsible>
    </section>
  );
});
