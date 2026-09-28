import { defineVaporComponent, ref } from "vue";
import { Tooltip } from "semi-ui-vue";
import type { TooltipInstance } from "semi-ui-vue/tooltip";

export default defineVaporComponent(() => {
  const expanded = ref(false);
  const mounted = ref(true);
  const container = ref<HTMLElement | null>(null);
  const tooltip = ref<TooltipInstance | null>(null);
  const local = ref(true);
  const exposedId = ref("");
  return (
    <section data-tooltip-advanced="" style={{ padding: "48px 12px" }}>
      <h3>动态内容、容器、禁用与显式多根</h3>
      <button onClick={() => (expanded.value = !expanded.value)} type="button">
        切换动态内容
      </button>
      <button onClick={() => (local.value = !local.value)} type="button">
        切换挂载容器
      </button>
      <button
        onClick={() => (exposedId.value = tooltip.value?.getPopupId() ?? "")}
        type="button"
      >
        查看弹层 ID
      </button>
      <output data-tooltip-exposed-id="">{exposedId.value}</output>
      <button onClick={() => tooltip.value?.rePosition()} type="button">
        重新定位
      </button>
      <button onClick={() => tooltip.value?.focusTrigger()} type="button">
        聚焦触发器
      </button>
      <button onClick={() => (mounted.value = !mounted.value)} type="button">
        {mounted.value ? "卸载动态提示" : "重挂动态提示"}
      </button>
      <div
        data-tooltip-container=""
        ref={container}
        style={{
          position: "relative",
          minHeight: "180px",
          padding: "64px 24px",
          border: "1px solid var(--semi-color-border)",
          overflow: "auto",
        }}
      >
        <Tooltip
          v-if={mounted.value}
          getPopupContainer={() =>
            local.value && container.value ? container.value : document.body
          }
          guardFocus
          keepDOM
          motion={false}
          ref={tooltip}
          returnFocusOnClose
          style={{ width: "240px" }}
          trigger="click"
          wrapperId="tooltip-dynamic"
        >
          {{
            default: (scope) => (
              <button
                {...scope.attrs}
                {...scope.triggerProps}
                ref={scope.triggerRef}
                type="button"
              >
                动态内容提示
              </button>
            ),
            content: (scope) => (
              <div data-tooltip-dynamic-content="">
                <button ref={scope.initialFocusRef} type="button">
                  内容首个按钮
                </button>
                <button
                  onClick={() => (expanded.value = !expanded.value)}
                  type="button"
                >
                  展开提示内容
                </button>
                <button
                  onClick={() => (local.value = !local.value)}
                  type="button"
                >
                  迁移提示容器
                </button>
                <p>
                  {expanded.value
                    ? "展开后的动态内容，尺寸变化会重新定位。第二段文本展示窄容器内的换行。"
                    : "短内容"}
                </p>
              </div>
            ),
          }}
        </Tooltip>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          marginTop: "48px",
        }}
      >
        <Tooltip
          content="禁用按钮由显式 span 接收事件"
          motion={false}
          wrapperId="tooltip-disabled"
        >
          {(scope) => (
            <span
              {...scope.attrs}
              {...scope.triggerProps}
              aria-label="禁用按钮说明"
              data-tooltip-disabled-wrapper=""
              ref={scope.triggerRef}
              style={{ display: "inline-block" }}
            >
              <button disabled style={{ pointerEvents: "none" }} type="button">
                禁用按钮
              </button>
            </span>
          )}
        </Tooltip>
        <Tooltip
          content="两个原生根共同构成触发区域"
          motion={false}
          wrapperId="tooltip-multiple"
        >
          {(scope) => (
            <>
              <button
                {...scope.attrs}
                {...scope.triggerProps}
                ref={scope.getTriggerRef("first")}
                type="button"
              >
                多根甲
              </button>
              <button
                {...scope.triggerProps}
                ref={scope.getTriggerRef("second")}
                type="button"
              >
                多根乙
              </button>
            </>
          )}
        </Tooltip>
        <Tooltip content="自定义箭头" motion={false} wrapperId="tooltip-arrow">
          {{
            default: (scope) => (
              <button
                {...scope.attrs}
                {...scope.triggerProps}
                ref={scope.triggerRef}
                type="button"
              >
                自定义箭头提示
              </button>
            ),
            arrow: (scope) => (
              <span
                aria-hidden="true"
                data-tooltip-custom-arrow={scope.placement.value}
                style={{
                  width: "24px",
                  height: "7px",
                  background: "currentColor",
                  clipPath: "polygon(0 0,100% 0,50% 100%)",
                }}
              />
            ),
          }}
        </Tooltip>
      </div>
      <Tooltip motion={false} trigger="click" wrapperId="tooltip-nested-parent">
        {{
          default: (scope) => (
            <button
              {...scope.attrs}
              {...scope.triggerProps}
              ref={scope.triggerRef}
              style={{ marginTop: "48px" }}
              type="button"
            >
              嵌套外层提示
            </button>
          ),
          content: () => (
            <div>
              <p>外层内容</p>
              <Tooltip
                content="内层内容"
                motion={false}
                position="right"
                trigger="click"
                wrapperId="tooltip-nested-child"
              >
                {(scope) => (
                  <button
                    {...scope.attrs}
                    {...scope.triggerProps}
                    ref={scope.triggerRef}
                    type="button"
                  >
                    嵌套内层提示
                  </button>
                )}
              </Tooltip>
            </div>
          ),
        }}
      </Tooltip>
    </section>
  );
});
