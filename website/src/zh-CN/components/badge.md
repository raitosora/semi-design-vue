# Badge 徽章

Badge 在内容旁显示数量、文本、小圆点或自定义标记，也可以独立展示。示例只使用原生 HTML 和已交付的 ConfigProvider。

## 导入与样式

```tsx
import { Badge } from "semi-ui-vue";
import BadgeFromPath, { Badge as NamedBadge } from "semi-ui-vue/badge";
import type { BadgeProps, BadgeSlots, BadgeContent } from "semi-ui-vue/badge";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/badge.css";
```

根入口具名导出 Badge，badge 子路径同时提供默认与具名导出，也提供 BadgeProps、BadgeSlots、BadgeContent、BadgeRenderResult、BadgeType、BadgeTheme、BadgePosition 类型；没有静态子组件或公开命令式 ref 方法。纯 Node 根不提供组件值；不声明 SSR、水合或 CJS 支持。可以用完整的 `semi-ui-vue/styles.css` 代替按需样式。

## 数字、文本、圆点与独立显示

<ClientOnly><VaporDemo example="badge/Basic.vapor" /></ClientOnly>

`count` 是标记内容，`children` 或 default slot 是被标记的基底，两者用途不同。`dot=true` 隐藏 count 内容并显示小圆点；即使 count 是自定义 renderer，此时也不会执行它。dot 关闭后重新创建自定义内容，不保留其已卸载实例。

没有默认的 overflowCount，也没有 showZero 属性。数值 0 正常显示；数字超过 truthy 的 overflowCount 时显示 `${overflowCount}+`，相等时显示原数值。overflowCount=0 不截断，负数和小数不取整或钳制。NaN、Infinity 按固定源码的数字转换显示；NaN 阈值不截断，Infinity 只有比较成立时截断。字符串不进行数字截断，即使内容看起来像数字。运行时 boxed Number 按数字解箱后比较，boxed String 按普通转义文本显示，两者沿用 count 类而非 custom 类；它们不扩张公开 BadgeContent 声明。null、undefined 不添加 count 类，但内部 count span 仍存在；空字符串添加 count 类，boolean 不产生文本，true 仍遵循上游 custom 分类。

无有效基底内容时标记使用 block 类独立显示。标量 children 的判断沿用上游 truthy 规则：0、空字符串、false、null、undefined 不形成锚定基底；数字 0 仍作为文本渲染在外层。原生 renderer 和已声明的 default slot 则拥有自己的内容分支，不预执行内容函数探测其结果。

## 动态内容、插槽与所有权

<ClientOnly><VaporDemo example="badge/Dynamic.vapor" /></ClientOnly>

count 和 children 接受字符串、数字、boolean、null、undefined，或创建同步原生 Vapor 内容的函数。富内容可以包含 fragment、多根、嵌套组件和稳定 key 列表；每个位置应分别创建内容，不重复使用已经挂载的原生 Block。不要传 Promise、thenable、任意对象或 React 节点。

默认 slot 无参数，优先于 children 属性。只要 default slot 声明存在就采用锚定布局，即使其条件分支当前为空；动态移除 slot 声明后重新读取 children，没有有效 children 时恢复独立布局。这是原生内容所有权边界，组件不会为判空提前执行 slot，也不会检查、缓存或克隆 VNode。没有 count slot；自定义标记使用 count renderer。

已创建原生内容内部的响应式更新可以保留 DOM，示例可编辑的锚点输入不因数量改变而重建。若 renderer 本身读取响应式值，并在重新执行时重新创建组件或数组子项，这些子项可能卸载重挂；Badge 不提供跨 factory 调用的节点复用。需要保留输入状态时，把响应式读取放在原生子组件内部，并用稳定 key 的 For 管理动态列表。dot、scalar/renderer 切换和真实卸载会释放对应分支，自定义内容自己的生命周期由该分支管理。稳定 key 列表重排保留列表项 DOM；是否保留浏览器焦点还取决于具体 DOM 移动与调用方行为，不把截图当作焦点证据。

interop 宿主的 default slot 通过 Vue bridge 传入；count/children renderer 则始终是原生 Vapor factory，不能使用 `() => h(...)` 生成 VNode。锁定 Vue 的 VaporRenderResult 类型本身包含 VNode，类型检查通过不等于该 factory 路径支持 VNode。组件不做 VNode 检测或转换。原生 factory 沿用当前 Vue renderer realm 的 Node 范围；G10 裸 DOM 跨 document 能力不等于支持 foreign-realm factory、跨 document 委托事件迁移或任意跨 realm 组件。

## 位置、主题与自定义样式

<ClientOnly><VaporDemo example="badge/Theme.vapor" /></ClientOnly>

position 支持 leftTop、leftBottom、rightTop、rightBottom。缺省或显式 undefined 时按 ConfigProvider 的动态 direction 选择：LTR 为 rightTop，RTL 为 leftTop；显式位置保留物理方位。独立模式不应用定位类。主题由局部真实 DOM 承载，示例不修改 body.dir。

type 支持 primary、secondary、tertiary、danger、warning、success；theme 支持 solid、light、inverted。自定义 count renderer 不添加 type/theme/count 类，布局和可访问名称由自定义内容负责；dot 与 custom 分类可以同时存在，不能依赖普通 type/theme 为自定义 count 的圆点着色。

class/className 作用于外 span，countClassName 作用于内 span。特别注意：style 与 countStyle 都作用于内 span，沿用固定源码 `style || countStyle` 的优先级，不合并；style={} 也优先于 countStyle。没有 size 属性，默认数字标记高度为 18px，小圆点为 8px；需要其它尺寸时明确设置 countStyle 或自有类。

样式遵循 Vue 的原生 CSS 赋值语义，不自动为非零数字长度添加 px。`width: 30` 等没有单位的非零长度会被浏览器忽略，opacity 等无单位属性可以使用数字。长度请显式写出单位：

```tsx
<Badge
  count={2}
  countStyle={{
    width: "30px",
    height: "20px",
    borderRadius: "4px",
    opacity: 0.5,
  }}
/>
```

## API

| 属性               | 类型                        | 默认值        | 说明                                         |
| ------------------ | --------------------------- | ------------- | -------------------------------------------- |
| count              | BadgeContent                | 无            | 标记内容，数值才进行 overflowCount 比较      |
| children           | BadgeContent                | 无            | 基底内容，default slot 优先                  |
| dot                | boolean                     | false         | 不渲染 count 内容；不执行 count renderer     |
| overflowCount      | number                      | 无            | truthy 且小于数字 count 时截断，0 禁用截断   |
| position           | BadgePosition               | 按 direction  | 四个物理角，独立显示时不加位置类             |
| type               | BadgeType                   | primary       | 六种颜色类型，自定义内容不加此类             |
| theme              | BadgeTheme                  | solid         | solid / light / inverted，自定义内容不加此类 |
| class / className  | Vue class / string          | 无 / 空字符串 | 外 span 类                                   |
| countClassName     | string                      | 无            | 内 span 类                                   |
| style / countStyle | CSSProperties               | 无            | 内 span 样式；style truthy 时优先，不合并    |
| onClick            | (event: MouseEvent) => void | 无操作        | 外 span 原生 click 通知                      |
| onMouseEnter       | (event: MouseEvent) => void | 无操作        | 外 span 原生 mouseenter 通知                 |
| onMouseLeave       | (event: MouseEvent) => void | 无操作        | 外 span 原生 mouseleave 通知                 |

default slot 为无参数同步原生内容函数。组件不增加 count slot、事件取消返回值、键盘协议、焦点方法或 ref DOM 代理。普通安全 attrs（包括 `data-*`、`aria-*`、id 和原生 DOM 事件）透传外 span；会夺取内容所有权的 innerHTML/textContent 等属性被过滤，不使用不安全 HTML。字符串按文本转义，自有 renderer 由调用方负责安全输入。

省略、显式 undefined、动态移除 dot/type/theme 会恢复固定默认值；position 恢复动态方向默认值。Badge 不读取全局组件默认配置。公开 TypeScript 声明约束属性类型，但运行时不会把声明外的值一律改写为默认值或拒绝：type/theme/position、dot 与 overflowCount 仍沿用固定源码的类名、truthy 和比较行为。例如 dot=null 不开启圆点，position=null 不添加位置类，字符串形式的阈值在 JavaScript 比较中参与数值转换；这些运行时边界不扩张公开类型。count/children 的裸对象与异步内容不属于原生 renderer 支持范围。数值边界保留 NaN 和 Infinity，不因“合理默认”引入 99、取整或非负约束。

## DOM、可访问性与交互

实际结构为外层 span，先放基底，再放带 `x-semi-prop="count"` 的内层 span。Badge 不自动增加 role、aria-live、tabindex、键盘响应或 aria-hidden，也不会因为 count=0 隐藏。需要读屏说明时在有意义的原生交互内容上提供名称；自定义内容负责其自身语义。

内部按钮、输入框的原生事件正常冒泡到外层 onClick；Badge 不替调用者阻止事件或制造按钮语义。焦点归真实原生元素所有。Badge 没有 Foundation 实例、尺寸测量、异步图片任务、观察器、定时器或 RAF；不以不存在的资源测试声称支持额外能力。

## 上游与验证范围

来源为 Semi Design 2.103.0、固定 SHA `8bed560dd3f36579f85b7a522f19762f2bace756` 的 badge 源码、导出、类型、中文文档、常量和 SCSS。样式按固定闭包生成，维护入口见[上游对齐与完成度](../guide/upstream-matrix.md)。Badge 仅使用 Foundation 的常量与样式，上游没有 BadgeFoundation 实例。

真实示例分别由 `website/tests/badge.spec.ts` 和 `tests/e2e/badge.spec.ts` 验证开发与生产模式；源码浏览器测试补充默认值、异常输入、嵌套内容与资源所有权。截图覆盖数量边界、dot、独立显示、自定义内容、四位置、明暗、RTL 和 375px 窄屏，用于实际查看布局，不宣称完整像素一致。严格声明、pure Vapor、interop 与四条真实 tarball 消费者分别验收，不以预编译消费者替代独立 TSX 工具链安装限制。
