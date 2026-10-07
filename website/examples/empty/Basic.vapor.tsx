import { defineVaporComponent, ref } from "vue";
import { Button, Empty } from "semi-ui-vue";
import { IllustrationNoResult } from "semi-illustrations-vue";
export default defineVaporComponent(() => {
  const retries = ref(0);
  return (
    <section data-empty-basic="" style={{ display: "grid", gap: "24px" }}>
      <h3>默认、文本、插画和操作</h3>
      <Empty data-bare="" />
      <Empty
        data-text-only=""
        description="<b>文本会转义</b>"
        title="暂无内容"
      />
      <Empty
        data-illustrated=""
        description="请尝试调整关键词。"
        image={() => <IllustrationNoResult aria-hidden="true" size={120} />}
        title="没有搜索结果"
      >
        {() => (
          <Button
            onClick={() => {
              retries.value++;
            }}
          >
            {() => <>重新搜索</>}
          </Button>
        )}
      </Empty>
      <p>
        重新搜索次数：<output data-retries="">{retries.value}</output>
      </p>
      <Empty
        data-url=""
        description="图片内容说明"
        image="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='20' fill='%236a5acd'/%3E%3C/svg%3E"
      />
      <svg
        aria-hidden="true"
        height="0"
        style={{ position: "absolute" }}
        width="0"
      >
        <defs>
          <symbol id="empty-demo-symbol">
            <circle cx="24" cy="24" fill="currentColor" r="20" />
          </symbol>
        </defs>
      </svg>
      <Empty
        data-symbol=""
        description="SVG symbol 引用"
        image={{ id: "empty-demo-symbol" }}
        imageStyle={{ width: "48px", height: "48px" }}
      />
    </section>
  );
});
