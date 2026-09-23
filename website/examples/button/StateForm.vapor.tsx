import { defineVaporComponent, ref } from "vue";
import { Button } from "semi-ui-vue";
import { IconHome, IconSave } from "semi-icons-vue";

export default defineVaporComponent(() => {
  const loading = ref(false);
  const disabled = ref(false);
  const clicks = ref(0);
  const submits = ref(0);
  const resets = ref(0);
  return (
    <section data-button-state-form="">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <button onClick={() => (loading.value = !loading.value)} type="button">
          {loading.value ? "停止加载" : "开始加载"}
        </button>
        <button
          onClick={() => (disabled.value = !disabled.value)}
          type="button"
        >
          {disabled.value ? "启用保存" : "禁用保存"}
        </button>
      </div>
      <form
        onReset={() => resets.value++}
        onSubmit={(event) => {
          event.preventDefault();
          submits.value++;
        }}
        style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
      >
        <label>
          标题 <input aria-label="标题" value="初始标题" />
        </label>
        <Button
          aria-label="返回首页"
          circle={true}
          v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
        />
        <Button
          aria-label="保存"
          disabled={disabled.value}
          loading={loading.value}
          onClick={() => clicks.value++}
          text="保存"
          v-slots={{ icon: () => <IconSave aria-hidden="true" /> }}
        />
        <Button htmlType="submit" text="提交" />
        <Button htmlType="reset" text="重置" />
      </form>
      <output aria-live="polite" data-button-state-result="">
        点击 {clicks.value} / 提交 {submits.value} / 重置 {resets.value}
      </output>
      <p>
        loading 保留键盘与程序 click 的原生语义，只由样式阻止指针；disabled
        才会禁用原生 button，并且优先显示原图标。
      </p>
    </section>
  );
});
