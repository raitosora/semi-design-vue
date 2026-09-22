import { defineVaporComponent, ref } from "vue";
import { IconButton } from "semi-ui-vue";
import { IconHome } from "semi-icons-vue";

export default defineVaporComponent(() => {
  const loading = ref(false);
  const disabled = ref(false);
  const mounted = ref(true);
  const updated = ref(false);
  const clicks = ref(0);
  const pointerDowns = ref(0);
  const submits = ref(0);
  const resets = ref(0);
  const eventTarget = ref("尚未点击");
  return (
    <section data-icon-button-dynamic="">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <button onClick={() => (loading.value = !loading.value)} type="button">
          {loading.value ? "停止加载" : "开始加载"}
        </button>
        <button
          onClick={() => (disabled.value = !disabled.value)}
          type="button"
        >
          {disabled.value ? "启用操作" : "禁用操作"}
        </button>
        <button onClick={() => (updated.value = !updated.value)} type="button">
          更新内容
        </button>
        <button onClick={() => (mounted.value = !mounted.value)} type="button">
          {mounted.value ? "卸载操作按钮" : "挂载操作按钮"}
        </button>
      </div>
      <form
        onReset={() => resets.value++}
        onSubmit={(event) => {
          event.preventDefault();
          submits.value++;
        }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <label>
          表单内容{" "}
          <input aria-label="表单内容" name="content" value="初始内容" />
        </label>
        <IconButton
          v-if={mounted.value}
          aria-busy={loading.value}
          aria-label="执行操作"
          disabled={disabled.value}
          loading={loading.value}
          onClick={(event) => {
            clicks.value++;
            eventTarget.value = `${(event.currentTarget as HTMLButtonElement).tagName.toLowerCase()} / ${event.type}`;
          }}
          onMousedown={() => pointerDowns.value++}
          v-slots={{
            icon: () => <IconHome aria-hidden="true" data-action-icon="" />,
            default: () => (
              <span>{updated.value ? "更新后的内容" : "执行操作"}</span>
            ),
          }}
        />
        <IconButton
          htmlType="submit"
          text="提交表单"
          v-slots={{ icon: () => <span aria-hidden="true">✓</span> }}
        />
        <IconButton
          htmlType="reset"
          text="重置表单"
          v-slots={{ icon: () => <span aria-hidden="true">↶</span> }}
        />
      </form>
      <div aria-live="polite">
        <output data-click-count="">点击 {clicks.value}</output>
        {" / "}
        <output data-pointer-count="">按下 {pointerDowns.value}</output>
        {" / "}
        <output data-submit-count="">提交 {submits.value}</output>
        {" / "}
        <output data-reset-count="">重置 {resets.value}</output>
      </div>
      <p data-event-target="">{eventTarget.value}</p>
      <p>
        loading 只阻止指针交互，仍可用 Enter / Space 或 DOM click()
        激活；需要禁止所有操作时同时设置 disabled。disabled 优先显示原图标。
      </p>
    </section>
  );
});
