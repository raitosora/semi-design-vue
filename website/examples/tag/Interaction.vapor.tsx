import { defineVaporComponent, ref } from "vue";
import { Tag } from "semi-ui-vue";
export default defineVaporComponent(() => {
  const visible = ref(true);
  const events = ref<readonly string[]>([]);
  const clicks = ref(0);
  const record = (name: string, event: MouseEvent | KeyboardEvent) => {
    events.value = [
      ...events.value,
      `${name}:${event.type === "keydown" ? "key" : "mouse"}`,
    ];
  };
  return (
    <section data-tag-interaction="">
      <h3>关闭通知、阻止隐藏与受控状态</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBlock: "16px",
        }}
      >
        <Tag
          children="普通"
          closable
          data-tag-uncontrolled=""
          onClick={() => {
            clicks.value++;
          }}
          onClose={(_children, event) => record("普通", event)}
          tagKey="normal"
        />
        <Tag
          children="保留"
          closable
          color="orange"
          data-tag-prevented=""
          onClose={(_children, event) => {
            record("保留", event);
            event.preventDefault();
          }}
          tagKey="prevented"
        />
        <Tag
          aria-label="受控标签"
          children="受控"
          closable
          color="blue"
          data-tag-controlled=""
          onClick={() => {
            clicks.value++;
          }}
          onClose={(_children, event) => {
            record("受控", event);
            visible.value = false;
          }}
          tagKey="controlled"
          visible={visible.value}
        />
      </div>
      <button
        onClick={() => {
          visible.value = true;
        }}
        type="button"
      >
        恢复受控标签
      </button>
      <p>
        关闭顺序：
        <output data-tag-close-events="">{events.value.join("|")}</output>
      </p>
      <p>
        标签激活次数：<output data-tag-root-clicks="">{clicks.value}</output>
      </p>
      <p>
        交互标签支持 Enter 激活、Delete / Backspace 关闭、Escape
        失焦。关闭按钮不会冒泡为标签点击；preventDefault
        保留标签。隐藏保留原生内容，删除列表数据才会卸载。
      </p>
    </section>
  );
});
