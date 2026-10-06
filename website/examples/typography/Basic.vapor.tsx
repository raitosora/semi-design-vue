import { defineVaporComponent } from "vue";
import { Typography } from "semi-ui-vue";
const types = [
  "primary",
  "secondary",
  "tertiary",
  "quaternary",
  "warning",
  "danger",
  "success",
] as const;
export default defineVaporComponent(() => (
  <section data-typography-basic="">
    <Typography data-article="">
      {() => (
        <>
          <Typography.Title heading={2}>
            {() => <>排版与内容</>}
          </Typography.Title>
          <Typography.Title
            component="div"
            data-custom-heading=""
            heading={3}
            weight="medium"
          >
            {() => <>自定义标题标签</>}
          </Typography.Title>
          <Typography.Paragraph data-paragraph="" spacing="extended">
            {() => <>段落保留原生语义，宽松行距便于阅读。</>}
          </Typography.Paragraph>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {types.map((type) => (
              <Typography.Text key={type} type={type}>
                {() => <>{type}</>}
              </Typography.Text>
            ))}
          </div>
          <Typography.Text code data-decorated="" delete mark strong underline>
            {() => <>语义装饰</>}
          </Typography.Text>
          <Typography.Text children="<b>转义文本</b>" data-escaped="" />
          <Typography.Text
            data-link=""
            link={{ href: "#typography-target" }}
            underline
          >
            {() => <>阅读排版说明</>}
          </Typography.Text>
          <Typography.Text
            data-disabled=""
            disabled
            link={{ href: "#typography-target" }}
          >
            {() => <>禁用链接外观</>}
          </Typography.Text>
          <Typography.Paragraph data-link-target="">
            {() => <>链接目标</>}
          </Typography.Paragraph>
        </>
      )}
    </Typography>
  </section>
));
