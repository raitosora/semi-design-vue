import { defineVaporComponent, ref } from "vue";
import { Icon } from "semi-ui-vue";
import type { IconSvgScope } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const warm = ref(true);
  const slots = {
    svg: (scope: IconSvgScope) => {
      const gradientId = `${scope.id}-gradient`;
      return (
        <svg
          fill="none"
          height={scope.size}
          viewBox="0 0 24 24"
          width={scope.size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradientId} x1="3" x2="21" y1="3" y2="21">
              <stop stop-color={scope.fill?.[0] ?? "#f97316"} />
              <stop offset="1" stop-color={scope.fill?.[1] ?? "#facc15"} />
            </linearGradient>
          </defs>
          <path
            d="M12 2 15.1 8.9 22 12l-6.9 3.1L12 22l-3.1-6.9L2 12l6.9-3.1L12 2Z"
            fill={`url(#${gradientId})`}
          />
        </svg>
      );
    },
  };
  return (
    <section aria-label="自定义 SVG 图标" data-icon-custom="">
      <Icon
        aria-label="带渐变的自定义图标"
        color={warm.value ? "#f97316" : "#2563eb"}
        data-icon-gradient=""
        fill={warm.value ? ["#f97316", "#facc15"] : ["#2563eb", "#60a5fa"]}
        size="extra-large"
        v-slots={slots}
      />
      <button onClick={() => (warm.value = !warm.value)} type="button">
        切换渐变颜色
      </button>
    </section>
  );
});
