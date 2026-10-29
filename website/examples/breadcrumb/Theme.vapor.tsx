import { defineVaporComponent, ref } from "vue";
import {
  Breadcrumb,
  ConfigProvider,
  Icon,
  provideAriaIdScope,
  Tag,
  Typography,
} from "semi-ui-vue";
import { IconHome } from "semi-icons-vue";
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `breadcrumb-theme-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const dark = ref(false),
    rtl = ref(false),
    narrow = ref(false),
    mounted = ref(true);
  const long =
    "这是需要截断并通过提示查看完整名称的长路径 LongBreadcrumbName0123456789";
  return (
    <section data-breadcrumb-theme="">
      <h3>主题、RTL、截断与动态宽度</h3>
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
        切换宽度
      </button>
      <button
        onClick={() => {
          mounted.value = !mounted.value;
        }}
        type="button"
      >
        {mounted.value ? "卸载主题示例" : "重挂主题示例"}
      </button>
      {mounted.value ? (
        <div
          class={dark.value ? "semi-always-dark" : "semi-always-light"}
          data-width-container=""
          style={{
            width: narrow.value ? "240px" : "100%",
            maxWidth: "100%",
            padding: "12px",
            boxSizing: "border-box",
            background: "var(--semi-color-bg-0)",
            color: "var(--semi-color-text-0)",
          }}
        >
          <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
            {() => (
              <>
                <Breadcrumb
                  className="breadcrumb-demo-custom"
                  data-themed-breadcrumb=""
                  separator={() => <span aria-hidden="true">›</span>}
                  style={{
                    background: "var(--semi-color-bg-1)",
                    padding: "8px",
                  }}
                >
                  {() => (
                    <>
                      <Breadcrumb.Item
                        children="首页"
                        href="#breadcrumb-theme-home"
                        v-slots={{
                          icon: (scope) => (
                            <Icon
                              className={scope.className}
                              size={scope.size}
                              type="home"
                            >
                              {() => (
                                <IconHome aria-hidden="true" size="inherit" />
                              )}
                            </Icon>
                          ),
                        }}
                      />
                      <Breadcrumb.Item>
                        {() => <Tag size="small">{() => <>组件</>}</Tag>}
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>
                        {() => (
                          <Typography.Text strong>
                            {() => <>使用说明</>}
                          </Typography.Text>
                        )}
                      </Breadcrumb.Item>
                    </>
                  )}
                </Breadcrumb>
                <p>默认末尾截断与提示</p>
                <Breadcrumb
                  data-tooltip-breadcrumb=""
                  routes={["首页", long, "详情"]}
                />
                <p>保留截断，关闭提示</p>
                <Breadcrumb
                  data-no-tooltip-breadcrumb=""
                  routes={["首页", long, "详情"]}
                  showTooltip={false}
                />
                <p>中间截断与自定义位置</p>
                <Breadcrumb
                  data-middle-breadcrumb=""
                  routes={["首页", long, "详情"]}
                  showTooltip={{
                    width: 120,
                    ellipsisPos: "middle",
                    opts: { position: "topLeft" },
                  }}
                />
              </>
            )}
          </ConfigProvider>
        </div>
      ) : null}
      <p>
        窄屏仅按固定 CSS 换行，不按宽度改变折叠数量。局部主题与 ConfigProvider
        不修改 body.dir。图标 slot 显式接收 className 和 size，不克隆图标。
      </p>
    </section>
  );
});
