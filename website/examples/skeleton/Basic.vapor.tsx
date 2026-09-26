import { defineVaporComponent } from "vue";
import { Skeleton } from "semi-ui-vue";

export default defineVaporComponent(() => (
  <section data-skeleton-basic="">
    <h3>五种占位子组件</h3>
    <div
      data-skeleton-parts=""
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <Skeleton.Avatar data-skeleton-avatar="" />
      <Skeleton.Avatar data-skeleton-square="" shape="square" size="large" />
      <Skeleton.Title data-skeleton-title="" style={{ width: "120px" }} />
      <Skeleton.Button data-skeleton-button="" />
      <Skeleton.Image
        data-skeleton-image=""
        style={{ width: "100px", height: "72px" }}
      />
    </div>
    <Skeleton.Paragraph
      data-skeleton-paragraph=""
      rows={3}
      style={{ maxWidth: "300px", marginTop: "16px" }}
    />
    <h3>加载时显示自定义组合</h3>
    <Skeleton
      active
      aria-label="资料加载占位"
      data-skeleton-loading=""
      role="status"
      style={{ maxWidth: "360px" }}
      v-slots={{
        placeholder: () => (
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
          >
            <Skeleton.Avatar />
            <div style={{ flex: "1", minWidth: 0 }}>
              <Skeleton.Title style={{ width: "55%", marginBottom: "12px" }} />
              <Skeleton.Paragraph rows={2} />
            </div>
          </div>
        ),
        default: () => <p>资料已加载</p>,
      }}
    />
  </section>
));
