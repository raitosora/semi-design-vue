# OverflowList 溢出列表

OverflowList 按实际容器和内容宽度保留可见项，将其余项目交给调用者渲染；也提供基于 IntersectionObserver 的滚动模式。内容使用原生 HTML，示例不依赖其他尚未交付的组件。

## 导入

```tsx
import { OverflowList } from "semi-ui-vue";
import OverflowListFromPath from "semi-ui-vue/overflowList";
import type {
  OverflowItem,
  OverflowListProps,
  OverflowListSlots,
} from "semi-ui-vue/overflowList";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/overflowList.css";
```

完整样式入口是 `semi-ui-vue/styles.css`。浏览器根入口提供组件值与本族公开类型；子路径提供默认、具名组件与相同类型，纯 Node 根没有组件值。当前包 private，未来统一使用 `@raitosora` scope，见[本地产物与消费](../guide/packages.md)。

## 折叠方向与最小项数

<ClientOnly><VaporDemo example="overflowList/Basic.vapor" /></ClientOnly>

默认 `renderMode="collapse"`、`collapseFrom="end"`，保留列表前部；`start` 保留后部。`minVisibleItems` 即使空间不足也保留指定数量，因此调用者设置的最小项数可能使内容实际溢出。可见项目与溢出提示都参与真实宽度测量，溢出提示改变宽度时重新收敛。根容器最大宽度固定为 100%；测量完成前暂时隐藏。

折叠算法沿用固定上游的整数 `clientWidth` 运算：可用宽度取根元素的 `clientWidth`，项目与溢出提示宽度取各自包装元素的 `clientWidth`，而不是子像素 `getBoundingClientRect().width`。根的 `clientWidth` 包含 padding、不包含 border；项目内容的 margin 可能进入其包装元素的实测宽度。算法不另外从可用宽度扣除根上的 flex gap，整数舍入也可能改变临界宽度下的可见项数。例如根 `clientWidth=146`、三个项目包装各为 48 时，宽度和 144 可令三项全部可见；若根另有 12px gap，最后一项的实际右边缘仍可能越过根边缘。因此不保证调用者额外 gap、margin 或子像素布局下的总包围盒完全无溢出；需要该保证时，应控制这些外部间距并按实际布局验证。

`onOverflow` 参数是当前折叠项的一维数组，仅在实际溢出且折叠位置改变时通知。完全恢复可见不会发送空数组；同一位置下替换内容也不会重复发送通知。初始化与尺寸变化可触发通知，通知发生在当前测量收敛之后，不承诺逐次中间测量回调。

## 动态内容与原生所有权

<ClientOnly><VaporDemo example="overflowList/Dynamic.vapor" /></ClientOnly>

支持初始零尺寸后显示、隐藏恢复、容器变化、可见内容尺寸变化和字体加载事件。项目使用稳定 key；增删、反转及卸载重挂由原生 Vapor 分支管理。每个项目只有一份真实内容树，临时测量候选项不参与交互，收敛后折叠项卸载；不会保留另一套可聚焦的测量内容。

raw `visibleItemRenderer(item, index)` 与 `overflowRenderer(items)` 返回 `OverflowRenderResult`，支持同步原生 Vapor 内容、字符串、数字、boolean、null、undefined 及递归数组。字符串和数字规范化为文本，boolean 与空值不渲染；原生内容支持 fragment、多根、条件、嵌套组件、For 与原生元素 ref。raw callback 的 item/index 改变时重建其拥有的子分支，项目包装元素仍按 key 保留。

命名 slot 的返回类型是 Vue `VaporRenderResult | null | undefined`，使用真正的原生 outlet 管理 JSX、fragment、多根、条件内容、For 与嵌套；不能直接返回原始 string、number 或 boolean，文本请放在 `<span>{text}</span>` 或 JSX fragment 内。slot scope 的 item/index/items 是只读实时 getter，读取 `scope.item`、`scope.index` 与 `scope.items`，不使用 `.value`；不要解构成一次性快照后期待更新。scope 属性浅只读，拒绝替换或删除；`scope.item` 以及 `scope.items` 中的调用者记录保持原对象身份，不做深只读，也不冻结数组或项目。不要通过 slot 修改输入数据。命名 slot 保留同 key 的原生子内容。

实时 getter 的响应读取须位于 JSX 生成的原生 effect/条件块内。条件内容请写成 `overflow: (scope) => <>{scope.items.length ? <span>+{scope.items.length}</span> : null}</>`，或在 JSX 中使用 v-if。slot 的外层普通 JavaScript 条件在创建分支时只求值一次；getter 改变不会使该外层函数自动重新执行。此边界沿用 [API 与类型约定](../guide/api-contracts.md#slots-与公开-ref) 与 [Vapor 文档编写](../guide/authoring.md#真实源码流程)，不把原生 setup/slot 称为 VDOM re-render。

Vue JSX 的联合类型无法静态区分 Vapor block 与 VDOM VNode，不能宣称类型检查会拒绝所有 VNode。普通 Vue 宿主安装 `vaporInteropPlugin` 后，named slots 可以返回 `h()` 创建的 VDOM 内容，由 Vue outlet 转换；这条 interop 路径与纯 Vapor 分开验证。raw renderer 不支持手造 VNode 或 VDOM return-render。

内容由所属 renderer/slot 分支创建与销毁，不预执行 slot 探测子项，不检查、缓存或克隆 VNode。`index` 在折叠模式是当前可见列表局部下标，在滚动模式是原列表下标。ReactNode、children、Promise 和异步 renderer/slot 不支持。

固定上游先用 `floor(容器宽度 / 4)` 估计可见候选项上限，本实现没有移植该启发式。每次重新测量临时挂载全部项目并读取真实布局，再收敛到展示集合；单次候选树和宽度读取随项目数增长，收敛可能需要多轮。它不是虚拟列表，不承诺大量项目的固定 DOM 数量或与上游相同的测量开销；请按业务数据规模评估。

折叠项已经卸载时，仅改变 renderer 闭包中用于该项目的状态无法直接观察其尺寸；请更新 items 或 renderer 身份，或由真实容器、字体、可见内容变化触发重新测量。对溢出提示宽度与折叠数量相互影响而无法稳定的自定义内容，组件使用有限轮次的保守结果，不承诺任意非单调 renderer 的唯一解。

## 滚动与两侧提示

<ClientOnly><VaporDemo example="overflowList/Scroll.vapor" /></ClientOnly>

`renderMode="scroll"` 渲染全部项目，以内部滚动容器为观察根。`threshold` 默认 0.75，控制交叉观察回调阈值；可见状态来自 entry.isIntersecting，不能将它等同于交叉比例大于阈值。有效观察批次先通知 `onVisibleStateChange`，参数是新的 `Map<string, boolean>`；随后通知 `onIntersect`，参数是以字符串 key 为键的该批 entry 记录。这一顺序是原生适配差异，与固定上游 React 路径不同。滚动模式不发送折叠模式的 onOverflow。

raw 滚动 overflowRenderer 输入是 `[起始侧溢出项, 结束侧溢出项]`，输出也须是两个内容位置。以下 TSX 使用 callback：

```tsx
<OverflowList
  renderMode="scroll"
  items={[
    { key: "a", label: "A" },
    { key: "b", label: "B" },
  ]}
  itemKey="key"
  visibleItemRenderer={(item) => <button>{String(item.label)}</button>}
  overflowRenderer={([before, after]) => [
    before.length ? <span>前面还有 {before.length} 项</span> : null,
    after.length ? <span>后面还有 {after.length} 项</span> : null,
  ]}
/>
```

滚动原生内容使用两个命名 slot：`overflowStart(scope)`、`overflowEnd(scope)`，分别通过只读实时 getter `scope.items` 接收本侧的一维溢出数组，各自返回同步原生内容。它们是 Vue 所有权所需的适配扩展，不是固定上游属性；每侧由真正的原生 outlet 管理，以支持动态 slot 与普通 Vue interop。没有滚动 `overflow` slot，不能返回 tuple 后再拆分 slot 的原生渲染结果。raw `overflowRenderer` 仍保留上面的二维参数与两份返回。

滚动 raw renderer 的两份返回内容属于同一个当前分支的资源 scope。只有某侧没有命名 slot、需要 fallback 时才调用 raw callback，同一 pair 分支只调用一次；双侧命名 slot 都存在时不会调用 raw callback。两份 raw 内容各有一个原生 div 载体，设置 `display: contents`，自身不产生布局盒但仍是实际 DOM 祖先；与固定上游相比，raw 返回内容的 DOM 层级多了这一层。

动态 slot 覆写一侧时，该侧 raw 载体离开文档，raw pair 的资源与响应性仍由共同 owner 保留，不能把它当作该侧已经独立卸载。另一侧保留 DOM 身份、点击与响应性；移除覆写 slot 后，原 live 载体重新插入。renderer/items 变化导致 pair 分支重建，或组件卸载时，才共同释放该 pair。这里管理的是当前分支创建的原生内容与资源，不预执行 slot，不检查或缓存 VNode，也不复用已经处置的渲染分支。

滚动溢出项根据第一个和最后一个可见项分区，中间不可见孔洞不加入边缘溢出。暂时全部不可见时沿用已有边缘结果；仅垂直位置变化导致的全不可见通知不更新状态。`overflowRenderDirection="both"` 将两份提示放在滚动容器两侧，`start` 将两份都放起始侧，`end` 将两份都放结束侧；它改变提示位置，不改变二维输入。

`itemKey` 的字符串/数字路径采用锁定 es-toolkit 1.39.10 的 get 兼容语义：直属同名属性优先、缺失或 undefined 回退下标，0 与空串属性名按固定上游回退 key。函数返回值直接作为 key，滚动观察将 key 转为字符串，因此数字 1 和字符串 "1" 不能同时使用。

每个滚动项目有私有包装元素，统一承载 data-scrollkey 与观察目标；业务 renderer 可以返回多根内容。滚动导航按钮由示例自行操作真实原生容器，组件没有 scrollTo 或其他公开 ref 方法。

## 主题、方向与可访问性

<ClientOnly><VaporDemo example="overflowList/Theme.vapor" /></ClientOnly>

固定主题样式控制列表布局；业务内容的背景、边框和按钮由调用者定义。组件继承真实 DOM 的方向，支持 RTL 与窄屏尺寸重新测量。组件不添加列表角色、键盘协议、选择状态或焦点转移；业务需为自身按钮和导航提供合适语义。临时隐藏的测量项目使用 inert 与 aria-hidden，稳定后不存在残留测量 DOM。

## API

可选属性接受显式 undefined；省略、undefined 与动态移除回到实例捕获的有效默认值。全局配置通过[上下文与默认配置](../guide/context.md)设置，新配置只影响新实例。

| 属性                    | 类型                                                         | 默认值     | 说明                                                                         |
| ----------------------- | ------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------- |
| items                   | OverflowItem[]                                               | []         | `Record<string, unknown>` 项目数组；空列表安全渲染                           |
| renderMode              | 'collapse' \| 'scroll'                                       | 'collapse' | 折叠或滚动                                                                   |
| collapseFrom            | 'start' \| 'end'                                             | 'end'      | 折叠方向，仅 collapse                                                        |
| minVisibleItems         | number                                                       | 0          | 非负有限数向下取整并约束到 0…items.length                                    |
| visibleItemRenderer     | (item, index) => OverflowRenderResult                        | 空内容     | 项目同步原生内容                                                             |
| overflowRenderer        | (items) => OverflowRenderResult                              | 空内容     | collapse 一维输入；scroll 二维输入与两份输出                                 |
| itemKey                 | string \| number \| ((item) => string \| number)             | 无         | 属性路径/函数；直属同名属性优先于深路径，值 undefined 回退下标；需稳定、唯一 |
| className               | string                                                       | 无         | 追加根类                                                                     |
| class                   | Vue 原生 class                                               | 无         | 与内置类、className 合并                                                     |
| style                   | Vue StyleValue                                               | 无         | 根样式，collapse 内部 maxWidth/测量 visibility 最后应用                      |
| wrapperClassName        | string                                                       | 无         | 滚动容器追加类                                                               |
| wrapperStyle            | Vue StyleValue                                               | 无         | 滚动容器样式，覆盖内部默认布局样式                                           |
| threshold               | number                                                       | 0.75       | 0…1 的有限数，仅 scroll                                                      |
| overflowRenderDirection | 'both' \| 'start' \| 'end'                                   | 'both'     | 滚动两份溢出内容的位置                                                       |
| onOverflow              | (items: OverflowItem[]) => void                              | 无         | 折叠位置变化通知                                                             |
| onIntersect             | (entries: Record<string, IntersectionObserverEntry>) => void | 无         | 滚动交叉观察通知                                                             |
| onVisibleStateChange    | (state: Map<string, boolean>) => void                        | 无         | 滚动可见状态通知                                                             |

根与子路径公开类型为 OverflowItem、OverflowKey、OverflowRenderResult、OverflowListProps、OverflowListBaseProps、OverflowListCollapseProps、OverflowListScrollProps、OverflowListSlots、OverflowListCollapseSlots、OverflowListScrollSlots；不导出 React IntersectionObserver 包装或内部状态类型。

named slots：所有模式都有 `visibleItem(scope)`，通过 scope.item/index 读取当前值；collapse 使用 `overflow(scope)`，scope.items 是一维折叠数组；scroll 使用 `overflowStart(scope)` 与 `overflowEnd(scope)`，scope.items 分别是本侧一维溢出数组。各 slot 优先于对应 renderer 内容，各自返回 VaporRenderResult 或空值；scroll 的 raw overflowRenderer 保留二维输入与恰好两份输出。没有默认 slot、静态子组件或公开 expose；保留 `OverflowList.__SemiComponentName__ = 'OverflowList'`。

HTML attrs 与原生事件应用于根 div，根类名为 semi-overflow-list；innerHTML、textContent、children 和非契约的内部属性被过滤。非法运行时枚举、非数组 items、非对象项目、重复/不合法 key、非有限数字或越界 threshold 被拒绝，避免不稳定布局和资源分配。

## 上游差异与验证范围

固定来源为 Semi Design 2.103.0、提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的完整 OverflowList 实现、IntersectionObserver 包装、中文文档、Foundation 逻辑和 SCSS。使用既有 G10 尺寸观察与调度工具，不导入 React/lodash 运行时或扩展 Foundation 补丁。维护与完成度见[上游对齐与完成度](../guide/upstream-matrix.md)。

明确差异包括安全空列表、最小项数归一化、统一 key、原生 attrs、滚动项目包装、滚动 raw renderer 二维类型修正、滚动双命名原生 slot、raw pair 共同资源所有权与 display:contents 载体、全量候选测量替代宽度启发式、有限测量收敛与精确清理。卸载取消调度、观察、字体和 DOM 订阅，不通知旧任务。document、realm 与 ref 支持沿用现有 DOM 工具边界。

网站与纯 Vapor harness 分别提供开发/生产浏览器断言，覆盖真实几何、动态字体、折叠方向、最小项数、滚动两侧、交互、卸载、明暗、RTL 和窄屏。截图用于有限范围人工查看，不声明完整像素一致。组件为 ClientOnly，不声明 SSR、水合或 CJS；纯 Vapor 与普通 Vue interop 验证分开，独立 TSX 编译器严格 peer 限制见[兼容边界](../guide/compatibility.md)。
