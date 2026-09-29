import { defineVaporComponent, ref } from "vue";
import { Popover, provideAriaIdScope } from "semi-ui-vue";
import type { Position } from "semi-ui-vue/popover";

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
  provideAriaIdScope(`popover-basic-${crypto.randomUUID()}`);
  const arrows = ref(true);
  const centered = ref(true);
  return (
    <section
      data-popover-basic=""
      style={{ padding: "48px 12px", maxWidth: "100%" }}
    >
      <h3>基础气泡与全部定位</h3>
      <Popover
        content="保存当前编辑内容"
        contentClassName="popover-basic-save"
        motion={false}
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            悬停气泡
          </button>
        )}
      </Popover>
      <Popover
        content={() => "同步 primitive 内容"}
        contentClassName="popover-render-content"
        motion={false}
      >
        {(scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            ref={scope.triggerRef}
            type="button"
          >
            函数气泡
          </button>
        )}
      </Popover>
      <button onClick={() => (arrows.value = !arrows.value)} type="button">
        {arrows.value ? "隐藏定位箭头" : "显示定位箭头"}
      </button>
      <button onClick={() => (centered.value = !centered.value)} type="button">
        {centered.value ? "关闭箭头居中" : "启用箭头居中"}
      </button>
      <output data-popover-arrow-mode="">
        {centered.value ? "箭头居中" : "默认箭头偏移"}
      </output>
      <div
        data-popover-positions=""
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          padding: "64px 36px",
        }}
      >
        {positions.map((position) => (
          <Popover
            arrowPointAtCenter={centered.value}
            arrowStyle={{
              borderColor: "var(--semi-color-border)",
              backgroundColor: "var(--semi-color-bg-3)",
              borderOpacity: 0.8,
            }}
            content={`位置 ${position}`}
            contentClassName={`popover-position-${position}`}
            key={position}
            motion={false}
            position={position}
            showArrow={arrows.value}
          >
            {(scope) => (
              <button
                {...scope.attrs}
                {...scope.triggerProps}
                data-popover-position={position}
                ref={scope.triggerRef}
                type="button"
              >
                {position}
              </button>
            )}
          </Popover>
        ))}
      </div>
      <p>浮层与原生按钮分离，无默认包装根；自动调整可能改变最终方向。</p>
    </section>
  );
});
