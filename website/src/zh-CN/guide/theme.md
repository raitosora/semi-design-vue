# 定制主题

本页使用 Foundation / Theme `2.103.0` 的 tokens、基础样式和输入/浮层样式。示例中的控件是原生 HTML 夹具，尚未提供公共 Input 或 Tooltip。[ConfigProvider](../components/configProvider.md) 可动态传递方向，但不代替此页的主题 token 配置。

## 运行示例

切换浅色、深色、RTL 与局部主色，观察真实 CSS 计算结果。示例通过 `semi-always-light` / `semi-always-dark` 限定自身外观，不修改文档站的主题状态。

<ClientOnly>
  <VaporDemo example="theme/Theme.vapor" />
</ClientOnly>

## 深色与 RTL

全局主题沿用上游约定：

```ts
document.body.setAttribute("theme-mode", "dark");
// 恢复浅色
document.body.removeAttribute("theme-mode");
```

局部区块可使用 `semi-always-light` 或 `semi-always-dark`。RTL 同时设置 HTML `dir="rtl"` 与外层 `semi-rtl` 类；原生文字方向和上游结构规则共同生效。浮层若移动到外部容器，需要在对应容器应用 `semi-portal-rtl`。这是样式约定；已有 host 的动态容器和方向行为见[浮层指南](./overlay.md)。

```html
<div dir="rtl" class="semi-rtl">
  <div class="semi-input-wrapper semi-input-wrapper-default">
    <input class="semi-input semi-input-default" />
  </div>
</div>
```

## 局部 CSS variables

用容器变量覆盖可以隔离多块内容，不依赖主题插件：

```css
.my-theme {
  --semi-color-primary: #7c3aed;
  --semi-color-primary-hover: #6d28d9;
  --semi-color-primary-active: #5b21b6;
}
```

主色、hover、active、disabled 等 token 相互独立；只覆盖主色不会自动生成完整色阶。请分别检查浅色和深色的可读性。

## 构建主题

当前本地插件配合 Vite `8.3.0` 与 Sass `1.97.3` 使用。它不自动加载任何组件样式。CSS variables 必须通过显式虚拟入口加载，放在基础样式之后以遵循 CSS 层叠顺序。

```ts
// vite.config.ts
import { defineConfig } from "vite";
import semiTheme from "vite-plugin-semi-theme";

export default defineConfig({
  plugins: [
    semiTheme({
      prefix: "acme",
      styles: ["base", "input"],
      tokens: { "color-primary": "#7c3aed" },
      darkTokens: { "color-primary": "#c4b5fd" },
      scss: { variables: { "height-control-default": "40px" } },
    }),
  ],
});
```

应用显式导入插件生成的 SCSS 和变量覆盖，顺序如下：

```ts
// main.ts
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
```

`virtual:semi-theme.scss` 只编译 `styles` 指定的入口；上例没有 Tooltip 样式。插件不改写应用自己的 SCSS，也不修改 Vite 中已有的 `additionalData`、Sass importer 或 source map 配置。只使用 CSS variables 覆盖时，可以仅导入 `virtual:semi-theme.css`。

| 选项             | 作用                                                                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `styles`         | 显式选择 `base`、`input`、`tooltip`、`popover`、`spin`、`iconButton`、`button`、`divider`、`space`、`grid`、`layout`、`highlight`、`progress`、`skeleton`；默认只有 `base`，重复项去重 |
| `prefix`         | SCSS 生成的类名前缀，默认 `semi`；不会改写应用 DOM                                                                                                                                     |
| `tokens`         | 浅色 CSS variables，键省略 `--semi-`，值为非空 CSS 值或有限数字                                                                                                                        |
| `darkTokens`     | `body[theme-mode="dark"]` 的独立覆盖值                                                                                                                                                 |
| `scss.variables` | 编译期变量；当前公开验证 `height-control-default`，带单位尺寸以字符串传入                                                                                                              |

前缀设为 `acme` 后，DOM 需对应使用 `acme-input`、`acme-input-wrapper`、`acme-rtl` 等类。CSS 变量仍叫 `--semi-*`，局部主题选择器仍沿用 `semi-always-light` / `semi-always-dark`。插件不会替换已经编译好的默认 `.css` 中的类名。公开 Spin 的类名固定为 `semi-*`；此处定制前缀用于自行提供对应 DOM 的样式消费，ConfigProvider 没有 `prefixCls` 属性。

插件只生成这两个虚拟入口，不自动发现 JSX 组件或拦截第三方 CSS。应用自行编写的 Sass `with` 配置独立于插件；请勿将已定制的虚拟 SCSS 与同名默认 CSS 重复加载。未知或未开放配置的 Sass 变量会构建失败。尺寸适配只开放已经测试的 `height-control-default`；其他上游变量不作可配置承诺。

## 不使用插件的 SCSS 配置

直接通过 Sass `with` 配置可明确控制单个入口，无需 Vite 插件：

```scss
@use "semi-ui-vue/styles/base" with (
  $semi-prefix: "acme",
  $semi-theme-tokens: (
    "color-primary": #7c3aed,
  ),
  $semi-dark-theme-tokens: (
    "color-primary": #c4b5fd,
  )
);
@use "semi-ui-vue/styles/components/input" with (
  $semi-prefix: "acme",
  $height-control-default: 40px
);
```

各入口是独立 Sass 模块；对基础入口的配置不会自动传给另一个组件入口。可以导入 `semi-ui-vue/styles` 完整 SCSS 入口一次统一配置，但它会包含当前登记的全部组件样式，具体清单见[安装与样式](./styles.md)。

## 验证与限制

真实 Vapor 示例验证局部明暗、RTL、动态主色、输入更新和卸载重挂。独立消费者另验证全局 `theme-mode`、自定义前缀、编译期变量和按需产物。截图只证明被检查的视觉结果；尚无 Semi 全组件像素一致性、Firefox/WebKit、真实移动设备或组件 SSR/水合承诺。

[安装与样式入口](./styles.md) · [兼容边界](./compatibility.md)

[Divider](../components/divider.md) 使用 `styles: ["base", "divider"]` 选择分割线样式。组件 DOM 保持 `semi-divider*` 类名；定制前缀需由应用提供对应原生 DOM，不通过 ConfigProvider 或 Divider prop 改写。边框与文字使用各自的颜色 token，跟随局部或全局明暗主题。

[Collapsible](../components/collapsible.md) 可通过 `styles: ["base", "collapsible"]` 按需编译。定制前缀改变 SCSS 类名，CSS tokens 仍使用 `--semi-*`；组件内置类名保持 `semi-`，直接组件使用方需保持默认前缀。
