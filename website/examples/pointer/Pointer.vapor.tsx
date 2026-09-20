import { defineVaporComponent, onMounted, ref, shallowRef } from "vue";
import {
  clampDragOffset,
  createPointerSession,
  resizeRect,
  type PointerBounds,
  type PointerPoint,
  type PointerRect,
} from "semi-ui-vue";
import "./pointer.css";

const Surface = defineVaporComponent(() => {
  const area = shallowRef<HTMLElement | null>(null);
  const handle = shallowRef<HTMLElement | null>(null);
  const resizeHandle = shallowRef<HTMLElement | null>(null);
  const position = ref<PointerPoint>({ x: 0, y: 0 });
  const size = ref<PointerRect>({ x: 0, y: 0, width: 120, height: 72 });
  const reason = ref("idle");
  const captureId = ref(-1);
  let origin = position.value;
  let bounds: PointerBounds = { left: 0, top: 0, right: 0, bottom: 0 };
  let initial = size.value;
  let start: PointerPoint = { x: 0, y: 0 };
  const drag = createPointerSession({
    element: () => handle.value,
    onStart(event) {
      origin = position.value;
      bounds = {
        left: 0,
        top: 0,
        right: Math.max(0, (area.value?.clientWidth ?? 100) - 100),
        bottom: Math.max(0, (area.value?.clientHeight ?? 48) - 48),
      };
      captureId.value = event.pointerId;
      reason.value = "dragging";
    },
    onMove(event) {
      position.value = clampDragOffset(origin, event.delta, bounds);
    },
    onEnd(event, endReason) {
      if (endReason === "end")
        position.value = clampDragOffset(origin, event.delta, bounds);
      reason.value = endReason;
      captureId.value = -1;
    },
  });
  const resize = createPointerSession({
    element: () => resizeHandle.value,
    onStart(event) {
      initial = size.value;
      start = event.point;
      reason.value = "resizing";
      captureId.value = event.pointerId;
    },
    onMove(event) {
      size.value = resizeRect(
        initial,
        start,
        event.point,
        ["right", "bottom"],
        {
          minWidth: 80,
          minHeight: 48,
          maxWidth: 240,
          maxHeight: 140,
        },
      );
    },
    onEnd(_event, endReason) {
      reason.value = endReason;
      captureId.value = -1;
    },
  });
  onMounted(() => {
    drag.refresh();
    resize.refresh();
  });
  return (
    <section aria-label="指针操作区域" class="semi-pointer-surface">
      <div class="semi-pointer-area" ref={area}>
        <button
          class="semi-pointer-drag"
          data-capture-id={captureId.value}
          data-drag-handle=""
          ref={handle}
          style={{
            transform: `translate(${position.value.x}px, ${position.value.y}px)`,
          }}
        >
          拖动我
        </button>
      </div>
      <output aria-label="指针位置">
        {Math.round(position.value.x)}, {Math.round(position.value.y)} ·{" "}
        {reason.value}
      </output>
      <button
        onClick={() => {
          position.value = { x: 0, y: 0 };
        }}
      >
        重置位置
      </button>
      <div
        class="semi-pointer-resize"
        data-resize-box=""
        style={{
          width: `${size.value.width}px`,
          height: `${size.value.height}px`,
        }}
      >
        <span>
          {Math.round(size.value.width)} × {Math.round(size.value.height)}
        </span>
        <button
          aria-label="拖动调整尺寸"
          class="semi-pointer-resize-handle"
          data-resize-handle=""
          ref={resizeHandle}
        >
          ↘
        </button>
      </div>
      <button
        onClick={() => {
          size.value = {
            ...size.value,
            width: size.value.width === 120 ? 200 : 120,
          };
        }}
      >
        切换宽度
      </button>
    </section>
  );
});

export default defineVaporComponent(() => (
  <section aria-label="拖动与尺寸示例">
    <p>
      拖动按钮限制在框内。右下角手柄可调整尺寸；“切换宽度”也支持键盘操作。两个区域互不影响。
    </p>
    <Surface />
    <Surface />
  </section>
));
