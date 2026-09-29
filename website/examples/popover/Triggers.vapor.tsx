import { defineVaporComponent, ref } from "vue";
import { Popover, provideAriaIdScope } from "semi-ui-vue";

export default defineVaporComponent(() => {
  provideAriaIdScope(`popover-triggers-${crypto.randomUUID()}`);
  const custom = ref(false);
  const condition = ref(false);
  const events = ref("尚未触发");
  return (
    <section
      data-popover-triggers=""
      style={{ display: "grid", gap: "20px", padding: "40px 12px" }}
    >
      <h3>五种触发、条件与延迟</h3>
      <Popover
        content="点击显示，点击外部关闭"
        contentClassName="popover-click"
        motion={false}
        trigger="click"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            点击气泡
          </button>
        )}
      </Popover>
      <Popover
        content="键盘聚焦显示"
        contentClassName="popover-focus"
        guardFocus={false}
        motion={false}
        trigger="focus"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            聚焦气泡
          </button>
        )}
      </Popover>
      <Popover
        content="右键打开气泡"
        contentClassName="popover-context-menu"
        motion={false}
        trigger="contextMenu"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            右键气泡
          </button>
        )}
      </Popover>
      <button
        onClick={() => (custom.value = !custom.value)}
        style={{ marginBottom: "32px" }}
        type="button"
      >
        {custom.value ? "关闭受控气泡" : "打开受控气泡"}
      </button>
      <Popover
        closeOnEsc
        content="由 visible 驱动的气泡"
        contentClassName="popover-custom"
        motion={false}
        onClickOutSide={() => {
          custom.value = false;
          events.value = "外部请求关闭";
        }}
        onEscKeyDown={() => {
          custom.value = false;
          events.value = "Escape 请求关闭";
        }}
        trigger="custom"
        visible={custom.value}
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            受控目标
          </button>
        )}
      </Popover>
      <output data-popover-events="">{events.value}</output>
      <button
        onClick={() => (condition.value = !condition.value)}
        type="button"
      >
        {condition.value ? "关闭自动触发条件" : "允许自动触发"}
      </button>
      <Popover
        condition={condition.value}
        content="条件允许后的气泡"
        contentClassName="popover-condition"
        motion={false}
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            条件气泡
          </button>
        )}
      </Popover>
      <Popover
        content="延迟 200 毫秒"
        contentClassName="popover-delay"
        motion={false}
        mouseEnterDelay={200}
        mouseLeaveDelay={200}
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            延迟气泡
          </button>
        )}
      </Popover>
      <button data-popover-outside="" type="button">
        外部按钮
      </button>
    </section>
  );
});
