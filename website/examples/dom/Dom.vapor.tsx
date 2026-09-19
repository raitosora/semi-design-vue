import { defineVaporComponent, ref } from "vue";
import {
  createAriaIdScope,
  createDomRef,
  createDomScheduler,
  createRovingTabindex,
  getScrollParents,
  observeMediaQuery,
  observeOutsidePointer,
  observeResize,
} from "semi-ui-vue";

export default defineVaporComponent(() => {
  // This example is mounted only on the client. An application can instead pass
  // its own stable, document-unique prefix when creating its ID scope.
  const ids = createAriaIdScope(`dom-${crypto.randomUUID()}`);
  const inputId = ids.next("name");
  const hintId = ids.next("hint");
  const panel = createDomRef<HTMLDivElement>();
  const group = createDomRef<HTMLDivElement>();
  const first = createDomRef<HTMLButtonElement>();
  const disabled = createDomRef<HTMLButtonElement>();
  const last = createDomRef<HTMLButtonElement>();
  const width = ref(180);
  const size = ref("等待测量");
  const outside = ref(0);
  const enabled = ref(true);
  const rtl = ref(false);
  const motion = ref(false);
  const scrollParents = ref(0);
  const scheduled = ref(0);
  const view = () =>
    panel.element.value?.ownerDocument.defaultView ?? undefined;
  const scheduler = createDomScheduler(view);
  const delayed = scheduler.debounce(() => {
    scheduled.value += 1;
  }, 100);
  const items = () =>
    [first.element.value, disabled.element.value, last.element.value].filter(
      (node): node is HTMLButtonElement => node !== null,
    );
  const roving = createRovingTabindex(items, {
    direction: () => (rtl.value ? "rtl" : "ltr"),
    orientation: () => "horizontal",
  });
  observeResize(
    () => (panel.element.value ? [panel.element.value] : []),
    (entries) => {
      const box = entries[0]?.contentRect;
      if (box)
        size.value = `${Math.round(box.width)} × ${Math.round(box.height)}`;
    },
  );
  observeOutsidePointer(
    () =>
      [panel.element.value, group.element.value].filter(
        (node): node is HTMLDivElement => node !== null,
      ),
    () => {
      outside.value += 1;
    },
    () => enabled.value,
  );
  observeMediaQuery(
    () => "(prefers-reduced-motion: reduce)",
    (matches) => {
      motion.value = matches;
    },
    view,
  );
  return (
    <section data-dom-demo="">
      <p>用方向键、Home / End 移动工具栏焦点；Tab 保持浏览器默认行为。</p>
      <div
        aria-label="示例工具栏"
        dir={rtl.value ? "rtl" : "ltr"}
        onKeydown={(event: unknown) => {
          if (event instanceof KeyboardEvent) roving.onKeydown(event);
        }}
        ref={group.set}
        role="toolbar"
      >
        <button ref={first.set}>第一项</button>
        <button disabled ref={disabled.set}>
          禁用项
        </button>
        <button ref={last.set}>最后一项</button>
      </div>
      <div style={{ width: "160px", maxWidth: "100%", overflow: "auto" }}>
        <div
          ref={panel.set}
          style={{
            width: `${width.value}px`,
            height: "48px",
            background: "var(--vp-c-bg-soft)",
            outline: "1px solid var(--vp-c-divider)",
          }}
        >
          可测量区域
        </div>
      </div>
      <p>
        内容尺寸：<output data-dom-size="">{size.value}</output>
      </p>
      <label for={inputId}>示例名称</label>
      <input
        aria-describedby={hintId}
        id={inputId}
        style={{
          border: "1px solid var(--vp-c-divider)",
          padding: "4px 8px",
          display: "block",
          maxWidth: "100%",
        }}
      />
      <p id={hintId}>标签和说明关联当前示例的输入框。</p>
      <p>
        区域外指针：<output data-dom-outside="">{outside.value}</output>
        ；减少动态效果：
        <output data-dom-motion="">{motion.value ? "是" : "否"}</output>
      </p>
      <button
        onClick={() => {
          width.value += 40;
        }}
      >
        增加宽度
      </button>
      <button
        onClick={() => {
          rtl.value = !rtl.value;
        }}
      >
        切换 RTL
      </button>
      <button
        onClick={() => {
          enabled.value = !enabled.value;
        }}
      >
        {enabled.value ? "暂停点外监听" : "恢复点外监听"}
      </button>
      <button
        onClick={() => {
          scheduler.frame(() => {
            scrollParents.value = getScrollParents(panel.element.value).length;
          });
        }}
      >
        下一帧读取滚动容器
      </button>
      <button onClick={() => delayed.schedule()}>防抖计数</button>
      <p>
        滚动容器：<output data-dom-scroll="">{scrollParents.value}</output>
        ；防抖完成：<output data-dom-scheduled="">{scheduled.value}</output>
      </p>
    </section>
  );
});
