import { defineVaporComponent, ref } from "vue";
import { Input, TextArea } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const input = ref(""),
    textarea = ref(""),
    events = ref<string[]>([]);
  const record = (message: string) => {
    events.value = [...events.value, message];
  };
  return (
    <section data-input-composition="">
      <h3>输入法组合与事件</h3>
      <Input
        aria-label="组合输入"
        composition
        onChange={(value) => record(`input-change:${value}`)}
        onCompositionEnd={() => record("input-end")}
        onCompositionStart={() => record("input-start")}
        onCompositionUpdate={() => record("input-update")}
        onUpdate:value={(value) => {
          input.value = value;
        }}
        value={input.value}
      />
      <TextArea
        aria-label="组合多行输入"
        composition
        onChange={(value) => record(`textarea-change:${value}`)}
        onCompositionEnd={() => record("textarea-end")}
        onCompositionStart={() => record("textarea-start")}
        onCompositionUpdate={() => record("textarea-update")}
        onUpdate:value={(value) => {
          textarea.value = value;
        }}
        value={textarea.value}
      />
      <button
        onClick={() => {
          events.value = [];
        }}
        type="button"
      >
        清空组合事件
      </button>
      <output data-composition-events="">{events.value.join(",")}</output>
      <p>
        composition 开启后，组合中的文字仍显示，结束时先通知
        compositionEnd，再通知
        change。示例记录实际原生事件；自动化覆盖事件派发和 Chromium IME
        协议，不等于真实操作系统输入法验收。
      </p>
    </section>
  );
});
