# 安装与样式

Semi Design Vue 尚未发布可安装版本，当前包均为 private。未来发布统一使用 `@raitosora` scope；以下无 scope 名称对应当前本地构建包。组件运行路径固定为 Vue 3.6.0-rc.9 / vue-jsx 3.3.0-rc.2，Vapor 是编译模式。

## 本地构建与消费

```sh
pnpm install --frozen-lockfile
pnpm build:packages
```

UI 包的 JavaScript 根入口不会自动加载样式。基础入口包含固定 Theme animation.scss 的动画 CSS 变量，保留上游零时长、曲线、延迟和 transform 默认值；Collapsible 的过渡依赖这些变量。普通 CSS 使用方不需要 Sass 或主题插件。当前提供基础 tokens、Layout、Grid、Space、Button、Divider、Icon、Spin、IconButton、Skeleton、Highlight、Progress、OverflowList、Collapsible、Popover、Tooltip 与 Input 样式入口；Input 样式供内部原生 HTML 夹具使用，公共组件尚未提供。

```ts
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/layout.css";
import "semi-ui-vue/styles/components/grid.css";
import "semi-ui-vue/styles/components/space.css";
import "semi-ui-vue/styles/components/button.css";
import "semi-ui-vue/styles/components/divider.css";
import "semi-ui-vue/styles/components/icons.css";
import "semi-ui-vue/styles/components/spin.css";
import "semi-ui-vue/styles/components/iconButton.css";
import "semi-ui-vue/styles/components/skeleton.css";
import "semi-ui-vue/styles/components/highlight.css";
import "semi-ui-vue/styles/components/progress.css";
```

按需路径只加载基础、布局、栅格、间距、按钮、分割线、图标、加载、图标按钮、骨架屏和文本高亮样式，不包含 Input 或 Tooltip 样式。Spin 默认指示器不依赖 Icon 样式；只有自定义指示器使用 Icon 时才需要对应入口。需要本阶段全部样式时使用：

```ts
import "semi-ui-vue/styles/index.css";
```

不要混用完整入口和相同的分项入口，以免重复 CSS。也不要同时加载默认 CSS 与定制后的 SCSS。

## SCSS 与编译配置

样式来源固定为 Foundation / Theme `2.103.0`。构建只提取登记的 SCSS 闭包，随包提供必要源码、许可证及来源摘要；消费者无需安装官方 Foundation，也不需要 patch、override 或源码 alias。

SCSS 与 CSS 入口一一对应：`styles/base.scss`、`styles/components/layout.scss`、`styles/components/grid.scss`、`styles/components/space.scss`、`styles/components/button.scss`、`styles/components/divider.scss`、`styles/components/icons.scss`、`styles/components/spin.scss`、`styles/components/iconButton.scss`、`styles/components/skeleton.scss`、`styles/components/highlight.scss`、`styles/components/progress.scss`、`styles/components/input.scss`、`styles/components/tooltip.scss`、`styles/components/popover.scss`、`styles/components/collapsible.scss`、`styles/index.scss`。`semi-icons-vue` 也提供独立的 `styles.css` 与 `styles.scss`。SCSS 消费需要 Sass；当前验证版本为 `1.97.3`。源码继承上游 Sass `@import` 写法，升级到移除该语法的 Sass 版本需单独适配，不能直接认定兼容。

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

Divider 使用固定上游 divider.scss / variables.scss 和共享主题闭包，CSS 与 SCSS 分项入口均为 `styles/components/divider`。文字、水平/垂直与虚线规则见 [Divider](../components/divider.md)；它没有 Foundation 状态机或运行时自动样式导入。

Grid 使用固定上游 Grid SCSS 的 24 列与六个媒体断点；CSS / SCSS 分项入口均为 `styles/components/grid`，详见 [Grid](../components/grid.md)。其基础 `0` gutter 来自样式表，不会生成额外间距覆盖。

Layout 使用固定上游 Layout SCSS 的纵向/横向 Flex、子区域尺寸、溢出与 RTL 规则；CSS / SCSS 分项入口均为 `styles/components/layout`，详见 [Layout](../components/layout.md)。侧栏的宽度、背景和折叠状态不由这份样式自动生成。

Skeleton 使用固定上游 Skeleton SCSS 的占位尺寸、主题颜色及纯 CSS 高亮动画；CSS / SCSS 分项入口均为 `styles/components/skeleton`，详见 [Skeleton](../components/skeleton.md)。它不自动提供真实内容、请求状态或减少动态效果的逻辑。

Highlight 提供 `styles/components/highlight` 及 `.css`/`.scss` 按需入口，并包含于完整样式。固定 Foundation 的 highlight.scss/variables.scss 定义 `semi-highlight-tag` 的颜色、背景与 600 字重；无私有 RTL 规则。`vite-plugin-semi-theme` 的 `styles: ["highlight"]` 与 `$semi-prefix` 可配置选择器前缀，CSS token 名仍为 `--semi-color-highlight` / `--semi-color-highlight-bg`。组件类名保持 semi，定制前缀需调用方确保匹配。

Progress 复用固定 Foundation 的 progress.scss、variables.scss 和 rtl.scss 闭包，提供 `styles/components/progress` 与 `.css`/`.scss` 按需入口，并包含于聚合样式。线形/纵向宽高过渡、环形描边过渡和不确定循环动画由 CSS 控制；组件 motion 只控制数字动画，样式没有内建 reduced-motion 覆盖。主题色与 RTL 来自既有 tokens 和祖先方向；`styles: ["progress"]` 支持主题插件选择与定制前缀，组件默认类名仍使用 semi。详见 [Progress](../components/progress.md)。

Tooltip 复用固定 tooltip.scss、variables.scss、arrow.scss、animation.scss、rtl.scss，按需加载 `styles/components/tooltip.css` 或 `.scss`。坐标位于 portal-inner，用户 className/style 位于 tooltip wrapper，箭头偏移使用固定 CSS 变量。prefixCls 仅改变对应运行时类，内容与动画仍沿用固定 semi-tooltip 类；自定义前缀需匹配这些规则。详见 [Tooltip](../components/tooltip.md)。

Popover 按需加载 `styles/components/popover.css` 或 `.scss`，登记自身固定 SCSS 与最小 Tooltip motion 协作。`showArrow` 与 `arrowStyle` 控制专用箭头，内容类由 contentClassName 添加；自定义前缀须匹配编译后的 SCSS。实际目标、内容卡片与 portal 的样式边界见 [Popover](../components/popover.md)。

Popover 的独立入口包含内部生成的 `popover-motion.scss`：从锁定 Tooltip SCSS 提取 zoomIn/zoomOut keyframes 与 `semi-tooltip-animation-show`/`semi-tooltip-animation-hide` 两个 motion 选择器，引用固定动画变量。它让现有 Tooltip 运行时动画类在 Popover 按需样式中生效，不导入 Tooltip 完整视觉 CSS，也没有新的公开 SCSS 子路径。按需消费者分别验证实际 CSS motion、Popover 几何与主题；不能把“按需”描述为完全没有 Tooltip 选择器。

Collapsible 的独立入口只引入固定 `collapsible/animation.scss`、`collapsible/collapsible.scss` 与 `collapsible/variables.scss` 闭包，默认与定制前缀均保留 `--semi-*` tokens。它提供高度/透明度 transition 类，容器裁剪和业务背景分别由组件和使用方设置；[生命周期差异](../components/collapsible.md)包括最终 CSS 时序覆盖与 reduced motion。

OverflowList 的 `styles/components/overflowList`、`.css` 与 `.scss` 按需入口使用固定 `overflowList/overflowList.scss` 与 `overflowList/rtl.scss` 闭包，也包含于完整样式。`styles: ["overflowList"]` 可选择主题插件入口，`$semi-prefix` 支持定制选择器前缀，组件默认类名保持 semi，业务需确保匹配。固定样式负责横向布局；业务项目背景、按钮语义与两側溢出提示由 renderer/slot 提供。完整动态几何与尺寸测量边界见 [OverflowList](../components/overflowList.md)。
