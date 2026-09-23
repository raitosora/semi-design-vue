# 安装与样式

Semi Design Vue 尚未发布可安装版本，当前包均为 private。未来发布统一使用 `@raitosora` scope；以下无 scope 名称对应当前本地构建包。组件运行路径固定为 Vue 3.6.0-rc.9 / vue-jsx 3.3.0-rc.2，Vapor 是编译模式。

## 本地构建与消费

```sh
pnpm install --frozen-lockfile
pnpm build:packages
```

UI 包的 JavaScript 根入口不会自动加载样式。普通 CSS 使用方不需要 Sass 或主题插件。当前提供基础 tokens、Button、Icon、Spin、IconButton、Input / Tooltip 样式入口；后两者供原生 HTML 验证夹具使用，不代表公共组件已实现。

```ts
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/button.css";
import "semi-ui-vue/styles/components/icons.css";
import "semi-ui-vue/styles/components/spin.css";
import "semi-ui-vue/styles/components/iconButton.css";
```

按需路径只加载基础、按钮、图标、加载和图标按钮样式，不包含 Input 或 Tooltip 样式。Spin 默认指示器不依赖 Icon 样式；只有自定义指示器使用 Icon 时才需要对应入口。需要本阶段全部样式时使用：

```ts
import "semi-ui-vue/styles/index.css";
```

不要混用完整入口和相同的分项入口，以免重复 CSS。也不要同时加载默认 CSS 与定制后的 SCSS。

## SCSS 与编译配置

样式来源固定为 Foundation / Theme `2.103.0`。构建只提取登记的 SCSS 闭包，随包提供必要源码、许可证及来源摘要；消费者无需安装官方 Foundation，也不需要 patch、override 或源码 alias。

SCSS 与 CSS 入口一一对应：`styles/base.scss`、`styles/components/button.scss`、`styles/components/icons.scss`、`styles/components/spin.scss`、`styles/components/iconButton.scss`、`styles/components/input.scss`、`styles/components/tooltip.scss`、`styles/index.scss`。`semi-icons-vue` 也提供独立的 `styles.css` 与 `styles.scss`。SCSS 消费需要 Sass；当前验证版本为 `1.97.3`。源码继承上游 Sass `@import` 写法，升级到移除该语法的 Sass 版本需单独适配，不能直接认定兼容。

CSS variables 使用上游 `--semi-*` 名称。例如：

```css
.my-surface {
  background: var(--semi-color-bg-0);
  color: var(--semi-color-text-0);
  border: 1px solid var(--semi-color-border);
}
```

Spin 的三种默认图标尺寸为 14 / 20 / 32px，指示器颜色来自 `--semi-color-primary`，随明暗 tokens 更新；包裹模式沿用官方内容透明度和遮罩规则。定制 SCSS 前缀只生成对应类名，公开 Spin 当前仍输出 `semi-*`，不能通过 ConfigProvider 修改它。

Button 样式入口复用固定的基础按钮与图标按钮 SCSS 闭包，供 Button、ButtonGroup、SplitButtonGroup 与 IconButton 使用。IconButton 的 `prefixCls` 只改变装饰类与文本类，内部基础类仍为 `semi-button`；不能仅修改 SCSS 前缀实现完整的运行时前缀替换，见 [IconButton](../components/iconButton.md)。BaseButton 仍是私有实现，但不再意味着公开 Button 未交付。

深色、RTL、前缀与主题覆盖方式见[定制主题](./theme.md)。[主题许可](/licenses/semi-theme-default-2.103.0-MIT.txt)与[Foundation 许可](/licenses/semi-foundation-2.103.0-MIT.txt)随产物保留。

## 验证范围

四条独立临时消费者通过 `pnpm pack` 生成的真实 tarball 安装，不读取库源码、仓库 patch 或 workspace 链接；验证 CSS、SCSS、主题插件、按需生产构建和浏览器执行。当前仍是 private 本地包，未进行 npm 发布；浏览器、SSR/水合和截图限制见[兼容边界](./compatibility.md)。
