import { defineVaporComponent } from "vue";
import { Layout } from "semi-ui-vue";

const panel = {
  background: "var(--semi-color-fill-0)",
  border: "1px solid var(--semi-color-border)",
  padding: "12px",
};

export default defineVaporComponent(() => (
  <section data-layout-basic="">
    <h3>页头、内容和页脚</h3>
    <Layout data-layout-vertical="" style={{ minHeight: "180px" }}>
      {() => (
        <>
          <Layout.Header data-layout-header="" style={panel}>
            {() => <span>页头</span>}
          </Layout.Header>
          <Layout.Content data-layout-content="" style={panel}>
            {() => <span>主要内容</span>}
          </Layout.Content>
          <Layout.Footer data-layout-footer="" style={panel}>
            {() => <span>页脚</span>}
          </Layout.Footer>
        </>
      )}
    </Layout>
    <h3>侧栏与嵌套布局</h3>
    <Layout data-layout-horizontal="" style={{ minHeight: "220px" }}>
      {() => (
        <>
          <Layout.Sider
            aria-label="示例导航"
            data-layout-left-sider=""
            style={{ ...panel, width: "120px" }}
          >
            {() => <nav aria-label="页面导航">导航区域</nav>}
          </Layout.Sider>
          <Layout data-layout-nested="">
            {() => (
              <>
                <Layout.Header style={panel}>
                  {() => <span>内层页头</span>}
                </Layout.Header>
                <Layout.Content style={panel}>
                  {() => <span>内层内容</span>}
                </Layout.Content>
                <Layout.Footer style={panel}>
                  {() => <span>内层页脚</span>}
                </Layout.Footer>
              </>
            )}
          </Layout>
        </>
      )}
    </Layout>
  </section>
));
