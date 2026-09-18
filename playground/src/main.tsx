import { createVaporApp, defineVaporComponent, ref } from "vue";
import { version as uiVersion } from "semi-ui-vue";
import { version as iconsVersion } from "semi-icons-vue";
import { version as iconsLabVersion } from "semi-icons-lab-vue";
import { version as illustrationsVersion } from "semi-illustrations-vue";
import { version as animationVersion } from "semi-animation-vue";

const app = createVaporApp(
  defineVaporComponent(() => {
    const count = ref(0);
    return (
      <main>
        <h1>Semi Design Vue</h1>
        <p>开发环境 · Vapor 模式</p>
        <p id="versions">
          UI {uiVersion} · Icons {iconsVersion} · Icons Lab {iconsLabVersion} ·
          Illustrations {illustrationsVersion} · Animation {animationVersion} ·
          主题插件在 Vite 构建端运行
        </p>
        <button
          onClick={() => {
            count.value += 1;
          }}
        >
          计数：{count.value}
        </button>
      </main>
    );
  }),
);

app.mount("#app");
if (import.meta.hot) import.meta.hot.dispose(() => app.unmount());
