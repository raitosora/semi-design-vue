import { defineVaporComponent, ref } from "vue";
import {
  Button,
  ButtonGroup,
  ConfigProvider,
  SplitButtonGroup,
} from "semi-ui-vue";
import { IconChevronDown, IconPlus } from "semi-icons-vue";

export default defineVaporComponent(() => {
  const extra = ref(false);
  const rtl = ref(false);
  const disabled = ref(false);
  return (
    <section
      class={rtl.value ? "semi-rtl" : undefined}
      data-button-groups=""
      dir={rtl.value ? "rtl" : "ltr"}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <button onClick={() => (extra.value = !extra.value)} type="button">
          {extra.value ? "移除动态操作" : "添加动态操作"}
        </button>
        <button
          onClick={() => (disabled.value = !disabled.value)}
          type="button"
        >
          {disabled.value ? "启用组合" : "禁用组合"}
        </button>
        <button onClick={() => (rtl.value = !rtl.value)} type="button">
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
      </div>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <div style={{ display: "grid", gap: "16px" }}>
            <ButtonGroup
              aria-label="文件操作"
              disabled={disabled.value}
              size="small"
              type="secondary"
            >
              {() => (
                <>
                  <Button text="复制" />
                  <Button text="移动" />
                  <Button v-if={extra.value} text="动态归档" />
                  <Button text="覆盖危险类型" type="danger" />
                </>
              )}
            </ButtonGroup>
            <ButtonGroup aria-label="嵌套分组示例" theme="outline">
              {() => (
                <>
                  <Button text="外层操作" />
                  <ButtonGroup
                    aria-label="内层分组"
                    size="small"
                    type="tertiary"
                  >
                    {() => <Button text="内层操作" />}
                  </ButtonGroup>
                </>
              )}
            </ButtonGroup>
            <SplitButtonGroup aria-label="项目操作">
              {() => (
                <>
                  <Button text="新建项目" theme="solid" />
                  <Button
                    aria-label="展开项目操作"
                    theme="solid"
                    v-slots={{
                      icon: () => <IconChevronDown aria-hidden="true" />,
                    }}
                  />
                  <Button
                    aria-label="添加项目"
                    theme="solid"
                    v-slots={{ icon: () => <IconPlus aria-hidden="true" /> }}
                  />
                </>
              )}
            </SplitButtonGroup>
          </div>
        )}
      </ConfigProvider>
      <p>
        ButtonGroup 只把 disabled、size、type 补充给直接 Button；group own 的
        theme 和 colorful 覆盖子项。动态增删会更新分隔线。SplitButtonGroup
        只标记实际原生 button 的首尾圆角，不提供 Dropdown。
      </p>
    </section>
  );
});
