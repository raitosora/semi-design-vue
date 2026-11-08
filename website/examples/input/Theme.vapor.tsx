import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, Input, TextArea, InputGroup } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const dark = ref(false),
    rtl = ref(false),
    narrow = ref(false),
    mounted = ref(true);
  return (
    <section data-input-theme="">
      <h3>深浅主题、RTL 与长内容</h3>
      <button
        onClick={() => {
          dark.value = !dark.value;
        }}
        type="button"
      >
        {dark.value ? "切换浅色" : "切换深色"}
      </button>
      <button
        onClick={() => {
          rtl.value = !rtl.value;
        }}
        type="button"
      >
        切换 RTL
      </button>
      <button
        onClick={() => {
          narrow.value = !narrow.value;
        }}
        type="button"
      >
        切换主题宽度
      </button>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
        type="button"
      >
        {mounted.value ? "卸载输入主题" : "重挂输入主题"}
      </button>
      {mounted.value ? (
        <div
          class={dark.value ? "semi-always-dark" : "semi-always-light"}
          data-input-surface=""
          style={{
            width: narrow.value ? "240px" : "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            padding: "12px",
            background: "var(--semi-color-bg-0)",
            color: "var(--semi-color-text-0)",
          }}
        >
          <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
            {() => (
              <>
                <Input
                  aria-label="主题输入"
                  defaultValue="LongUnbrokenContent0123456789长内容"
                  prefix="名称"
                  showClear
                  suffix="后缀"
                />
                <Input
                  aria-label="主题密码"
                  defaultValue="password"
                  mode="password"
                  size="large"
                />
                <InputGroup
                  label={{
                    text: "分组标签",
                    name: "input-theme-group",
                    required: true,
                  }}
                  labelPosition="left"
                  size="small"
                >
                  {() => (
                    <Input
                      aria-label="主题组成员"
                      defaultValue="组内容"
                      style={{ width: "100%" }}
                    />
                  )}
                </InputGroup>
                <TextArea
                  aria-label="主题多行"
                  autosize={{ minRows: 2, maxRows: 5 }}
                  defaultValue={
                    "长内容在窄容器里按原生 textarea 规则换行。LongUnbrokenContentForWrapping0123456789\n第二行"
                  }
                  showLineNumber
                />
              </>
            )}
          </ConfigProvider>
        </div>
      ) : null}
      <p>
        方向由局部 ConfigProvider
        提供。长文本输入保留原生水平滚动；不会根据宽度自动改变组件尺寸。
      </p>
    </section>
  );
});
