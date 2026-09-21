import { defineVaporComponent, ref } from "vue";
import { Icon } from "semi-ui-vue";
import { IconHome, IconLoading } from "semi-icons-vue";

export default defineVaporComponent(() => {
  const spinning = ref(false);
  return (
    <section aria-label="Icon 尺寸颜色与可访问性" data-icon-states="">
      <p>
        <Icon color="#7c3aed" size="extra-small">
          {() => <IconHome aria-hidden="true" size="inherit" />}
        </Icon>
        <Icon color="#0f766e" size="small">
          {() => <IconHome aria-hidden="true" size="inherit" />}
        </Icon>
        <Icon color="#2563eb" size="default">
          {() => <IconHome aria-hidden="true" size="inherit" />}
        </Icon>
        <Icon color="#dc2626" size="large">
          {() => <IconHome aria-hidden="true" size="inherit" />}
        </Icon>
        <Icon color="#ea580c" size="extra-large">
          {() => <IconHome aria-hidden="true" size="inherit" />}
        </Icon>
        <Icon color="#0f172a" size="inherit" style={{ fontSize: "30px" }}>
          {() => <IconHome aria-hidden="true" size="inherit" />}
        </Icon>
      </p>
      <button aria-label="返回首页" data-icon-button="" type="button">
        <Icon aria-hidden="true" rotate={90}>
          {() => <IconHome aria-hidden="true" size="inherit" />}
        </Icon>
        返回首页
      </button>
      <button onClick={() => (spinning.value = !spinning.value)} type="button">
        {spinning.value ? "停止旋转" : "开始旋转"}
      </button>
      <Icon aria-label="正在加载" data-icon-spinner="" spin={spinning.value}>
        {() => <IconLoading aria-hidden="true" size="inherit" />}
      </Icon>
    </section>
  );
});
