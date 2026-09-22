import { defineVaporComponent } from "vue";
import { IconButton } from "semi-ui-vue";
import { IconHome } from "semi-icons-vue";

export default defineVaporComponent(() => (
  <section data-icon-button-position="">
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
      <IconButton
        data-position-left=""
        iconPosition="left"
        text="图标在左"
        v-slots={{
          icon: () => <IconHome aria-hidden="true" data-position-icon="" />,
        }}
      />
      <IconButton
        data-position-right=""
        iconPosition="right"
        text="图标在右"
        v-slots={{
          icon: () => <IconHome aria-hidden="true" data-position-icon="" />,
        }}
      />
      <IconButton
        text="被默认 slot 替代"
        v-slots={{
          icon: () => <span aria-hidden="true">★</span>,
          default: () => <strong>自定义内容</strong>,
        }}
      />
      <IconButton
        aria-label="空文本仍保留文本容器"
        data-empty-text=""
        text=""
        v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
      />
      <IconButton
        aria-label="null 文本为仅图标模式"
        data-null-text=""
        text={null}
        v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
      />
    </div>
    <p>
      default slot 存在时优先于 text，空 slot 也保留文本容器。text 为 0
      或空字符串仍保留容器，null / undefined 不保留。
    </p>
  </section>
));
