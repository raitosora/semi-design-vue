import { defineVaporComponent } from "vue";
import { IconButton } from "semi-ui-vue";
import { IconHome } from "semi-icons-vue";

export default defineVaporComponent(() => (
  <section data-icon-button-basic="">
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <IconButton
        aria-label="返回首页"
        v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
      />
      <IconButton
        size="small"
        text="小号"
        v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
      />
      <IconButton
        text="默认尺寸"
        v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
      />
      <IconButton
        size="large"
        text="大号"
        v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
      />
    </div>
    <p>仅图标按钮需要 aria-label；带文本按钮由文本提供名称，图标保持装饰性。</p>
  </section>
));
