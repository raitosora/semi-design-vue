import { defineVaporComponent } from "vue";
import { Icon } from "semi-ui-vue";
import { convertIcon, IconHome } from "semi-icons-vue";

const FactoryIcon = convertIcon(
  ({ size, id }) => (
    <svg
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2 15 9h7l-5.6 4 2.1 7L12 15.8 5.5 20l2.2-7L2 9h7l3-7Z"
        fill={`url(#${id}-fill)`}
      />
      <defs>
        <linearGradient id={`${id}-fill`} x1="2" x2="22" y1="2" y2="20">
          <stop stop-color="#7c3aed" />
          <stop offset="1" stop-color="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  ),
  "factory",
);

export default defineVaporComponent(() => (
  <section aria-label="Icon 基础示例" data-icon-basic="">
    <p>
      <Icon aria-label="首页" data-icon-labelled="" size="large">
        {() => <IconHome aria-hidden="true" size="inherit" />}
      </Icon>
      <span> 有名称的图标</span>
    </p>
    <p>
      <Icon data-icon-decorative="" size="default">
        {() => <IconHome aria-hidden="true" size="inherit" />}
      </Icon>
      <span> 默认是装饰图标</span>
    </p>
    <p>
      <FactoryIcon aria-label="工厂创建的星形图标" data-icon-factory="" />
      <span> 由 convertIcon 创建</span>
    </p>
  </section>
));
