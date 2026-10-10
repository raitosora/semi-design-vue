# Card 卡片

Card 将标题、封面、正文、操作和页尾组织为一个内容区域。CardGroup 排列卡片，Card.Meta 组合头像、标题和描述。尺寸由 CSS 控制；没有 size、layout、selected、选中事件或内置图片组件。

## 导入与样式

```tsx
import { Card, CardGroup, provideAriaIdScope } from "semi-ui-vue";
import CardFromPath, { Card as NamedCard } from "semi-ui-vue/card";
import Meta, { Meta as NamedMeta } from "semi-ui-vue/card/meta";
import Group, { CardGroup as NamedGroup } from "semi-ui-vue/card/cardGroup";
import type {
  CardProps,
  CardSlots,
  CardContent,
  CardRenderResult,
  Shadows,
  MetaProps,
  MetaSlots,
  CardGroupProps,
  CardGroupSlots,
  CardGroupType,
} from "semi-ui-vue/card";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/card.css";
// 示例额外组合了 Avatar 和 Button：
import "semi-ui-vue/styles/components/avatar.css";
import "semi-ui-vue/styles/components/button.css";
```

浏览器根具名导出 Card、CardGroup，`Card.Meta === Meta`。card 子路径只导出 Card 组件值及相关类型；Meta、CardGroup 各有上述默认/具名子路径。没有根 Meta、Card.Group、默认根导出或命令式 ref API。Node 根不导出组件值，不声明 SSR、水合或 CJS 支持。card 按需样式包含 Typography、Skeleton、Space 和标题提示所需 Tooltip 的内部闭包；完整 `semi-ui-vue/styles.css` 可以替代按需样式。

**非空字符串 title 自动使用 Typography.Title 的 h6、单行 ellipsis 和 showTooltip。** 应用 setup 必须通过 `provideAriaIdScope("应用唯一前缀")` 建立既有 ARIA ID 范围，多 app 使用不同前缀；ConfigProvider 不替代这个初始化。继承 Typography 的实际 DOM 测量、Tooltip 资源清理及已记录的 ellipsis 差异。title 的原生 renderer/slot 按原样渲染，组件不推断其中的文本或自动添加省略提示。

## 内容区域与操作

<ClientOnly><VaporDemo example="card/Basic.vapor" /></ClientOnly>

根 div 的区域顺序是 header、cover、body、footer，body 始终存在。header 为 truthy 或声明 header slot 时优先于 title 和 headerExtraContent；否则头部 wrapper 按 DOM 顺序放附加区、标题区，样式使用 row-reverse 排列。只有非空字符串 title 进入内置 h6。Meta 的标题和描述使用 div，不自动变成 heading。

actions 仅支持数组，每项有独立 div 和 `x-semi-prop="actions.N"`，内部 Space 间距为 12px。空数组仍保留操作区；非数组运行时输入不显示操作区。actions 没有具名 slot 或点击通知，交互应由内容中的真实 Button、链接等元素负责。操作包装使用数组索引身份，不能把它当作支持任意稳定业务 key 的列表 API；需要稳定 key 的动态列表可放到 default 内容或 CardGroup 中。

cover 接受原生内容，不解析 URL 或创建 Image。示例使用原生 div；需要图片时可传 `() => <img src="..." alt="..." />`，调用方负责替代文字。封面直接子元素按样式显示为 block、width:100%。

## 加载与原生内容所有权

<ClientOnly><VaporDemo example="card/Dynamic.vapor" /></ClientOnly>

loading 同时控制根 aria-busy 和正文 Skeleton。正文来源存在时，loading=true 卸载真实正文并显示 active 骨架：一个 Skeleton.Title、br 和三行 Skeleton.Paragraph；恢复 false 重新挂载正文。标题、封面、actions 和页尾不在此分支中，加载切换保留它们的 DOM、编辑值与焦点。没有正文来源时不会仅因 loading 创建骨架，根仍反映 aria-busy。

title、header、headerExtraContent、cover、footer、children，以及 Meta 的 avatar/title/description，支持标量或同步原生 renderer。default slot 对应 children，具名 slot 优先同名属性。已声明 slot 即使输出为空也占据其区域；移除声明才恢复属性。组件不预执行 slot 判空，不检查、缓存、克隆 VNode，不字符串化 renderer 结果。slot 纯文字用 `() => <>{text}</>`；标量可直接使用属性。interop slot 由 Vue bridge 管理，属性 renderer 始终是原生 Vapor factory。

原生内容支持条件、fragment、多根、嵌套组件和 For。每个位置独立拥有子树，不能传已经挂载的 Block，也不支持 React 元素、VDOM VNode、Promise、thenable 或任意对象。锁定 Vue 的底层 VaporRenderResult 类型含 VNode 不代表 factory 路径支持它。固定上游使用 lodash.isString 判断标题，能够识别 boxed String；本实现仅将原始 string 进入自动标题路径，`new String(...)` 属于不支持的运行时对象，不自动拆箱或调用 String 强制转换。Card.Meta 与其他内容位置同样遵循原生内容的对象边界。示例把响应式读取放在子组件内，上下文更新保留真实输入 DOM 与焦点；若 renderer 读取依赖并重新创建子树，不承诺跨 factory 调用复用节点。真实卸载后重挂会创建新节点。

默认值仅在缺省、显式 undefined 或动态移除属性时恢复：bordered=true、headerLine=true、footerLine=false、loading=false。null、false 不被改写为默认 true。内容条件沿用上游 truthy 分支：空字符串、false、null、undefined 不创建对应内容包装，true 可创建空包装；0 和 NaN 在 cover、footer、children 及已存在头部中的 title/extra 等短路位置保留原生数值文本，不能统一当作空值删除。单独 title=0 不建立头部。异常运行时输入不扩大公开类型，组件不会为了“合理”统一改成默认值。

## CardGroup 与动态项目

<ClientOnly><VaporDemo example="card/Group.vapor" /></ClientOnly>

CardGroup 使用 Space 的原生内容路径并默认启用 wrap，不克隆 Card、不注入子属性。**默认 spacing 是 16**，依据固定源码 defaultProps；上游中文表格旧写的 12px 不是本实现默认值。数值表示两个方向的间距，数组按 `[水平, 垂直]` 传给 Space；`type="grid"` 强制间距为 0，增加网格类，使卡片直角并合并相邻边缘。

Group 接受 default slot 或 children 原生内容，支持条件、fragment、多根、嵌套以及 For 稳定 key 增删重排，不要求所有子项都是 Card。它不自动计算列数、卡片宽度或选中状态。稳定 key 保留未删除项目的节点和输入值，节点移动可能改变浏览器焦点，不声明列表重排全程焦点保持。嵌套包装会影响 CSS 的实际布局，调用方控制其结构和宽度。

## 主题、方向与尺寸

<ClientOnly><VaporDemo example="card/Theme.vapor" /></ClientOnly>

浅深主题使用既有 CSS tokens。ConfigProvider 的 RTL 祖先类使卡片 direction:rtl，标题与附加内容的间距、Meta 头像间距及网格边缘按固定 RTL 样式调整。没有自动窄屏断点，卡片宽度、换行和自定义 header/body/footer 样式由调用方设置。Vue CSS 数字长度不自动添加 px，请使用明确单位。

shadows="hover" 只在真实悬停时显示阴影，"always" 始终显示；两者都设置 pointer 光标。它们没有增加按钮 role、tabindex、键盘协议、选中状态或点击事件。可交互卡片的语义由调用方的真实内容元素与属性决定。

## API

### Card

| 属性                                  | 类型                             | 默认值       | 说明                       |
| ------------------------------------- | -------------------------------- | ------------ | -------------------------- |
| title / header / headerExtraContent   | CardContent                      | 无           | 头部内容，header 优先      |
| cover / footer / children             | CardContent                      | 无           | 封面、页尾和正文           |
| actions                               | CardContent[]                    | 无           | 操作项数组，空数组保留区域 |
| bordered                              | boolean                          | true         | 外边框                     |
| headerLine / footerLine               | boolean                          | true / false | 头部底边 / 页尾顶边        |
| loading                               | boolean                          | false        | aria-busy 与正文 Skeleton  |
| shadows                               | `"hover" \| "always"`            | 无           | 阴影及 pointer 光标        |
| headerStyle / bodyStyle / footerStyle | CSSProperties                    | 无           | 相应区域内联样式           |
| style                                 | CSSProperties                    | 无           | 根 div 样式                |
| className / class                     | string / HTMLAttributes["class"] | 无           | 根 div 类                  |

CardContent 为 string、number、boolean、null、undefined 或 `() => CardRenderResult`。CardRenderResult 为原生 Vapor 结果、标量及其数组。Card 有 default、title、header、headerExtraContent、cover、footer 六个无参数 slot，没有 actions slot、scoped 参数、业务事件或公开 ref 方法。

### Card.Meta

| 属性                | 类型                             | 默认值 | 说明                    |
| ------------------- | -------------------------------- | ------ | ----------------------- |
| avatar              | CardContent                      | 无     | 头像区域，可组合 Avatar |
| title / description | CardContent                      | 无     | 标题与描述              |
| style               | CSSProperties                    | 无     | 根 div 样式             |
| className / class   | string / HTMLAttributes["class"] | 无     | 根 div 类               |

具名 slots 为 avatar、title、description，均无参数；没有 default slot 或独立 loading。头像和文本区域均按来源存在性处理；title 或 description 有 truthy 来源/slot 时创建文字 wrapper。avatar=0/NaN 可保留短路文本，单独 title=0/description=0 不建立文字 wrapper；已有 wrapper 内的数值按原生内容渲染。Meta 不实例化 Avatar，只呈现调用方提供的头像子树。

### CardGroup

| 属性              | 类型                             | 默认值 | 说明                         |
| ----------------- | -------------------------------- | ------ | ---------------------------- |
| children          | CardContent                      | 无     | 原生内容，default slot 优先  |
| spacing           | number / number[]                | 16     | Space 间距，grid 时被 0 覆盖 |
| type              | `"grid"`                         | 无     | 网格类，不声明其他布局类型   |
| style             | CSSProperties                    | 无     | Space 根样式                 |
| className / class | string / HTMLAttributes["class"] | 无     | Space 根类                   |

Group 只有无参数 default slot，无静态子组件或公开 ref 方法。spacing 的缺省、undefined 和动态移除恢复 16；其他运行时异常值沿 Space 路径，不自行补齐、截断或限制为非负数。

运行时额外保留固定上游的 Space 属性透传：`align`、`vertical`、`wrap` 会在默认 `wrap` 之后传给 Space，并沿用 Space 的实际语义；例如运行时传入 `wrap={false}` 会覆盖默认换行。这三项仅属于运行时兼容，未加入公开 `CardGroupProps`，不扩展 Group 的 TypeScript API。

## DOM、可访问性与边界

Card 和 Meta 原生 attrs/监听器传给根 div，包含 id、`data-*`、ARIA 和 tabindex；innerHTML/textContent 路径被过滤。Card 的 aria-busy 由 loading 写入，调用方同名属性不覆盖它。业务内容属性不会成为 DOM 属性，字符串按文本转义。Group 的根 DOM 属性边界只透传 `data-*` 及 class/style，不把 role、id、原生事件等宣称为支持。

没有额外 aria-live、默认 role 或键盘协议。正文 skeleton 在 loading 中替代正文；交互区域的可访问名称、键盘与焦点来自真实内容。点击正常冒泡，Card 不拦截。Card、Group、Meta 自身没有异步任务、观察器、监听器、定时器或 RAF；字符串标题继承 Typography/Tooltip 的测量与资源释放，调用方 Avatar 等子组件保留各自生命周期责任。

## 上游与验证

来源为 Semi Design 2.103.0 固定 SHA `8bed560dd3f36579f85b7a522f19762f2bace756` 的 card 完整源码、类型、入口、中文文档和 SCSS。没有 Card Foundation 状态机；仅复用常量语义、主题样式与已交付组件协作。完成度、入口差异与维护流程见[上游对齐与完成度](../guide/upstream-matrix.md)。

示例的真实浏览器断言在 `website/tests/card-checks.ts`，文档开发/生产页面及 `tests/e2e/card.spec.ts` 共用，检查区域/转义/aria-busy、键盘与冒泡、loading 生命周期与 DOM 身份、上下文/焦点、slot 声明/空输出、Group 稳定列表及条件重挂、悬停、明暗/RTL/窄屏与 Avatar/Typography/Button/Skeleton 组合。截图用于人工检查实际展示状态，不声明完整像素一致。严格声明、纯 Vapor、interop、tree-shaking、样式及四条真实 tarball 消费者分别验证；不扩大 RC9/vue-jsx peer 严格安装、SSR/水合、CJS 或发布边界。
