# Descriptions 描述列表

Descriptions 用表格结构呈现字段名与字段值，支持数据或声明式 Item、横向分组、跨列和双行样式。

## 导入与样式

```tsx
import { Descriptions } from "semi-ui-vue";
import DescriptionsFromPath, {
  Descriptions as NamedDescriptions,
  type DescriptionsProps,
  type DescriptionsItemProps,
  type Data,
  type DescriptionsAlign,
  type DescriptionLayout,
  type DescriptionsSize,
  type DescriptionsContent,
  type DescriptionsRenderResult,
  type DescriptionsSlots,
  type DescriptionsItemSlots,
} from "semi-ui-vue/descriptions";
import Item from "semi-ui-vue/descriptions/item";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/descriptions.css";
```

浏览器根提供 Descriptions，静态子组件为 `Descriptions.Item`；族子路径提供默认、具名组件与类型，Item 可从独立子路径导入。没有根具名 Item、额外命令式 ref 方法或 valueStyle 属性。组件 ref 不等于真实 DOM；需要聚焦输入控件时，引用调用方自己的原生元素。

按需样式来自固定 Semi 2.103.0，也可使用完整 `semi-ui-vue/styles.css`。组合的 Typography、Tag、Space 或 Card 仍须各自的样式。组件提供浏览器 ESM；Node 工具入口、普通 Vue 消费与 SSR、水合、CJS 的边界见[包产物与消费](../guide/packages.md)。

## 数据与复杂内容

<ClientOnly><VaporDemo example="descriptions/Basic.vapor" /></ClientOnly>

data 非空时完全优先于声明式内容，不会像 List 一样追加 children。data 为 []、省略或 undefined 时回到 default slot 或 children。hidden 为 truthy 的数据不显示；非空数组即使全部隐藏，也不回退声明式内容。

key、value 可传标量，复杂内容用同步渲染函数返回原生 Vapor 元素、fragment、多根或数组。字符串按文本显示，不解释为 HTML。renderer 应只描述内容，不承载副作用；渲染函数由实际显示的原生分支执行，不能依赖 React 实现里同次 render 的调用次数。

## 对齐、布局、跨列与双行

<ClientOnly><VaporDemo example="descriptions/Layout.vapor" /></ClientOnly>

align 为 center、justify、left 或 plain。前三者使用 th/td 分别呈现字段名和值；plain 在同一 td 中呈现，并在字段名后附加冒号。row=false 时类名选择对应对齐样式；row=true 时使用双行样式和 size。row 不会重写 align 值：align=plain 仍产生单 td 与冒号，不能将“对齐样式不生效”理解为结构也强制变成 center。

layout 默认 vertical，每个 Item 输出独立 tr。horizontal 时，column 指定分组的目标总列数，按输入顺序累加 `span || 1`，达到或超过 column 后结束一行；跨列项不会拆分，也不会自动压缩为剩余列数。隐藏项先被排除。最后一行未填满且最后项的 span 经全局 `isNaN` 判断为 true 时，该项可能补足剩余宽度；省略 span 符合此条件，显式 0、null、false 不符合。aligned 布局为每个字段保留 th，值 td 的 colspan 按 `span ? span * 2 - 1 : 1` 计算；plain 布局每个字段仅一个 td，colspan 按 `span || 1` 计算。这里使用分组后实际传给 Item 的 span；0、null、false 等 falsy 值在单元格上回退为 1。

column 只参与 horizontal 分组，不提供响应式断点；窄屏不会自动改变列数。row、layout、column 分别控制样式和分组，不等同于 CSS Grid。数据对象由调用方持有，本实现计算分组时复制描述，不像固定 React Foundation 那样修改末项 span。

column/span 的公开类型为 number，但组件不把负数、0、NaN 或越界数统一钳制成正整数。分组计算保留固定来源的比较与加法语义，实际 colspan 还受浏览器原生属性转换影响。请使用符合业务布局的正整数；这不是自动修复异常数据的 API。

keyStyle 作用于字段名 span，可使用显式 CSS 单位设置宽度、颜色等；例如 `{ width: "90px" }`。没有 valueStyle；值样式应写在 value renderer 或 Item 原生内容中。vertical Item 的 className/style/data-\* 作用于 tr；horizontal Item 没有自己的 tr，因此这些行属性不作用到父级分组行。

## 声明式内容与动态字段

<ClientOnly><VaporDemo example="descriptions/Dynamic.vapor" /></ClientOnly>

Item 的默认 slot 提供值，itemKey slot 提供复杂字段名；同名 slot 优先于对应 prop。已声明的空 slot 仍覆盖 prop，移除 slot 声明才恢复 prop；组件不提前执行 slot 判断是否存在内容。

横向分组依据实际注册的 Item，fragment、多根和包装组件中的 Item 仍各自参与分组。固定 React 实现则读取直接 children 元素的 props，把 fragment 当作一个元素处理；本实现保留原生内容与组件实例的所有权，不复制这种 children 检查，因此这些声明结构的分组语义不完全等价。横向声明的原生 For 顺序变化依靠 MutationObserver 同步；缺少该浏览器能力时仍支持初始注册和属性驱动的重新分组，但不承诺纯 DOM 重排的动态顺序同步。

原生 For 的稳定 key 属于调用方，可保留未删除项的内容实例、输入值和 DOM 身份。横向声明的 column/span 更新会重新分组；切换 vertical/horizontal 则改变单元格分支并重建内容。数据方式按索引管理，不反向检查渲染结果中的 React key，也没有 rowKey API。稳定内容更新可保留已有输入的 DOM 身份与焦点；布局分支重建或实际 DOM 移动不承诺保留焦点。条件卸载和重新挂载会创建新内容实例。嵌套 Descriptions 使用自己的上下文，布局和列数不从外层继承。Item 必须处于 Descriptions 内部，孤立 Item 即使 hidden=true 也不受支持；固定上游也会因缺少上下文而失败。

## 主题、方向与组合

<ClientOnly><VaporDemo example="descriptions/Theme.vapor" /></ClientOnly>

深浅主题由既有 CSS tokens 控制。局部 ConfigProvider 提供 RTL 祖先类，Descriptions 不修改 body.dir；字段间距和对齐沿用固定 RTL 样式。示例组合已实现的 Card、Typography、Tag 与 Space，显式选择单列并设置内容换行。它不提供编辑器、图片预览、日期选择器或其他业务交互。

## API

### Descriptions

| 属性              | 类型                                               | 默认值   | 说明                        |
| ----------------- | -------------------------------------------------- | -------- | --------------------------- |
| align             | `"center" \| "justify" \| "left" \| "plain"`       | center   | 字段对齐与 plain 结构       |
| row               | boolean                                            | false    | 双行样式                    |
| size              | `"small" \| "medium" \| "large"`                   | medium   | 双行尺寸                    |
| data              | Data[]                                             | []       | 非空数据优先于声明式内容    |
| layout            | `"vertical" \| "horizontal"`                       | vertical | 每项独立行或按 column 分组  |
| column            | number                                             | 3        | 横向目标列数                |
| children          | DescriptionsContent                                | 无       | default slot 未声明时的内容 |
| className / class | `string / HTMLAttributes["class"]`                 | 无       | 根 div 类名                 |
| style             | CSSProperties                                      | 无       | 根 div 样式                 |
| `data-*`          | `string \| number \| boolean \| null \| undefined` | 无       | 根 div 数据属性             |

default 为无参数原生 slot。默认值在省略、undefined 和动态移除时生效；null、false、0 等越过类型声明的输入不统一转换为默认值。没有 v-model、组件事件、响应式 column 对象、额外 ARIA role 或键盘协议。

### Data

| 属性     | 类型                | 默认值         | 说明                      |
| -------- | ------------------- | -------------- | ------------------------- |
| key      | DescriptionsContent | 无             | 字段名                    |
| value    | DescriptionsContent | 无             | 字段值，允许同步 renderer |
| hidden   | boolean             | 无             | truthy 时不显示           |
| span     | number              | 按实际布局计算 | 分组跨度及单元格 colspan  |
| keyStyle | CSSProperties       | 无             | 字段名 span 样式          |

固定上游 Data 公共类型未声明 className/style/valueStyle；不要把 React propTypes 的额外字段当作稳定的 Data API。Data 类型名称保持固定来源命名，不新增虚构的 DataItem 值导出。

### Descriptions.Item

| 属性              | 类型                                               | 默认值         | 说明                      |
| ----------------- | -------------------------------------------------- | -------------- | ------------------------- |
| itemKey           | DescriptionsContent                                | 无             | 字段名，itemKey slot 优先 |
| children          | DescriptionsContent                                | 无             | 字段值，default slot 优先 |
| hidden            | boolean                                            | 无             | truthy 时不显示内容       |
| span              | number                                             | 按实际布局计算 | 跨列数                    |
| keyStyle          | CSSProperties                                      | 无             | 字段名样式                |
| className / class | `string / HTMLAttributes["class"]`                 | 无             | vertical tr 类名          |
| style             | CSSProperties                                      | 无             | vertical tr 样式          |
| `data-*`          | `string \| number \| boolean \| null \| undefined` | 无             | vertical tr 数据属性      |

两个无参数 slots 为 default 和 itemKey，返回原生 Vapor 结果；文本可包在元素或 fragment 中。DescriptionsContent 为 string、number、boolean、null、undefined 或同步函数；DescriptionsRenderResult 还包括原生 Vapor 结果及递归数组。不能返回 Promise、React VNode 或未受支持的任意对象，也不把 renderer 结果强制字符串化。

## 空值与运行时边界

data 的选择先看 length；运行时传入 null、false、0 等无非零 length 的值会回到声明式内容。非空但没有合法项的 data 仍抑制 children。vertical 忽略非 plain object 项；horizontal 会在分组前拒绝 null/undefined 项，其他非法项可能占用分组位置而没有可见单元格，不承诺异常输入的错误时序与 React 完全相同。稀疏 data 的空位跳过；同步内容 renderer 返回的稀疏数组也按空内容处理。空数组不会产生组件自带的空态文案。异常数组类对象、自定义 map/filter、getter 或 Proxy 的副作用、访问次数和错误时序不承诺与固定 React 实现完全等价；响应式注册可能重复读取声明值。

默认属性的处理与真假内容分开：false/null/undefined 不显示文本，0 显示为文本 0；plain 字段名即使为空仍保留冒号。没有必要为这些值预执行 slot 或解析 VNode。

## DOM 与可访问性

根结构为 div → table → tbody。vertical 每项一行；horizontal 由父级提供行，Item 输出单元格。plain 使用 td，其他 align 使用 th 和 td；不擅自增加 scope、role、aria-live 或键盘导航。读屏名称取自真实字段和内容，操作控件使用原生按钮或链接。调用方应依据具体数据补充外部标题和业务说明。

原生注册和横向迁移会在 tbody/行内保留不显示的 template 定位节点，它们不是可见单元格或字段。真实 DOM 因此并非与 React 逐节点相同；不要把 childNodes 的每一项当作数据项，业务查询应定位实际 tr/th/td 或自己的内容节点。

仅传递已声明的 class/style/`data-*`；id、`aria-*`、原生事件监听和 innerHTML/textContent 不是额外根透传协议。子内容的原生事件仍可正常冒泡到调用方外层元素，输入控件的焦点与编辑由调用方拥有。

## 验证与限制

示例使用原生 Vapor TSX，浏览器检查分别覆盖数据优先级、真实表格结构、安全文本、原生键盘事件、对齐/跨列/双行尺寸、稳定 key、上下文、slot 存在性、卸载重挂、深浅主题、RTL 和 375px 视口。代表截图用于检查可见内容，不表示完整像素一致或真实移动设备验收。

固定 Vue RC9 与 vue-jsx RC2 的严格独立 TSX 编译器安装 peer 限制仍保留；预编译消费者不替代该安装验证。普通 Vue interop 与纯 Vapor 是不同消费路径。显式安装 `vaporInteropPlugin` 后，直接 `h(Descriptions)` 的数据路径已验证动态内容、布局切换与卸载；`h(Descriptions)` 默认 slot 中直接 `h(Descriptions.Item)` 的声明路径另已验证上下文、稳定内容更新的 DOM 身份和焦点，以及布局切换、条件重挂与卸载。此范围不代表任意 VDOM 组合等价，也不支持据此宣称组件 SSR、水合或 CJS。完整支持范围与已接受差异见[兼容边界](../guide/compatibility.md)和[完成度矩阵](../guide/upstream-matrix.md)。

## 固定来源与适配

契约依据 Semi Design 2.103.0 的固定提交 `8bed560dd3f36579f85b7a522f19762f2bace756`：[Descriptions 源码](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/packages/semi-ui/descriptions/index.tsx)、[Item 源码](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/packages/semi-ui/descriptions/item.tsx)、[Foundation 分组算法](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/packages/semi-foundation/descriptions/foundation.ts)及[中文文档](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/content/show/descriptions/index.md)。

固定 React 组件实际使用 DescriptionsFoundation。本实现以来源明确的私有分组函数复现其分组计算，以注册协议和原生内容所有权替代 React children 检查，并避免修改调用方输入。Item 值 renderer 只在实际显示分支执行一次，固定 React Item 在构造 plain/aligned 两个候选分支时会执行两次；调用次数及副作用语义不等价。上述差异不增加公共方法或其他组件能力。样式与完整来源许可由现有构建流程维护。

公开 renderer 与 slots 沿用 Vue 的 `VaporRenderResult`；Vue 3.6.0-rc.9 的该类型本身包含 `VNode`，因此 TypeScript 不能排除所有 Vue VNode。原生 renderer 内容辅助函数会在运行时拒绝不支持的对象；普通 Vue interop 的 slots 由框架单独桥接，已验证的直接消费范围见上文，不能据此扩大原生 renderer 的运行时支持范围。
