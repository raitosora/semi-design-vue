import { defineVaporComponent, ref } from "vue";
import { Avatar } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const shown = ref(false);
  const mounted = ref(true);
  const long = ref(false);
  const mono = ref(false);
  const width = ref(48);
  return (
    <section data-avatar-measure="">
      <h3>从隐藏状态恢复的文字测量</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          onClick={() => {
            shown.value = !shown.value;
          }}
          type="button"
        >
          {shown.value ? "隐藏文字头像" : "显示文字头像"}
        </button>
        <button
          onClick={() => {
            long.value = !long.value;
          }}
          type="button"
        >
          改变文字
        </button>
        <button
          onClick={() => {
            mono.value = !mono.value;
          }}
          type="button"
        >
          改变字体
        </button>
        <button
          onClick={() => {
            mounted.value = !mounted.value;
          }}
          type="button"
        >
          {mounted.value ? "卸载文字头像" : "重挂文字头像"}
        </button>
      </div>
      <label>
        头像宽度
        <input
          aria-label="文字头像宽度"
          max="120"
          min="32"
          onInput={(event) => {
            width.value = Number((event.target as HTMLInputElement).value);
          }}
          type="range"
          value={width.value}
        />
      </label>
      <div
        style={{
          display: shown.value ? "block" : "none",
          paddingBlock: "16px",
        }}
      >
        {mounted.value ? (
          <Avatar
            children={long.value ? "LONGER NAME" : "Semi Design"}
            color="violet"
            data-avatar-scaled=""
            size={`${width.value}px`}
            style={{ fontFamily: mono.value ? "monospace" : "sans-serif" }}
          />
        ) : null}
      </div>
      <p>
        children 的字符串参与缩放；rich default slot
        由调用者控制布局，不复制内容进行测量。
      </p>
    </section>
  );
});
