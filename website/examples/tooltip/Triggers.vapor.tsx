import { defineVaporComponent, ref } from "vue";
import { Tooltip } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const custom = ref(false);
  const condition = ref(false);
  const events = ref("尚未触发");
  return (
    <section
      data-tooltip-triggers=""
      style={{ display: "grid", gap: "20px", padding: "40px 12px" }}
    >
      <h3>五种触发、条件与延迟</h3>
      <Tooltip
        content="点击显示，点击外部关闭"
        motion={false}
        trigger="click"
        wrapperId="tooltip-click"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            点击提示
          </button>
        )}
      </Tooltip>
      <Tooltip
        content="键盘聚焦显示"
        motion={false}
        trigger="focus"
        wrapperId="tooltip-focus"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            聚焦提示
          </button>
        )}
      </Tooltip>
      <Tooltip
        content="右键打开提示"
        motion={false}
        trigger="contextMenu"
        wrapperId="tooltip-context-menu"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            右键提示
          </button>
        )}
      </Tooltip>
      <button
        onClick={() => (custom.value = !custom.value)}
        style={{ marginBottom: "32px" }}
        type="button"
      >
        {custom.value ? "关闭受控提示" : "打开受控提示"}
      </button>
      <Tooltip
        closeOnEsc
        content="由 visible 驱动的提示"
        motion={false}
        onClickOutSide={() => (events.value = "外部通知，不自动关闭")}
        onEscKeyDown={() => (events.value = "Escape 通知，不自动关闭")}
        onVisibleChange={(visible) => (events.value = `可见通知 ${visible}`)}
        trigger="custom"
        visible={custom.value}
        wrapperId="tooltip-custom"
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
      </Tooltip>
      <output data-tooltip-events="">{events.value}</output>
      <button
        onClick={() => (condition.value = !condition.value)}
        type="button"
      >
        {condition.value ? "关闭自动触发条件" : "允许自动触发"}
      </button>
      <Tooltip
        condition={condition.value}
        content="条件允许后的提示"
        motion={false}
        wrapperId="tooltip-condition"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            条件提示
          </button>
        )}
      </Tooltip>
      <Tooltip
        content="延迟 200 毫秒"
        motion={false}
        mouseEnterDelay={200}
        mouseLeaveDelay={200}
        wrapperId="tooltip-delay"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            延迟提示
          </button>
        )}
      </Tooltip>
      <button data-tooltip-outside="" type="button">
        外部按钮
      </button>
    </section>
  );
});
