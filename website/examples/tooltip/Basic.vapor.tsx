import { defineVaporComponent, ref } from "vue";
import { Tooltip } from "semi-ui-vue";
import type { Position } from "semi-ui-vue/tooltip";

const positions: readonly Position[] = [
  "top",
  "topLeft",
  "topRight",
  "left",
  "leftTop",
  "leftBottom",
  "right",
  "rightTop",
  "rightBottom",
  "bottom",
  "bottomLeft",
  "bottomRight",
  "leftTopOver",
  "rightTopOver",
  "leftBottomOver",
  "rightBottomOver",
];
export default defineVaporComponent(() => {
  const callbackVersion = ref(1);
  return (
    <section
      data-tooltip-basic=""
      style={{ padding: "48px 12px", maxWidth: "100%" }}
    >
      <h3>基础提示与全部定位</h3>
      <Tooltip
        content="保存当前编辑内容"
        motion={false}
        wrapperId="tooltip-basic-save"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            悬停提示
          </button>
        )}
      </Tooltip>
      <Tooltip
        content={() => `primitive 函数返回的提示 ${callbackVersion.value}`}
        motion={false}
        wrapperId="tooltip-render-content"
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            函数内容提示
          </button>
        )}
      </Tooltip>
      <button
        data-tooltip-callback-update=""
        onClick={() => callbackVersion.value++}
        type="button"
      >
        更新函数内容
      </button>
      <div
        data-tooltip-positions=""
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          padding: "64px 36px",
        }}
      >
        {positions.map((position) => (
          <Tooltip
            content={`位置 ${position}`}
            key={position}
            motion={false}
            position={position}
            wrapperId={`tooltip-position-${position}`}
          >
            {(scope) => (
              <button
                {...scope.attrs}
                {...scope.triggerProps}
                data-tooltip-position={position}
                ref={scope.triggerRef}
                type="button"
              >
                {position}
              </button>
            )}
          </Tooltip>
        ))}
      </div>
      <p>浮层与原生按钮分离，无默认包装根；自动调整可能改变最终方向。</p>
    </section>
  );
});
