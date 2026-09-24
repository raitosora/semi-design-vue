import { defineVaporComponent, ref } from "vue";
import { ConfigProvider, Space } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const rtl = ref(false);
  const narrow = ref(false);
  return (
    <section data-space-responsive="">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={() => (rtl.value = !rtl.value)} type="button">
          {rtl.value ? "切换 LTR" : "切换 RTL"}
        </button>
        <button onClick={() => (narrow.value = !narrow.value)} type="button">
          {narrow.value ? "恢复宽容器" : "切换窄容器"}
        </button>
      </div>
      <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
        {() => (
          <nav aria-label="操作区域">
            <div style={{ width: narrow.value ? "180px" : "100%" }}>
              <Space data-wrap-space="" spacing={[8, 12]} wrap={true}>
                {() => (
                  <>
                    <button type="button">创建项目</button>
                    <button type="button">查看详情</button>
                    <button type="button">导出</button>
                  </>
                )}
              </Space>
            </div>
            <Space
              data-vertical-no-wrap=""
              spacing="tight"
              vertical={true}
              wrap={true}
            >
              {() => (
                <>
                  <span>垂直项一</span>
                  <span>垂直项二</span>
                </>
              )}
            </Space>
          </nav>
        )}
      </ConfigProvider>
      <p>换行只作用于水平布局；导航语义由外层原生元素提供。</p>
    </section>
  );
});
