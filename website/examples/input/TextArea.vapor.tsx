import { defineVaporComponent, ref } from "vue";
import { TextArea } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const value = ref("第一行\n第二行"),
    narrow = ref(false),
    hidden = ref(false),
    mounted = ref(true),
    events = ref<string[]>([]),
    height = ref(0),
    nativeWidth = ref(0);
  const record = (message: string) => {
    events.value = [...events.value, message];
  };
  return (
    <section data-input-textarea="">
      <h3>自动高度、行号、滚动与原生缩放</h3>
      <button
        onClick={() => {
          value.value = "新增行\n".repeat(8) + "末行";
        }}
        type="button"
      >
        增加多行内容
      </button>
      <button
        onClick={() => {
          narrow.value = !narrow.value;
        }}
        type="button"
      >
        切换文本宽度
      </button>
      <button
        onClick={() => {
          hidden.value = !hidden.value;
        }}
        type="button"
      >
        {hidden.value ? "显示文本区域" : "隐藏文本区域"}
      </button>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
        type="button"
      >
        {mounted.value ? "卸载文本区域" : "重挂文本区域"}
      </button>
      {mounted.value ? (
        <div
          data-autosize-container=""
          style={{
            width: narrow.value ? "200px" : "100%",
            display: hidden.value ? "none" : "block",
          }}
        >
          <TextArea
            aria-label="自动高度"
            autosize={{ minRows: 2, maxRows: 4 }}
            lineNumberStart={5}
            onResize={(size) => {
              height.value = size.height;
            }}
            onUpdate:value={(next) => {
              value.value = next;
            }}
            showLineNumber
            value={value.value}
          />
        </div>
      ) : null}
      <output data-textarea-height="">{height.value}</output>
      <TextArea
        aria-label="可缩放文本"
        defaultValue="可以拖动右下角调整尺寸"
        onResize={(size) => {
          nativeWidth.value = size.width ?? 0;
        }}
        resize="both"
        rows={2}
        textareaStyle={{ width: "240px" }}
      />
      <output data-textarea-width="">{nativeWidth.value}</output>
      <TextArea
        aria-label="统计而不截断"
        defaultValue="超过统计阈值仍然保留"
        maxCount={3}
      />
      <TextArea
        aria-label="清空多行文本"
        defaultValue="可清空内容"
        onBlur={(event) => record(`blur:${event.type}`)}
        onChange={(next) => record(`change:${next}`)}
        onClear={(event) => record(`clear:${event.type}`)}
        showClear
      />
      <button
        onClick={() => {
          events.value = [];
        }}
        type="button"
      >
        清空多行事件
      </button>
      <output data-textarea-events="">{events.value.join(",")}</output>
      <TextArea
        aria-label="Shift Enter 换行"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) event.preventDefault();
        }}
        rows={2}
      />
      <p>
        maxCount 只显示统计和超出状态，不截断输入。autosize 优先于
        resize；行号使用字体测量估计软换行高度，滚动与文本区域同步。
      </p>
    </section>
  );
});
