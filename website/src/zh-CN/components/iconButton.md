# IconButton 图标按钮

IconButton 用原生 button 承载图标和可选内容，支持图标位置、加载状态及按钮样式。仅图标按钮应提供描述操作的可访问名称。

## 用途与导入

```tsx
import { IconButton } from "semi-ui-vue";
import IconButtonFromPath from "semi-ui-vue/iconButton";
import { IconHome } from "semi-icons-vue";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/iconButton.css";
```

也可使用完整 `semi-ui-vue/styles.css`。图标按钮样式入口包含必要的基础按钮和图标按钮 SCSS 闭包；公开 Button、ButtonGroup 与 SplitButtonGroup 通过独立 `button` 入口交付，见 [Button](./button.md)。内部 BaseButton 仍不提供包入口或公开类型。直接使用生成 SVG 图标不需要 Icon 包装样式；使用公开 Icon 包装时另引入 `styles/components/icons.css`。

根与 IconButton 子路径是浏览器原生 Vapor 入口。纯 Node 根入口不导出 IconButton，不能据此声明组件 SSR、水合或 CJS 支持。当前包保持 private，未来发布使用 `@raitosora` scope，见[本地产物与消费](../guide/packages.md)。

## 基础示例与尺寸

<ClientOnly><VaporDemo example="iconButton/Basic.vapor" /></ClientOnly>

`size` 控制按钮尺寸和类名，不自动重设传入图标的 size。图标尺寸、颜色和装饰性由 icon slot 中的图标自己接收。固定上游声明了 iconSize / iconStyle，但未将它们应用到图标；本实现保留这一边界。

## 图标位置与自定义内容

<ClientOnly><VaporDemo example="iconButton/Position.vapor" /></ClientOnly>

`iconPosition` 默认 left。left 时图标在前、文本在后，文本使用 `semi-button-content-right`；right 时顺序相反、文本使用 `semi-button-content-left`。RTL 间距由上游样式配合方向容器处理。

`text` 接受标量文本，替代上游 React children 的标量用途；富内容使用 default slot。text 为 0 或空字符串仍创建文本容器；null / undefined 且无 default slot 时使用仅图标样式。存在 default slot 时优先于 text，包括返回空片段的 slot；不会先执行 slot 来猜测内容是否为空。slot 内的响应式内容可动态更新。条件图标使用原生 `v-if`（例如 `icon: () => <><IconHome v-if={shown.value} /></>`，片段保持 slot 返回类型非空）；锁定编译器下，顶层 `() => condition ? [] : <IconHome />` 组合未形成可靠的动态更新，不将它列为支持用法。

## 动态加载、禁用与表单

<ClientOnly><VaporDemo example="iconButton/Dynamic.vapor" /></ClientOnly>

`loading=true` 替换原图标并加 loading 类；默认指示器复用 Spin 的私有 SVG。`disabled=true` 优先保留原图标，并保留 loading 类。加载不创建延迟计时器，也没有可配置的 indicator slot。[Spin 页面](./spin.md)已声明的全局 `Spin.indicator` ReactNode / 克隆路径仍不支持，也不能用它配置 IconButton。

loading 的交互限制来自上游 CSS `pointer-events: none`，不会设置原生 disabled，也不拦截键盘或程序化 `click()`。Enter / Space 仍可能激活按钮。业务要阻止操作时，应设置 disabled；业务请求状态与 aria-busy 也由调用方显式提供。disabled 会设置原生 disabled 和 aria-disabled，并阻止原生点击与表单行为。

`htmlType` 默认为 button，submit / reset 使用浏览器原生表单行为；视觉 `type` 不控制表单类型。原生鼠标与键盘事件转发一次，不另发组件 click 通知。组件不阻止表单默认操作；示例在 form 的 onSubmit 中调用 preventDefault。

## 样式、主题与配置

<ClientOnly><VaporDemo example="iconButton/Style.vapor" /></ClientOnly>

`noHorizontalPadding` 在调用方 style 之上把指定物理侧的 padding 设为 0；left / right 不随 RTL 改成逻辑方向。未指定侧保留原样式。`class` 和 `className` 加在根 button，`contentClassName` 加在内部内容 span。

浅深色通过主题 tokens 切换；ConfigProvider 的方向容器与 RTL 样式协作。IconButton 没有全局默认配置解析器，也不读取 Button 默认配置。ConfigProvider 不提供 IconButton props 注入；语言文案由调用方显式提供，不根据 locale 推断方向。

colorful 保留固定上游的分支：根据调用点原始 theme / type 计算 icon slot 的 fill，未显式设置时不会先补 BaseButton 的默认值来猜测分支。符合多色/双色分支时提供只读颜色数组，disabled 时换成禁用文本色；其余情况为 undefined。slot 必须显式使用 fill，组件不克隆图标。colorful 配合 light / outline / borderless，或 solid + tertiary 时的 loading 采用上游彩色加载资源；它属于按钮加载图案，不提供其他 AI 产品组件。

`prefixCls` 仅修改 IconButton 添加的装饰类、文本位置类与彩色加载类；内部 BaseButton 保持 `semi-button`。它不是完整的组件前缀定制 API，ConfigProvider 也不能重写该前缀。只编译定制 SCSS 前缀不能直接替换默认样式；要保留正常基础按钮样式需保留默认类匹配。

## API

| 属性                  | 类型                                                              | 默认值          | 说明                                                                       |
| --------------------- | ----------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------- |
| text                  | `string \| number \| null \| undefined`                           | 无              | 标量内容；default slot 优先                                                |
| iconPosition          | `'left' \| 'right'`                                               | `'left'`        | 图标和文本的 DOM 顺序                                                      |
| size                  | `'default' \| 'small' \| 'large'`                                 | `'default'`     | 按钮尺寸                                                                   |
| theme                 | `'solid' \| 'light' \| 'borderless' \| 'outline'`                 | `'light'`       | 基础按钮主题                                                               |
| type                  | `'primary' \| 'secondary' \| 'tertiary' \| 'warning' \| 'danger'` | `'primary'`     | 视觉语义                                                                   |
| htmlType              | `'button' \| 'reset' \| 'submit'`                                 | `'button'`      | 原生 button type                                                           |
| loading / disabled    | `boolean`                                                         | `false`         | 加载样式 / 原生禁用                                                        |
| block / colorful      | `boolean`                                                         | `false`         | 整行 / 彩色模式                                                            |
| circle                | `boolean`                                                         | 无              | 圆形按钮类                                                                 |
| noHorizontalPadding   | `boolean \| 'left' \| 'right' \| readonly ('left' \| 'right')[]`  | `false`         | 移除指定物理侧内边距                                                       |
| class / className     | Vue class / `string`                                              | 无              | 根 button class 合并                                                       |
| style                 | `StyleValue`                                                      | 无              | 根样式，指定 padding 可被覆盖                                              |
| x-semi-children-alias | `string`                                                          | `children`      | 内容 span 的标记名，支持响应式更新                                         |
| contentClassName      | `string`                                                          | 无              | 内部内容 span 的 class                                                     |
| prefixCls             | `string`                                                          | `'semi-button'` | 仅 IconButton 装饰类前缀，见上述限制                                       |
| iconSize / iconStyle  | 图标尺寸类型 / `CSSProperties`                                    | 无              | 兼容上游声明，当前不生效；请在 icon slot 内配置                            |
| 原生 button 属性      | Vue `ButtonHTMLAttributes`，排除冲突字段                          | 无              | id、name、value、form、tabindex、title、ARIA 与 data 属性等转发到根 button |

省略或显式 undefined 均回到对应内置默认值；text 的 undefined 表示无文本。disabled 由原生属性控制，组件生成的 aria-disabled 与它保持一致。

### Slots、事件与类型

| Slot    | 参数                                                | 返回值              | 用途                                                      |
| ------- | --------------------------------------------------- | ------------------- | --------------------------------------------------------- |
| icon    | `{ readonly fill: readonly string[] \| undefined }` | `VaporRenderResult` | 图标内容，读取 scope.fill 以响应 colorful / disabled 更新 |
| default | 无                                                  | `VaporRenderResult` | 富内容，优先于 text                                       |

```tsx
<IconButton
  aria-label="返回首页"
  onClick={(event) => console.log(event.currentTarget)}
  v-slots={{ icon: () => <IconHome aria-hidden="true" /> }}
/>
```

slots 使用原生 Vapor 块。文本包在元素中，空内容用空片段或 `[]`；不接受直接返回字符串、null、undefined、Promise 或 ReactNode。不提供 icon / children 节点 prop、VNode 克隆、缓存 VNode 或 render prop 替代路径。Vue 的 `VaporRenderResult` 类型自身包含 VNode，因此这里不声称类型拒绝所有 VNode；当前交付与验证限定原生 Vapor slots，不使用 cloneVNode。

原生事件使用 Vue 命名，例如 onClick 接收 PointerEvent（继承 MouseEvent），onMousedown / onMouseenter / onMouseleave 接收 MouseEvent，onKeydown / onKeyup 接收 KeyboardEvent，onFocus / onBlur 接收 FocusEvent。事件返回值不改变行为；需要取消默认行为时调用 event.preventDefault()。不支持 React 大写复合命名 onMouseDown / onKeyDown，也不新增事件回调别名。

根与 `semi-ui-vue/iconButton` 子路径提供 `IconButton`、`IconButtonProps`、`IconButtonSlots`、`IconButtonIconScope`、`HorizontalPaddingType`；子路径另有 default 导出。静态只读标识为 `IconButton.elementType = "IconButton"`。没有公开 ref 方法、静态子组件、v-model、自定义 loading indicator 或公开 BaseButton；公开 Button 与组合组件由独立 `button` 入口提供。

## 无障碍、生命周期与验证边界

原生 button 保留 Tab 焦点、Enter / Space 激活和浏览器表单语义；禁用按钮不进入常规 Tab 顺序。焦点样式沿用固定上游的 focus-visible 规则。仅图标按钮必须由调用方设置 aria-label 或 aria-labelledby；有文本时避免给装饰图标重复名称。默认 loading SVG 是装饰内容，不自动播报状态，aria-live / aria-busy 按业务需要提供。

加载图案复用实例独立的 SVG 引用，动态 slots 和条件分支由原生 Vapor 生命周期管理。卸载销毁图标分支，重挂创建新实例；本组件与复用的 SpinIcon 不引入模块级可变实例状态。CSS 动画不采用动画生命周期工具的过渡延迟，不额外创建 timer。保留上游动画规则，未新增 prefers-reduced-motion 自动分支；应用可依据自身需求覆盖动画，见[动画与可见性](../guide/animation.md)。

验证覆盖四个真实示例、源码和生成声明类型、浏览器原生表单与事件、loading / disabled 优先级、更新及卸载重挂、真实 tarball 消费。文档浏览器检查在开发与生产环境运行；纯 Vapor E2E 与普通 Vue interop 证据分开。浅深色、RTL 与 375px 窄屏截图用于局部视觉审阅，不表示完整像素级一致性。

保留 skipLibCheck=false。额外 exactOptionalPropertyTypes 调用点检查不代表所有依赖声明完全兼容；Vue 3.6.0-rc.9 / vue-jsx 3.3.0-rc.2 独立 TSX 编译器严格 peer 安装限制仍有效，见[兼容边界](../guide/compatibility.md)。

## 上游与同步维护

来源固定为 Semi Design 2.103.0 提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 IconButton、必要的基础 Button、按钮常量、SCSS 和 SpinIcon；IconButton 没有独立状态 Foundation，内部基础按钮仅承载必要原生结构和事件。

React children / icon 节点映射为 text 与原生 Vapor slots，colorful 的克隆注入映射为只读 scoped slot。保留默认值、文本存在性、图标次序、padding、loading / disabled 及前缀边界。源码与类型、中文文档、真实示例和测试随[完成度矩阵](../guide/upstream-matrix.md)同步；既有 Icon、Spin 或按钮样式本身不构成 IconButton 行为验收。
