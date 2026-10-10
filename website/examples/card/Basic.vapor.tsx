import { defineVaporComponent, ref } from "vue";
import {
  Avatar,
  Button,
  Card,
  Typography,
  provideAriaIdScope,
} from "semi-ui-vue";
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `card-basic-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const actions = ref(0),
    bubbles = ref(0);
  return (
    <section data-card-basic="" style={{ display: "grid", gap: "16px" }}>
      <h3>标题、封面、正文和操作</h3>
      <Card data-bare="" />
      <div
        onClick={() => {
          bubbles.value++;
        }}
      >
        <Card
          actions={[
            () => (
              <Button
                onClick={() => {
                  actions.value++;
                }}
              >
                {() => <>查看项目</>}
              </Button>
            ),
            "<b>操作文本</b>",
          ]}
          aria-label="项目卡片"
          bodyStyle={{ padding: "20px" }}
          cover={() => (
            <div
              aria-label="示例封面"
              style={{
                height: "72px",
                background: "var(--semi-color-primary-light-default)",
              }}
            />
          )}
          data-basic-card=""
          footer="页尾说明"
          footerLine
          headerExtraContent={() => <span>进行中</span>}
          title="项目概览"
        >
          {() => (
            <Card.Meta
              avatar={() => <Avatar children="设" color="blue" />}
              description="<b>内容按文本转义</b>"
              title={() => (
                <Typography.Text strong>{() => <>设计系统</>}</Typography.Text>
              )}
            />
          )}
        </Card>
      </div>
      <p>
        操作 <output data-actions="">{actions.value}</output> / 冒泡{" "}
        <output data-bubbles="">{bubbles.value}</output>
      </p>
      <Card
        children="自定义头部优先于 title 和 headerExtraContent。"
        data-custom-header=""
        header={() => <h4>自定义标题语义</h4>}
        headerExtraContent="不会显示的附加内容"
        title="不会显示的默认标题"
      />
      <Card
        bordered={false}
        children="边框、页尾边线与阴影独立配置。"
        data-shadow-card=""
        headerLine={false}
        shadows="hover"
        title="悬停阴影"
      />
    </section>
  );
});
