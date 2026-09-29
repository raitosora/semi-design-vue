import { defineVaporComponent, ref } from "vue";
import { Popover, provideAriaIdScope } from "semi-ui-vue";
import type { PopoverInstance } from "semi-ui-vue/popover";

export default defineVaporComponent(() => {
  provideAriaIdScope(`popover-advanced-${crypto.randomUUID()}`);
  const expanded = ref(false);
  const mounted = ref(true);
  const container = ref<HTMLElement | null>(null);
  const popover = ref<PopoverInstance | null>(null);
  const local = ref(true);
  return (
    <section data-popover-advanced="" style={{ padding: "48px 12px" }}>
      <h3>动态内容、容器、禁用与显式多根</h3>
      <button onClick={() => (expanded.value = !expanded.value)} type="button">
        切换动态内容
      </button>
      <button onClick={() => (local.value = !local.value)} type="button">
        切换挂载容器
      </button>
      <button onClick={() => popover.value?.focusTrigger()} type="button">
        聚焦触发器
      </button>
      <button onClick={() => (mounted.value = !mounted.value)} type="button">
        {mounted.value ? "卸载动态气泡" : "重挂动态气泡"}
      </button>
      <div
        data-popover-container=""
        ref={container}
        style={{
          position: "relative",
          minHeight: "400px",
          padding: "64px 24px",
          border: "1px solid var(--semi-color-border)",
          overflow: "auto",
        }}
      >
        <Popover
          v-if={mounted.value}
          contentClassName="popover-dynamic"
          getPopupContainer={() =>
            local.value && container.value ? container.value : document.body
          }
          guardFocus
          keepDOM
          motion={false}
          position="bottomLeft"
          ref={popover}
          returnFocusOnClose
          style={{ width: "240px" }}
          trigger="click"
        >
          {{
            default: (scope) => (
              <button
                {...scope.attrs}
                {...scope.triggerProps}
                ref={scope.triggerRef}
                type="button"
              >
                动态内容气泡
              </button>
            ),
            content: (scope) => (
              <div data-popover-dynamic-content="">
                <h4>编辑信息</h4>
                <button ref={scope.initialFocusRef} type="button">
                  内容首个按钮
                </button>
                <button
                  onClick={() => (expanded.value = !expanded.value)}
                  type="button"
                >
                  展开气泡内容
                </button>
                <button
                  onClick={() => (local.value = !local.value)}
                  type="button"
                >
                  迁移气泡容器
                </button>
                <p>
                  {expanded.value
                    ? "展开后的动态内容，尺寸变化会重新定位。第二段文本展示窄容器内的换行。"
                    : "短内容"}
                </p>
              </div>
            ),
          }}
        </Popover>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          marginTop: "48px",
        }}
      >
        <Popover
          content="禁用按钮由显式 span 接收事件"
          contentClassName="popover-disabled"
          motion={false}
        >
          {(scope) => (
            <span
              {...scope.attrs}
              {...scope.triggerProps}
              aria-label="禁用按钮说明"
              data-popover-disabled-wrapper=""
              ref={scope.triggerRef}
              style={{ display: "inline-block" }}
            >
              <button disabled style={{ pointerEvents: "none" }} type="button">
                禁用按钮
              </button>
            </span>
          )}
        </Popover>
        <Popover
          content="两个原生根共同构成触发区域"
          contentClassName="popover-multiple"
          motion={false}
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
        </Popover>
        <Popover
          arrowStyle={{
            borderColor: "#1677ff",
            backgroundColor: "#e8f3ff",
            borderOpacity: 1,
          }}
          content="箭头颜色与气泡样式组合"
          contentClassName="popover-arrow"
          motion={false}
          showArrow
          style={{
            backgroundColor: "#e8f3ff",
            borderColor: "#1677ff",
            color: "#1c1f23",
          }}
        >
          {(scope) => (
            <button
              {...scope.attrs}
              {...scope.triggerProps}
              ref={scope.triggerRef}
              type="button"
            >
              箭头样式气泡
            </button>
          )}
        </Popover>
      </div>
      <Popover
        contentClassName="popover-nested-parent"
        motion={false}
        trigger="click"
      >
        {{
          default: (scope) => (
            <button
              {...scope.attrs}
              {...scope.triggerProps}
              ref={scope.triggerRef}
              style={{ marginTop: "48px" }}
              type="button"
            >
              嵌套外层气泡
            </button>
          ),
          content: () => (
            <div>
              <p>外层内容</p>
              <Popover
                content="内层内容"
                contentClassName="popover-nested-child"
                motion={false}
                position="right"
                trigger="click"
              >
                {(scope) => (
                  <button
                    {...scope.attrs}
                    {...scope.triggerProps}
                    ref={scope.triggerRef}
                    type="button"
                  >
                    嵌套内层气泡
                  </button>
                )}
              </Popover>
            </div>
          ),
        }}
      </Popover>
    </section>
  );
});
