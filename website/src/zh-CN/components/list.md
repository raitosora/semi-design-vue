# List 列表

List 展示数据项或声明式内容，List.Item 提供 header、main、children 与 extra 区域。数据渲染、加载状态和栅格布局可组合使用。

## 导入与样式

```tsx
import { List } from "semi-ui-vue";
import ListFromPath, {
  List as NamedList,
  type ListProps,
  type ListItemProps,
  type ListContent,
  type ListRenderResult,
  type ListSlots,
  type ListItemSlots,
  type Grid,
} from "semi-ui-vue/list";
import ListItem, { ListItem as NamedListItem } from "semi-ui-vue/list/item";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/list.css";
```

根入口导出 List，静态子组件为 `List.Item`；`semi-ui-vue/list` 提供 List 默认与具名值以及相应类型，`semi-ui-vue/list/item` 提供 Item 默认导出与具名 ListItem 及 ListItemProps / ListItemSlots 类型。没有根具名 ListItem、List.Item.Meta、actions、rowKey 或新增命令式 ref 方法。Item 需要 List 内容区的上下文；List 的 header、footer 和 loadMore 位于该上下文之外，不能把裸 Item 放进这些区域来获得该 List 的上下文。

按需 list 样式包含 List、Grid、Spin 的固定样式闭包，也可使用完整 `semi-ui-vue/styles.css`。此组件为空态呈现语言文本，不依赖公共 Empty。入口用于浏览器原生 Vapor，SSR、水合、CJS 与发布边界见[本地产物与消费](../guide/packages.md)。

## 数据、条目模板与加载更多

<ClientOnly><VaporDemo example="list/Basic.vapor" /></ClientOnly>

`dataSource` 非空且提供 renderItem 时，先渲染数据项，再追加 default slot 或 children。它们可以同时出现，不是二选一。非空数据没有 renderItem 时数据区为空，仍追加声明式内容，不显示空态。renderItem 接收数据项和从 0 开始的索引，返回原生 Vapor 结果；通常返回 List.Item。loadMore 只是列表 footer 后的内容，不自动加载数据、发起请求或注册滚动监听。

Item 的结构顺序为 header/main 组成的 body、children、extra。header 和 main 同时缺少 truthy 来源时不建立 body；extra 是附加内容区，可放真实按钮或链接。没有独立 actions API。align 仅控制 body 中 header 与 main 的交叉轴对齐。

数据 renderer 的所有权按索引管理，不检查或克隆返回节点，也不会读取 React element 的 key。因此数据重排不等同于上游 React key 的身份语义。需要稳定项目身份时，使用下面 default slot 中的 `For` 与 `getKey`。没有 rowKey 回调，也不把 item.id 自动视为 key。

## 加载、空态与内容所有权

<ClientOnly><VaporDemo example="list/Dynamic.vapor" /></ClientOnly>

loading 控制内部大号 Spin。加载时保留列表和空态的真实内容、子实例与输入值，只添加视觉和指针遮罩；停止加载恢复透明度。它不自动禁用键盘操作，不管理焦点，也不添加 aria-busy、aria-live 或 role。业务需要读屏状态或禁用控件时，应在自己的原生内容或外层元素上定义这些语义。

loading 的公开类型为 boolean。对于越过类型边界的运行时输入，truthy 值先转换为 true，undefined 转换为 false，其他 falsy 值原样交给既有 Spin。默认 `Spin.delay=0` 时，null、0、NaN、空字符串隐藏加载指示器，truthy 值显示。

若通过全局默认配置为 Spin 设置正数 delay，初次挂载时传入 null、0、NaN 或空字符串会显示加载指示器，并且延迟结束后仍然显示；固定上游初次显示后由 timer 应用原始 falsy 值并隐藏。因此“非法 falsy loading + 全局 Spin 延迟”这一组合不等价。合法 false 和 undefined 在初次挂载时不显示，true 初次显示，不属于上述异常输入限制。组件不为此新增定时器或改变共享 Spin；请使用声明支持的布尔值。运行时回归覆盖 delay=0 与 15ms、延迟后 30ms 的状态，不据此声明异常输入的所有动态切换或所有延迟值等价。

数据不存在或长度为 0，并且没有 truthy children 来源和 default slot 声明时，显示 emptyContent；emptyContent 本身为假值则使用 `locale.List.emptyText`，默认中文为“暂无数据”。原始 children 的真值用于判断：null、false、0、空字符串不抑制空态，0 还会作为内容显示；truthy renderer 即使返回空内容，也会抑制空态。运行时直接 children=[] 同样是 truthy，但公开 children 类型要求标量或渲染函数，数组可由渲染函数返回。

同名 slot 优先于内容 prop。slot 声明存在与其实际输出分开处理：已声明但返回空 fragment 的 default slot 仍抑制空态；空 header slot 保留 header 区域；空 emptyContent slot 保留空态容器并抑制默认语言文本。动态移除 slot 后恢复 prop 或语言回退。组件不预执行 slot 探测内容，不检查、缓存或克隆 VNode。

普通内容 renderer 可返回标量、原生 fragment、多根、嵌套组件及递归数组；稀疏数组中的空位不产生内容。数据 renderItem 的边界更窄：返回 [] 可不产出条目；直接返回 null、undefined、boolean、number、string 或包含这些叶子/空位的数组会拒绝，稀疏 dataSource 配合 renderer 同样拒绝。原生 fragment 内部的条件内容可以为空，这是 Vapor 内容适配范围，不声明与 React cloneElement 全部等价。异常运行时输入不转换为“合理”默认条目或强制字符串。

稀疏 dataSource 的拒绝结果与固定上游一致，但报错时序不同：本实现先检查数据空位，发现空位后在调用任何 renderItem 之前抛错；固定上游先通过 map 为已有数据项执行 renderItem，再遍历结果时因空位报错。因此 renderer 的执行次数、副作用与报错顺序不等价，renderItem 不应承载副作用。此限制只针对数据渲染路径，普通 children 等内容 renderer 返回稀疏数组仍受支持。

## 栅格、布局与动态列表

<ClientOnly><VaporDemo example="list/Grid.vapor" /></ClientOnly>

grid 为 truthy 时，内部 ul 替换为 Row，每个 Item 外包 Col。Row 默认 type="flex"，使用 `in` 从 grid 选取 align、gutter、justify、type 传给 Row，因此包括这些名称的继承字段。Col 接收对象 rest 得到的其余自身可枚举字段，不包含继承字段；显式 `type: undefined` 会覆盖默认 flex。响应式列宽和 gutter 沿用[Grid](./grid.md)的 24 栅格及固定断点。grid={} 也启用栅格，不自动推导列数或 span。切换有无 grid 会改变 DOM 分支，不能承诺子内容在该切换中保留身份。

layout="horizontal" 为普通列表启用横向 Flex 与对应分隔边线；默认 vertical。size 是 small、default、large；它只改变固定样式的 padding。split 控制项目分隔线，bordered 控制外边框，彼此独立。For 稳定 key 在增删重排中保留未删除项的 DOM 和输入值；浏览器移动节点时的焦点不作全程保留承诺。条件卸载再挂载会创建新实例。

## 主题与组合

<ClientOnly><VaporDemo example="list/Theme.vapor" /></ClientOnly>

主题使用既有 CSS tokens，局部 ConfigProvider 的 RTL 祖先类改变方向及 Item header/extra 间距。List 自身不写 body.dir。示例组合已交付的 Avatar、Button、Typography 与 Card，并用调用方 CSS 控制窄屏宽度与换行。List 不提供自动分页、筛选、选择器、拖拽排序或无限滚动协议；这些需要调用方自己的状态和控件，不能从上游文档里的第三方组合例子推导为 List API。

## API

### List

| 属性                       | 类型                                               | 默认值       | 说明                                    |
| -------------------------- | -------------------------------------------------- | ------------ | --------------------------------------- |
| dataSource                 | `T[]`                                              | 无           | 数据源，T 与 renderItem 参数关联        |
| renderItem                 | `(item: T, index: number) => VaporRenderResult`    | 无           | 数据渲染函数，按索引管理所有权          |
| children                   | ListContent                                        | 无           | 追加在数据项后，default slot 优先       |
| header / footer / loadMore | ListContent                                        | 无           | 头部、尾部、尾部后方内容                |
| emptyContent               | ListContent                                        | 语言文本     | 空态内容，truthy 来源替换文本           |
| loading                    | boolean                                            | false        | 内部大号 Spin，保留内容                 |
| grid                       | Grid                                               | 无           | Row 与 Col 配置，见上文与 Grid API      |
| layout                     | `"vertical" \| "horizontal"`                       | vertical     | 普通列表方向                            |
| size                       | `"small" \| "default" \| "large"`                  | default      | 固定尺寸样式                            |
| bordered / split           | boolean                                            | false / true | 外边框 / 分隔线                         |
| onClick / onRightClick     | `(event: MouseEvent) => void`                      | 无操作       | 提供给内容区 Item 的默认点击 / 右键回调 |
| className / class          | `string / HTMLAttributes["class"]`                 | 无           | 根 div 类名                             |
| style                      | CSSProperties                                      | 无           | 根 div 内联样式                         |
| `data-*`                   | `string \| number \| boolean \| null \| undefined` | 无           | 根 div 的数据属性                       |

内置默认值在省略、显式 undefined 和动态移除时生效，null、false、0 等运行时值不统一归一化为默认值。List 不读取 semiGlobal 的 List 默认配置。header、footer 和 loadMore 根据来源真值/slot 声明决定是否显示；数字 0 在这些区域不输出。CSS 数字长度使用 Vue 的规则，需要长度时写明确的 px 等单位。

ListContent 为 string、number、boolean、null、undefined 或 `() => ListRenderResult`。ListRenderResult 为原生 Vapor 结果、标量及递归数组。五个无参数 slots 为 default、header、footer、loadMore、emptyContent，返回原生 Vapor 结果；文本请包在元素或 fragment 中。没有 renderItem scoped slot、v-model、受控选择状态或额外组件事件。

### List.Item

| 属性                        | 类型                                                                | 默认值          | 说明                                       |
| --------------------------- | ------------------------------------------------------------------- | --------------- | ------------------------------------------ |
| header / main / extra       | ListContent                                                         | 无              | 头内容 / 主内容 / 附加内容                 |
| children                    | ListContent                                                         | 无              | body 后、extra 前的内容，default slot 优先 |
| align                       | `"flex-start" \| "flex-end" \| "center" \| "baseline" \| "stretch"` | flex-start      | body 对齐                                  |
| onClick / onRightClick      | `(event: MouseEvent) => void`                                       | List 上下文回调 | 自身 truthy 回调覆盖上下文回调             |
| onMouseEnter / onMouseLeave | `(event: MouseEvent) => void`                                       | 无操作          | li 的原生鼠标进入 / 离开                   |
| className / class           | `string / HTMLAttributes["class"]`                                  | 无              | li 类名                                    |
| style                       | CSSProperties                                                       | 无              | li 样式，grid 模式也仍作用于 li            |
| `data-*`                    | `string \| number \| boolean \| null \| undefined`                  | 无              | li 数据属性                                |

四个无参数 slots 为 default、header、main、extra。header/main/extra 仅 truthy 来源或 slot 声明建立对应包装；数值 0 不建立这些包装。Item 没有 Meta、业务命令、公开 DOM ref 或 imperative ref 方法。组件实例 ref 不能当成 li 元素；需要内容控件引用时显式绑定原生 ref。锁定工具链的 JSX ref 形状检查限制仍保留，见[API 与类型约定](../guide/api-contracts.md)。

## DOM、事件与可访问性

普通模式输出 div → Spin → ul → li；grid 模式保留固定来源的 Row/Col div 和 li 结构，不增加列表 role。默认空态为 ul 内的 div，而非额外 List.Item。调用方应根据实际结构安排读屏内容，不把样式列表当成 Listbox 或带选择状态的复合控件。

根和 Item 的属性透传只包括 `data-*`、class/style 及已声明事件；id、role、`aria-*`、tabindex、onKeydown、innerHTML/textContent 不属于透传 API。文本正常转义。onClick/onRightClick 的原生事件 currentTarget 是 li，返回值不用于取消或更新组件状态；需要阻止默认右键或冒泡时由调用方显式调用 event 方法。List 根不再额外绑定同名点击监听，因此 Item 自身回调覆盖继承回调时只调用自身一次，外层原生 DOM 冒泡仍然发生。

List 与 Item 不建立 Foundation 状态机，自身不注册异步任务、定时器、观察器、全局监听器或 RAF。Grid、Spin 与调用方内容保留各自资源和生命周期责任；不能把其资源检查写成 List 自己使用了这些资源。

## 普通 Vue 互操作边界

在锁定的 Vue 3.6.0-rc.9 下，安装 `vaporInteropPlugin` 后，List 的 default、header、footer、loadMore、emptyContent 五个 slot 可以直接接收普通 Vue 内容。这不等于 List.Item 可以通过相同路径直接创建：`h(List, null, { default: () => h(List.Item) })` 无法跨越原生正文的上下文提供边界，会报 `List.Item must be inside List.`。这是当前 RC9 的内容所有者与上下文桥接限制，不通过把上下文扩散到 header/footer/loadMore 来绕过。

需要在普通 Vue 应用中组合 List.Item 时，先把 List 和 Item 的层级写入原生 Vapor TSX 包装，再让 Item 的 slot 接收普通 Vue 内容。下面的包装是应用代码，须通过本项目锁定的 vue-jsx Vapor 编译配置预编译，不是新增公共组件或运行时 VDOM 回退：

```tsx
// ListBridge.vapor.tsx：使用 Vapor 编译配置
import { defineVaporComponent } from "vue";
import { List } from "semi-ui-vue";

export default defineVaporComponent(() => (
  <List>{() => <List.Item v-slots={{ default: () => <slot /> }} />}</List>
));
```

普通 Vue 应用消费上面的预编译模块：

```ts
import { createApp, h, vaporInteropPlugin } from "vue";
import ListBridge from "./ListBridge.vapor.js";

createApp({
  setup: () => () =>
    h(ListBridge, null, {
      default: () => h("button", { type: "button" }, "查看条目"),
    }),
})
  .use(vaporInteropPlugin)
  .mount("#app");
```

`tests/browser/list-interop-bridge.test.tsx` 分别验证 Item 的 default/header/main/extra 四个 slot 在 grid 与非 grid 下接收普通 Vue 内容，共八种组合，覆盖上下文、节点身份、焦点和挂载/卸载。直接 `h(List) → h(List.Item)` 的失败及卸载清空由独立负回归记录。纯 Vapor 示例与这些有限互操作路径分别验收，不声明完整互操作等价、SSR 或水合支持。

## 上游与验证边界

来源为 Semi Design 2.103.0 固定 SHA `8bed560dd3f36579f85b7a522f19762f2bace756` 的 List/Item 完整源码、类型、导出、中文文档与 SCSS。公开组件仅 List / List.Item。接口差异与维护要求见[完成度矩阵](../guide/upstream-matrix.md)。

真实示例的浏览器断言由 `website/tests/list-checks.ts` 共用到文档开发/生产页面与 `tests/e2e/list.spec.ts`：数据后追加内容、结构/文本转义、可访问性树中的原生列表/条目/按钮名称与顺序、原生按钮键盘和事件、loading DOM 身份/焦点/上下文/生命周期、slot 声明和空输出、稳定 For 增删重排、响应式栅格、尺寸/布局、明暗/RTL/窄屏与既有组件组合。截图用于人工检查代表状态，不声明完整像素一致。严格源码与声明、纯 Vapor/interop、DCE、样式和四条真实 tarball 消费者分别验证；预编译消费者不替代 RC9/vue-jsx 严格 peer 的独立 TSX 编译器安装验证。
