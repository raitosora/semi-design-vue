# 安装与样式

Semi Design Vue 尚未发布可安装版本，当前包均为 private。未来发布统一使用 `@raitosora` scope；以下无 scope 名称对应当前本地构建包。组件运行路径固定为 Vue 3.6.0-rc.8 / vue-jsx 3.3.0-rc.1，Vapor 是编译模式。

## 本地构建与消费

```sh
pnpm install --frozen-lockfile
pnpm build:packages
```

UI 包的 JavaScript 根入口不会自动加载样式。普通 CSS 使用方不需要 Sass 或主题插件。当前提供基础 tokens 和 Input / Tooltip 样式入口，后两者供原生 HTML 验证夹具使用，不代表公共组件已实现。

```ts
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/input.css";
```

按需路径只加载基础和输入样式，不包含 Tooltip 样式。需要本阶段全部样式时使用：

```ts
import "semi-ui-vue/styles/index.css";
```

不要混用完整入口和相同的分项入口，以免重复 CSS。也不要同时加载默认 CSS 与定制后的 SCSS。

## SCSS 与编译配置

样式来源固定为 Foundation / Theme `2.103.0`。构建只提取登记的 SCSS 闭包，随包提供必要源码、许可证及来源摘要；消费者无需安装官方 Foundation，也不需要 patch、override 或源码 alias。

SCSS 与 CSS 入口一一对应：`styles/base.scss`、`styles/components/input.scss`、`styles/components/tooltip.scss`、`styles/index.scss`。SCSS 消费需要 Sass；当前验证版本为 `1.97.3`。源码继承上游 Sass `@import` 写法，升级到移除该语法的 Sass 版本需单独适配，不能直接认定兼容。

CSS variables 使用上游 `--semi-*` 名称。例如：

```css
.my-surface {
  background: var(--semi-color-bg-0);
  color: var(--semi-color-text-0);
  border: 1px solid var(--semi-color-border);
}
```

深色、RTL、前缀与主题覆盖方式见[定制主题](./theme.md)。[主题许可](/licenses/semi-theme-default-2.103.0-MIT.txt)与[Foundation 许可](/licenses/semi-foundation-2.103.0-MIT.txt)随产物保留。

## 验证范围

独立临时消费者使用复制后的 manifest + dist，不读取库源码或仓库 patch/override；验证 CSS、SCSS、主题插件与按需生产构建。此路径不等同于完整 tarball 安装和发布验收。浏览器、SSR/水合和截图限制见[兼容边界](./compatibility.md)。
