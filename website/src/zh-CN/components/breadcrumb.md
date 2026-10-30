# Breadcrumb 面包屑

Breadcrumb 显示当前页面的层级路径，支持原生链接、图标、文本截断和按项目数量折叠。

## 导入与样式

```tsx
import { Breadcrumb, provideAriaIdScope } from "semi-ui-vue";
import BreadcrumbFromPath, {
  Breadcrumb as NamedBreadcrumb,
  type BreadcrumbProps,
  type BreadcrumbItemProps,
  type RouteProps,
  type BreadcrumbItemInfo,
  type MoreType,
  type showToolTipProps,
} from "semi-ui-vue/breadcrumb";
import Item from "semi-ui-vue/breadcrumb/item";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/breadcrumb.css";
```

根入口提供 Breadcrumb；族子路径提供默认、具名 Breadcrumb 及公共类型；Item 子路径提供默认组件，对应 `Breadcrumb.Item`。Item 保留固定来源的静态标记 `isBreadcrumbItem: true`，不在 Breadcrumb 根组件新增该标记。没有根具名 Item、BreadcrumbItem 值导出或命令式 ref 方法。组件 ref 不等于 DOM ref；聚焦调用方提供的控件时使用该控件自己的原生 ref。Item 应放在 Breadcrumb 内使用；子路径导出不代表独立点击能力。

样式来自固定 Semi 2.103.0，按需入口包含真实依赖的样式闭包。也可使用完整 `semi-ui-vue/styles.css` 或主题插件的 `styles: ["base", "breadcrumb"]`。组合组件仍应加载其各自样式。详见[安装与样式](../guide/styles.md)。

文本提示和 Popover 沿用既有 ARIA ID 上下文。在应用或示例根 setup 中调用 `provideAriaIdScope`，为每个应用提供文档内唯一的前缀；ConfigProvider 不替代这个上下文。本页真实示例各自显式建立 scope。

## 路由、当前页与链接

<ClientOnly><VaporDemo example="breadcrumb/Basic.vapor" /></ClientOnly>

<p id="breadcrumb-home" tabindex="-1">首页锚点目标</p>
<p id="breadcrumb-safe" tabindex="-1">安全路径锚点目标</p>
<p id="breadcrumb-details" tabindex="-1">详情锚点目标</p>

非空 routes 优先于 default slot 和 children；省略、undefined、动态移除或空数组回到声明式内容。已声明但显示内容为空的 default slot 仍覆盖 children，不预执行 slot 检查结果。字符串 route 转成 name；对象 route 保留原对象身份传给 renderItem 和点击回调。path 仅随数据传递，不负责调用路由器。

最后一项默认 active；activeIndex 不为 undefined 时严格按索引决定当前项。点击不会修改 activeIndex，没有 v-model 或 change 事件。当前项是 span，其外层标记 `aria-current="page"`；其他有 href 的项使用 a，href 为空字符串仍表示存在。active 项仍接收点击，也保留 href 属性，但 span 不执行链接导航。

Item.onClick 先于 Breadcrumb.onClick，随后原生事件沿实际 DOM 继续冒泡。组件不调用 preventDefault 或 stopPropagation；href 保留浏览器默认行为。noLink 只移除链接交互样式，不阻止点击或导航。文本按原生文本转义，不解释 HTML。本页链接使用文档与运行示例宿主提供的真实静态页内锚点；目标元素显式设置 tabindex=-1，原生导航后焦点可以进入目标，组件不将焦点强留在链接上。复制示例到自己的页面时，为 href 提供相应目标或替换成实际业务地址。

## 数量折叠与自定义省略区域

<ClientOnly><VaporDemo example="breadcrumb/Collapse.vapor" /></ClientOnly>

初始处于可折叠状态，只有 autoCollapse 为真且总项数大于 maxItemCount 时显示省略区域。默认 maxItemCount=4：保留首项和最后三项，额外增加省略按钮，因此可见项加按钮共五个。它不使用 OverflowList，也不根据容器宽度计算折叠；较窄容器按固定 CSS 自然换行。

点击省略按钮或在该按钮获得焦点时按 Enter 展开。固定源码监听 keypress 的 Enter，不提供 Space 展开或方向键导航协议。展开后 routes、maxItemCount 和 autoCollapse 更新不会重置内部展开状态；卸载重挂建立新状态。没有受控 collapsed、defaultCollapsed、onCollapse 或 onExpand API。

moreType="popover" 使用既有 Popover 默认 hover 触发、底部位置及箭头。悬停显示省略项，点击省略按钮或在按钮上按 Enter 仍展开整条路径。调用方未阻止事件传播时，点击弹层中的省略项也会展开：先通知 Item.onClick，再通知 Breadcrumb.onClick，随后执行内部展开协作并移除弹层。在 Item.onClick 或 Breadcrumb.onClick 中调用 stopPropagation 会阻止事件到达内部展开容器，但不会取消 Item→Breadcrumb 之间的显式回调通知；preventDefault 本身不阻止展开。弹层后代收到 keypress Enter 时也沿用内部展开协议；keypress Space 和单独的 keydown Enter 不触发展开，不新增 keydown 协议。弹层采用原生 Portal/Teleport，外层事件沿实际挂载位置的 DOM 传播，不自动穿过逻辑上的 nav 祖先；组件不会重新派发事件来模拟 React Portal 更广的逻辑冒泡。renderMore 优先于 moreType。renderMore 的参数是省略项的原生内容工厂只读数组；工厂在真正输出内容的原生 outlet 内调用，不能把工厂或其结果当作字符串、VNode 或可克隆对象。

```tsx
<Breadcrumb
  routes={["首页", "分类", "目录", "章节", "详情"]}
  renderMore={(rest) => <span>{rest.length} 个层级</span>}
/>
```

需要显示省略项时，可以在 renderer 的实际输出中使用 `rest.map((render) => render())`。不要在 setup、computed 或事件处理器中预执行它们来探测内容。折叠、弹层与展开之间的内容归属变化可能卸载重挂；不要用其中的控件保存必须跨分支保留的局部状态。

固定 React 实现会先对全部 routes 执行 renderItem，再裁剪折叠区域；原生实现只在内容实际挂载或对应工厂被输出时执行 renderer，默认折叠的隐藏项不会提前执行 renderItem。这是保留原生内容所有权的适配差异，不承诺 renderer 调用次数、时机或副作用与 React 完全等价。

## 声明式内容与稳定 key

<ClientOnly><VaporDemo example="breadcrumb/Dynamic.vapor" /></ClientOnly>

声明式 Item 保留原生 Vapor 内容所有权，支持条件、fragment、多根、For、嵌套 Breadcrumb 及调用方稳定 key 的增删重排。仅在渲染分支不变时，保持的内容实例可保留输入值和 DOM 身份；稳定更新保留焦点，实际 DOM 移动的焦点以浏览器行为为准。带 href 的项在 active 的 span 与普通 a 之间切换会重建该分支及其内容，即使 key 未变；这与固定上游的 DOM 结构切换一致。卸载重挂也创建新实例。

父级协作依据实际原生 Item 的顺序，不遍历、缓存或克隆 VNode，也不调用 default slot 来计算 children。它与固定 React.Children 对 fragment、空位、包装组件的处理不完全等价。嵌套 Breadcrumb 建立独立上下文；根层推荐直接输出 Item，不把原生包装元素混作直接 Item。根 children 的标量或普通原生节点可以输出，但不参与 Item 计数、active、separator 或折叠协作；固定 React 路径会对 truthy 子项执行 cloneElement，根层纯字符串或非零数字并非有效 Item 路径，因此此处不宣称完全兼容。Item.children 的字符串/标量正文是另一条内容路径。折叠和自定义省略区域的生命周期边界与普通 key 重排分别处理。默认 Popover 中按原始 rest 位置保留的同一项，在路由总数、项和内容分支不变、仅折叠阈值变化时可保留 DOM、焦点与实例。自定义 renderMore 的 rest 参数变化时，即使 renderMore 函数身份未变，也会重新执行并替换其原生内容分支；旧作用域及其监听会清理，不保证返回内容跨这次参数变化保留实例、输入值或焦点。

Item.default slot 声明优先于 children；内容变为空时仍覆盖属性，移除声明才恢复 children。icon 与 separator 同样按 slot 声明选择内容。原生 slot 不是 ReactNode，不能通过其返回值判断是否存在。

## 图标、分隔符与截断

<ClientOnly><VaporDemo example="breadcrumb/Theme.vapor" /></ClientOnly>

<p id="breadcrumb-theme-home" tabindex="-1">主题示例首页锚点目标</p>

根 separator 默认 `/`。Item 的 truthy separator 覆盖父级分隔符，直接输出该内容；Item.separator 为 null、false、0 或空字符串时回退父级。根 separator 为 null/false 时不显示文字，为 0 时显示文本 0。separator slot 的声明覆盖对应属性，即便内容为空。

图标不自动克隆或修改。Item.icon slot 接收只读 `{ className, size }`，调用方把这两个字段绑定到已有 Icon：compact 时 size 为 small，否则 default。icon 属性则可用标量或无参数原生内容函数；需要对应大小和样式时由调用方显式设置。

非空字符串正文使用 Typography.Text 截断，默认最大宽度 150px、末尾省略、提示位置 top。固定中文旧文档写 bottomLeft，实际源码默认是 top。showTooltip=false 只关闭提示，仍保留 150px 截断；`{ width: "auto" }` 可取消固定宽度，ellipsisPos="middle" 使用中间截断。opts 传给现有 Tooltip。renderItem 返回非空字符串时同样进入有归属的 Typography 截断分支。原生 default slot 或 renderer 提供的复杂内容按原生内容输出，不探测或强制转成字符串；default slot 不预执行检查内容，因此使用原生行内内容容器。

局部深浅主题使用 CSS tokens；ConfigProvider 的既有 RTL 类应用固定上游样式，不修改 body.dir。动态宽度与窄屏不改变按数量折叠的规则。本页仅组合已交付的 Icon、Typography、Tag 和 ConfigProvider。

## API

### Breadcrumb

| 属性              | 类型                                                                          | 默认值                               | 说明                                    |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------- |
| routes            | `Array<RouteProps \| string>`                                                 | `[]`                                 | 非空时优先于声明式内容                  |
| activeIndex       | number                                                                        | undefined                            | 严格索引匹配；undefined 时最后项 active |
| autoCollapse      | boolean                                                                       | true                                 | 超过阈值且尚未展开时折叠                |
| maxItemCount      | number                                                                        | 4                                    | 保留项数；省略按钮额外占一个位置        |
| moreType          | `"default" \| "popover"`                                                      | default                              | 内置省略区域                            |
| renderMore        | `(rest: readonly (() => BreadcrumbRenderResult)[]) => BreadcrumbRenderResult` | 无                                   | 自定义省略内容，优先于 moreType         |
| renderItem        | `(route: RouteProps) => BreadcrumbRenderResult`                               | 无                                   | 仅用于 routes 路径                      |
| separator         | BreadcrumbContent                                                             | `/`                                  | 根分隔符，separator slot 优先           |
| compact           | boolean                                                                       | true                                 | 紧凑字体与 icon slot size               |
| showTooltip       | `boolean \| showToolTipProps`                                                 | `{ width: 150, ellipsisPos: "end" }` | 字符串截断与提示                        |
| onClick           | `(item: RouteProps, event: MouseEvent) => void`                               | 无操作                               | Item 通知之后调用，无返回值协议         |
| children          | BreadcrumbContent                                                             | 无                                   | 未声明 default slot 时的内容            |
| aria-label        | string                                                                        | Breadcrumb                           | 根 nav 可访问名称                       |
| className / class | `string / HTMLAttributes["class"]`                                            | 无                                   | 根 nav 类名                             |
| style             | CSSProperties                                                                 | 无                                   | 根 nav 样式                             |
| `data-*`          | `string \| number \| boolean \| null \| undefined`                            | 无                                   | 根 nav 数据属性                         |

showToolTipProps 的字段为 width: string/number、ellipsisPos: end/middle、opts: TooltipProps。默认值在属性为 undefined 时恢复；null、false、0 等非法运行时值不统一替换为默认值。onClick 不提供取消内部状态的返回值协议。

### Breadcrumb.Item

| 属性                  | 类型                                               | 默认值 | 说明                                                  |
| --------------------- | -------------------------------------------------- | ------ | ----------------------------------------------------- |
| children              | BreadcrumbContent                                  | 无     | 正文，default slot 优先                               |
| icon                  | BreadcrumbContent                                  | 无     | 图标，icon slot 优先                                  |
| href                  | string                                             | 无     | 非 active 且非 null/undefined 时使用 a                |
| separator             | BreadcrumbContent                                  | 无     | truthy 时覆盖父分隔符                                 |
| noLink                | boolean                                            | false  | 仅移除链接交互样式                                    |
| onClick               | `(item: RouteProps, event: MouseEvent) => void`    | 无操作 | 先于父 Breadcrumb.onClick                             |
| route                 | RouteProps                                         | 无     | truthy 时作为点击信息原样传递                         |
| active                | boolean                                            | 无     | 未参与父级顺序协作时采用；否则由 activeIndex/末项决定 |
| shouldRenderSeparator | boolean                                            | true   | 未参与父级顺序协作时采用；否则由顺序与折叠区域决定    |
| `data-*`              | `string \| number \| boolean \| null \| undefined` | 无     | Item 外层数据属性                                     |

固定 Item 类型继承的 className/style 并未在其 render 中使用；不将它们新增为外层样式透传能力。没有 route 时，运行时点击信息包含正文来源的 name，以及非 null/undefined 的 href；default slot 对应原生内容工厂，不预执行 slot 提取文本。根与 Item 的 onClick 参数类型保留固定上游 `RouteProps`，其中 name 仍声明为 string；这与声明式正文可为内容值或原生工厂的运行时结果并不完全吻合，沿用的是上游 string 声明与 ReactNode 实际值之间既有差异。需要可靠的业务 name、path 等字段时，应显式传入 route；不要根据声明把任意原生正文当成字符串使用。

Item 在没有 Breadcrumb 上下文时可以渲染，但点击会先执行自身 onClick，再因缺少父级 context.onClick 抛出 TypeError。这是固定上游的实际边界，不把可渲染等同于独立可交互组件；应始终在 Breadcrumb 内使用 Item。

RouteProps 支持 name、path、href、icon 及 Item 对应字段。name 是显示名称，path 不自动变成 href。renderItem 和 onClick 使用原始对象；字符串 route 对应 `{ name: 字符串 }`。根/族的类型导出以及 slot/render/ref 正反用例与公开声明一同维护。

### Slots、内容与 ref

| 所属       | Slot      | 参数                                    | 说明                              |
| ---------- | --------- | --------------------------------------- | --------------------------------- |
| Breadcrumb | default   | 无                                      | 声明式 Item，非空 routes 时不执行 |
| Breadcrumb | separator | 无                                      | 根分隔符                          |
| Item       | default   | 无                                      | 正文                              |
| Item       | icon      | `{ readonly className, readonly size }` | 响应式读取，不解构成初始快照      |
| Item       | separator | 无                                      | 单项分隔符                        |

BreadcrumbContent 为 string、number、boolean、null、undefined 或同步原生内容函数。BreadcrumbRenderResult 还允许原生 Vapor 结果和递归数组。不支持 Promise、任意对象、React 元素或把 VNode 当作原生 renderer 返回值；不强制字符串化复杂结果。Vue RC9 的公共 VaporRenderResult 类型不能静态排除所有 VNode，运行时边界仍单独验证。

Breadcrumb 和 Item 均没有公开命令式 ref 方法。只保留固定来源的静态 Item 与其 `isBreadcrumbItem: true` 标记；标记不用于检查或克隆原生内容。不新增 focus、expand、reset 或路由导航方法。

## 空值、异常输入与 DOM

空 routes 回退声明式内容；非空稀疏数组仍选择 routes 分支，空位不等于可见 Item。renderMore 收到的 rest 保留隐藏区域的原始 length 与稀疏空位；Popover 按原数组索引插入分隔符，末尾空位可能使最后一个可见项之后仍有分隔符，不按可见项重新压缩数组。null/false/0 等越过公开类型的根输入、异常项以及非数组的 length/map 对象按源码实际可执行边界处理，不把错误数据悄悄转成正常路由。不要依赖 getter、Proxy、自定义 map 或错误时序与 React 一致。

activeIndex 的负数、越界、NaN 或运行时 null 不匹配任何索引；默认末项只在 undefined 时生效。maxItemCount 没有新增整数/范围校正协议；调用方应提供合理有限值，不能把异常运行时行为当作受支持的布局方式。

根是 nav，Item 外层是 span，当前页属性在外层。链接和调用方原生控件保留浏览器键盘行为，普通非链接 Item 不新增 tabindex。唯一内置键盘操作是省略按钮的 Enter 展开，不增加 aria-live、方向键、Home/End 或新的角色协议。根仅传递明确的 class/style/aria-label/`data-*`；Item 仅传递固定来源使用的字段与 `data-*`。id、任意 aria-\*、任意事件、innerHTML/textContent 不构成额外透传 API。

## 验证与维护边界

真实 TSX 示例、文档浏览器与 E2E 检查覆盖路由优先级、文本安全、链接默认行为、点击顺序、当前页、分隔符、阈值、Enter、Popover、稳定 key、上下文、slot 声明、卸载重挂、截断、深浅主题、RTL、窄屏与动态宽度。截图用于检查本轮实际显示，不表示完整像素一致、全浏览器或真实移动硬件验收。

纯 Vapor 与普通 Vue interop 分开验证；不能把原生内容工厂的结果当作任意 VDOM 内容传入。不声明 SSR、水合或 CJS。Vue 3.6.0-rc.9 / vue-jsx 3.3.0-rc.2 的独立 TSX 严格 peer 安装限制继续保留，预编译消费者不替代它。完整兼容范围见[兼容边界](../guide/compatibility.md)。

固定契约来自提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 [Breadcrumb 源码](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/packages/semi-ui/breadcrumb/index.tsx)、[Item 源码](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/packages/semi-ui/breadcrumb/item.tsx)和[中文文档](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/content/navigation/breadcrumb/index.md)。固定上游的 BreadcrumbFoundation 与 BreadcrumbItemFoundation 负责路由归一、点击通知和展开。现有补丁未覆盖前者 Enter 辅助函数中的 lodash 依赖，本实现使用最小原生函数适配并对照固定源码验证；没有直接实例化这两个 Foundation，也不扩大补丁或依赖例外。来源、许可证与完整样式闭包由既有检查维护，完成度以[上游矩阵](../guide/upstream-matrix.md)为准。
