# Timeline 时间轴

Timeline 用原生列表呈现事件顺序，支持时间、辅助内容、状态圆点与四种左右排列。

## 导入与样式

```tsx
import { Timeline } from "semi-ui-vue";
import TimelineFromPath, {
  Timeline as NamedTimeline,
  type TimelineProps,
  type TimelineItemProps,
  type TimelineMode,
  type TimelineItemType,
  type Data,
  type TimelineContent,
  type TimelineRenderResult,
  type TimelineSlots,
  type TimelineItemSlots,
} from "semi-ui-vue/timeline";
import Item from "semi-ui-vue/timeline/item";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/timeline.css";
```

根入口提供 Timeline，静态子组件为 `Timeline.Item`；族子路径提供默认、具名组件与类型，Item 子路径提供默认组件。没有根具名 Item、TimelineItem 值导出或公开命令式 ref 方法；组件 ref 不等于真实 DOM，需要聚焦调用方控件时使用该控件自己的原生 ref。

样式来自固定 Semi 2.103.0，也可导入完整 `semi-ui-vue/styles.css`。图标、Typography、Space、Tag 等组合组件须导入各自样式。主题插件的 `styles: ["base", "timeline"]` 可选择此样式闭包，支持定制前缀；CSS token 仍使用 `--semi-*`。详见[安装与样式](../guide/styles.md)。

## 数据与正文

<ClientOnly><VaporDemo example="timeline/Basic.vapor" /></ClientOnly>

非空 dataSource 优先于 default slot 与 children，不追加声明式节点。dataSource 省略、undefined、动态移除或空数组时，优先采用声明的 default slot，未声明才采用 children。存在但返回空内容的 slot 仍覆盖 children，不预执行 slot 探测结果。

Data.content 是正文，优先于数据项中的 children。正文、dot、extra、time 可用标量或同步 renderer；复杂内容返回原生 Vapor 元素、fragment、多根或数组。字符串按文本转义，不解释为 HTML；renderer 不应承载副作用或依赖固定调用次数。

## 排列、状态与圆点

<ClientOnly><VaporDemo example="timeline/Layout.vapor" /></ClientOnly>

mode=left/right 强制所有节点使用对应位置，覆盖 Item.position；center 默认 left，alternate 按索引交替，两者允许 truthy position 覆盖。这里的左右表示时间轴与内容相对位置，不是横向时间轴。固定中文文档对 position 的概括较宽，实际优先级以固定源码为准。

type 选择 default、ongoing、success、warning、error 的圆点样式；color 为 truthy 时设置圆点背景色，自定义 dot 也沿用这个背景色规则。dot 属性为 truthy 时采用自定义节点布局；`dot={0}` 显示文本 0，但不添加 head-custom 类。dot 的命名 slot 声明存在，即便内容为空，也采用自定义布局；组件不检查 renderer 返回内容是否为空。

extra/time 的 truthy 属性产生辅助容器；0 与 NaN 这种 falsy 数值保留原始文本结果但不产生辅助容器，false/null/undefined 不显示文本。声明的 extra/time slot 产生相应容器，空 slot 仍覆盖属性。time 默认空字符串。首项没有额外首项类；末项连线由固定 CSS 的 `:last-child` 选择器隐藏。

没有 direction、reverse、pending、active/current、横向排列、动画步骤或日期解析 API。需要倒序时，调用方改变自己的数组或稳定 key 列表，不添加虚构属性。

## 原生内容与动态顺序

<ClientOnly><VaporDemo example="timeline/Dynamic.vapor" /></ClientOnly>

原生 For 的稳定 key 由调用方拥有；增删、重排、条件内容、fragment 与多根不会要求克隆或缓存 VNode。保持的内容可保留组件实例、输入值与 DOM 身份；稳定更新保留焦点，实际 DOM 移动不保证焦点。卸载后重挂创建新的内容实例。

声明式排列依据根 ul 下实际直接 Item 元素的顺序。返回多根 Item 的包装组件可参与排列；原生 div 包装内的 Item 不是直接列表项，不参与父级位置计算。嵌套 Timeline 建立独立上下文。固定 React 实现通过 React.Children 检查、过滤、克隆直接元素，它对 fragment、条件空位和包装组件的索引处理与此处不完全等价。调用方应保持 ul 的合法 li 结构，不把任意可见包装元素直接插入列表。

顺序协作仅监听根 ul 的 childList，以 MutationObserver 同步实际重排，并在卸载时断开；不监听任意后代、属性或外部 DOM。缺少 MutationObserver 时初始与注册变化仍可计算顺序，但不承诺纯 DOM 重排后的交替位置同步。数据路径保留原始数组索引参与 alternate 排列；稀疏数组的空位跳过渲染但保留后续索引。数据默认按索引持有内容，不提供 rowKey API。

## 主题、RTL 与长内容

<ClientOnly><VaporDemo example="timeline/Theme.vapor" /></ClientOnly>

深浅主题来自既有 CSS tokens，RTL 来自 ConfigProvider 的祖先类与固定样式。Timeline 不修改 body.dir。窄屏沿用当前 mode，不自动改变排列；内容的换行与额外样式由调用方控制。固定根样式包含 `width: 100%` 和左右 padding，并不提供全局 box-sizing reset；没有 reset 的容器若需将 padding 包含在可用宽度内，可在 style 属性中将 `boxSizing` 显式设置为 `"border-box"`，本页主题示例采用此设置。示例仅组合已实现的 Typography、Space、Tag 和图标，不引入其他公共组件。

## API

### Timeline

| 属性              | 类型                                               | 默认值 | 说明                             |
| ----------------- | -------------------------------------------------- | ------ | -------------------------------- |
| mode              | `"left" \| "right" \| "center" \| "alternate"`     | left   | 时间轴与内容的位置               |
| dataSource        | Data[]                                             | 无     | 非空时优先显示数据项             |
| children          | TimelineContent                                    | 无     | 未声明 default slot 时的原生内容 |
| aria-label        | string                                             | 无     | 根 ul 的可访问名称               |
| className / class | `string / HTMLAttributes["class"]`                 | 无     | 根 ul 类名                       |
| style             | CSSProperties                                      | 无     | 根 ul 样式                       |
| `data-*`          | `string \| number \| boolean \| null \| undefined` | 无     | 根 ul 数据属性                   |

default 是无参数原生 slot。没有 v-model、组件事件或公开 ref 方法。mode 的默认值只在省略、undefined 和动态移除时生效；越过类型传入 null/false/0 不统一转成 left。

### Timeline.Item

| 属性              | 类型                                                          | 默认值       | 说明                            |
| ----------------- | ------------------------------------------------------------- | ------------ | ------------------------------- |
| children          | TimelineContent                                               | 无           | 正文，default slot 优先         |
| time              | TimelineContent                                               | 空字符串     | 时间内容，time slot 优先        |
| extra             | TimelineContent                                               | 无           | 辅助内容，extra slot 优先       |
| dot               | TimelineContent                                               | 无           | 自定义圆点，dot slot 优先       |
| type              | `"default" \| "ongoing" \| "success" \| "warning" \| "error"` | default      | 圆点状态样式                    |
| color             | string                                                        | 无           | 圆点背景色                      |
| position          | `"left" \| "right"`                                           | 依 mode 计算 | center/alternate 下的节点位置   |
| onClick           | `(event: MouseEvent) => void`                                 | 无操作       | li 的原生点击通知，无返回值协议 |
| className / class | `string / HTMLAttributes["class"]`                            | 无           | li 类名                         |
| style             | CSSProperties                                                 | 无           | li 样式                         |
| `data-*`          | `string \| number \| boolean \| null \| undefined`            | 无           | li 数据属性                     |

slots 为 default、dot、extra、time，均无参数并返回原生 Vapor 结果。Data 在 `Omit<TimelineItemProps, "v-slots">` 上增加必填 content，作为正文；数据项不支持传入组件 `v-slots`，复杂数据内容应使用 content、dot、extra、time 的同步 renderer。content 没有被声明为独立 Item prop。单独 Item 可以输出 li，但没有 Timeline 上下文时不获得布局位置类，调用方仍负责有效列表结构。

TimelineContent 包含 string、number、boolean、null、undefined 或同步函数；TimelineRenderResult 还包含原生 Vapor 结果与递归数组。原生 Node 的运行时识别沿用当前 document/realm 的 `Node`，不支持据此传入其他 iframe/realm 的 Node。不支持 Promise、React 元素或任意对象，也不强制字符串化 renderer 返回值。Vue RC9 的 VaporRenderResult 类型包含 VNode，因此 TypeScript 无法排除所有 Vue VNode；原生内容辅助函数在运行时拒绝不支持的对象，不能把框架 interop slot 桥接扩展为原生 renderer 接受任意 VNode。

## 空值与异常输入

dataSource 的选择依据可选 length：运行时 null/false/0 等无非零 length 的输入回到声明内容；非空稀疏数组即使没有可见项仍抑制 children。非空非数组对象没有合法 map 会失败；null/undefined 数据项在读取 content 时失败。公开类型不支持这些异常输入，也不保证 getter、Proxy、自定义 map 的副作用次数或错误时序与 React 相同。没有自动校正 mode/type/position 的协议；错误字符串可能形成没有对应样式的类名。

正文和 dot 的 0 显示为文本；false、null、undefined 不显示文本。extra/time 则还保留固定来源的真假值容器规则。空数组不会自动产生空态文案。

## DOM、事件与可访问性

结构为 ul → li，每个 li 内含连线、圆点、正文与可选辅助容器。连线和圆点设置 `aria-hidden="true"`，不参与读屏；自定义 dot 也处于隐藏子树，交互控件应放在正文中。时间内容是普通 div，不自动生成 time 元素或解析日期。读屏顺序遵循真实 DOM，支持根 aria-label，不添加 role、aria-live、tabindex 或键盘导航协议。

Item.onClick 接收原生点击事件；正文按钮、链接与输入保留原生交互和事件冒泡。按需阻止冒泡由调用方处理。根只传递 class/style/`data-*` 与显式 aria-label，Item 只传递 class/style/`data-*` 与 onClick；id、其他 aria-\*、任意事件监听、innerHTML/textContent 不构成额外透传 API。

## 验证与边界

真实示例与浏览器检查覆盖数据优先级、列表语义、文本转义、原生按钮键盘操作与冒泡、排列/状态/动态图标、稳定 key、上下文、slot 声明、卸载重挂、深浅主题、RTL、窄屏和长内容。代表截图不表示完整像素一致或真实移动设备验收。

纯 Vapor 与普通 Vue interop 分别验证。普通 Vue 应用显式安装 `vaporInteropPlugin` 后，已验证直接 `h(Timeline)` 的标量数据、内容与 mode 更新，以及 default slot 中直接 `h(Timeline.Item)` 的 default/time slots、provide/inject、动态 mode、稳定更新的 DOM 身份与焦点、条件内容卸载重挂和完整清理。这个范围不要求额外包装组件，但不代表任意 VDOM 组合或原生 renderer 返回 VNode 均受支持；详见[兼容边界](../guide/compatibility.md)。不由此宣称 SSR、水合或 CJS。Vue 3.6.0-rc.9 与 vue-jsx 3.3.0-rc.2 锁定不变，独立 TSX 编译器严格 peer 安装限制仍保留，预编译消费者不替代安装验证。

## 固定来源与维护

契约依据固定提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 [Timeline 源码](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/packages/semi-ui/timeline/index.tsx)、[Item 源码](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/packages/semi-ui/timeline/item.tsx)与[中文文档](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/content/show/timeline/index.md)。

上游实际使用 constants 和固定 SCSS，没有 TimelineFoundation 实例或额外生命周期桥接。本实现仅以原生内容注册替代 React children 克隆；不扩大 Foundation 补丁、资源依赖或公共 API。固定 timeline/rtl/variables SCSS 闭包与 MIT 许可由已有构建流程核验，新增修改同步[完成度矩阵](../guide/upstream-matrix.md)、示例及回归检查。
