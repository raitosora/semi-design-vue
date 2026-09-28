# Tooltip 文字提示

Tooltip 在悬停、聚焦、点击或右键时提供补充说明。提示不应包含理解按钮所必需的唯一标签；触发元素仍需可见文字或无障碍名称。它是公开 Tooltip 组件，不表示 Popover 等其他浮层组件已经实现。

## 导入与样式

```tsx
import { Tooltip } from "semi-ui-vue";
import TooltipFromPath from "semi-ui-vue/tooltip";
import type {
  TooltipProps,
  TooltipSlots,
  TooltipInstance,
  Position,
} from "semi-ui-vue/tooltip";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/tooltip.css";
```

根浏览器入口具名导出 Tooltip；子路径提供默认与具名组件，以及 `Trigger`、`Position`、`ArrowBounding`、`RenderContentProps`、`RenderContent`、`TooltipPrimitive`、`TooltipNativeRef`、`TooltipProps`、`TooltipTriggerScope`、`TooltipTriggerProps`、`TooltipSlots`、`TooltipInstance` 类型。完整样式可使用 `semi-ui-vue/styles.css`。组件没有静态子组件。当前包与运行时边界见[本地产物与消费](../guide/packages.md)；主题来源与按需入口见[安装与样式](../guide/styles.md)。

## 原生目标与全部定位

`TooltipNativeRef` 的 `Element | null` 是锁定 JSX callback ref 的入口类型；`triggerRef` / `getTriggerRef` 实际仅接受创建 Tooltip 的当前 document、当前 realm 的 HTMLElement 及 null。SVG、MathML、组件实例和其他 document/realm 元素不属于支持目标；需要时使用当前环境中的显式 HTML 外层。

<ClientOnly><VaporDemo example="tooltip/Basic.vapor" /></ClientOnly>

Tooltip **没有默认包装根**。default slot 接收 scope，将 `scope.triggerRef` 绑定到原生 button/span 等元素，并把 `scope.triggerProps` 显式展开到同一目标。`scope.attrs` 是调用方未被声明为 prop 的 attrs，需要显式放在选定原生元素上；没有自动继承到弹层或默认 slot 的行为。`triggerProps` 的类型为 `TooltipTriggerProps`，公开事件字段是可选函数，使用 `?.` 调用；调用方自己的属性和监听器应明确组合，避免后续 spread 覆盖内部监听。例如自己的 `onClick` 需要依次调用 `scope.triggerProps.onClick`（若存在）与业务处理函数，不能直接覆盖前者；`scope.attrs` 中同名原生事件也需按业务组合。这里只阻止或保留 DOM 传播，不把业务返回值当作组件状态决策。为兼容锁定 RC2 JSX 事件命名空间，这些 handler 参数声明为原生事件共同字段的 Pick：鼠标为 button/buttons/clientX/clientY 与修饰键，focus 为 relatedTarget，键盘为 key/code/repeat 与修饰键，均含 type/target/currentTarget/defaultPrevented/preventDefault/stopPropagation。运行时仍转发完整浏览器原生 Event，但公开类型不保证访问完整 MouseEvent/FocusEvent/KeyboardEvent 成员。手工组合只转发实际浏览器事件，不传拼接对象；onClickOutSide/onEscKeyDown 的组件回调仍声明完整 PointerEvent/KeyboardEvent。

```tsx
<Tooltip content="保存当前编辑内容" wrapperId="editor-save-tip">
  {(scope) => (
    <button
      {...scope.attrs}
      {...scope.triggerProps}
      ref={scope.triggerRef}
      type="button"
    >
      保存
    </button>
  )}
</Tooltip>
```

示例覆盖上游文档的十二种方向 `top/topLeft/topRight/left/leftTop/leftBottom/right/rightTop/rightBottom/bottom/bottomLeft/bottomRight`，以及公开 Position 类型中的 `leftTopOver/rightTopOver/leftBottomOver/rightBottomOver`。方向为物理方位；RTL 不把 left/right 自动改名。`autoAdjustOverflow` 可根据视口与容器空间翻转或调整最终位置；查看弹层 `x-placement` 获取实际结果。`spacing` 控制两轴间距，`margin` 参与边界计算；它们不等同于用户 `style` 的 margin。

## 五种触发、可见性与延迟

<ClientOnly><VaporDemo example="tooltip/Triggers.vapor" /></ClientOnly>

- `hover` 为默认，同时支持鼠标悬停与聚焦；`disableFocusListener` 只禁用这个模式的 focus/blur。
- `focus` 通过焦点显示/隐藏；`click` 点击显示，外部指针关闭；`contextMenu` 右键显示并阻止该事件的原生菜单。
- `custom` 完全由 `visible` 驱动。点击目标、外部指针与 Escape 不直接修改 visible；外部与 Escape 回调只通知，业务可在回调中更新自己的状态。

`visible` 没有默认值，也没有 `defaultVisible`。对于非 custom 模式，`visible=false` 不是拒绝所有自动触发的开关，内部触发仍可打开；需要只由父级控制时使用 `trigger="custom"`。改变 visible 值会请求显示/隐藏；显式 undefined 与缺失均不构成 custom 的 true。非 custom 转 custom 后以当前 visible 驱动，回到自动触发模式继续使用当前内部状态及后续触发。命名 `v-model:visible` 对应 `visible` 与 `onUpdate:visible`，不使用 `modelValue`。

`onVisibleChange` 与 `onUpdate:visible` 是通知，不按返回值接受或拒绝状态。true 在布局定位完成后通知，false 在请求关闭时通知；渲染保留到动画退出结束。`condition=false` 只阻止自动触发显示，不主动关闭已经打开的提示，也不阻止 custom 或显式 visible 请求；不要把它当成 disabled 属性。Tooltip 没有公开 disabled 属性。condition 在自动触发事件发生时判定；已经排队的进入延迟不会因为随后改为 false 自动取消，延迟完成仍可打开。需要取消既有任务时应使用对应关闭/模式切换路径。

延迟单位为毫秒，默认进入/离开均 50；0 立即执行。延迟只在相应触发路径中使用，不能把 custom 的 visible 更新理解为延迟开关。尚未执行的旧任务在取消、切换目标与卸载时失效。鼠标悬停测试需要真实 `:hover`，仅合成 mouseenter 不能代替浏览器交互。

## 动态内容、容器与多根

<ClientOnly><VaporDemo example="tooltip/Advanced.vapor" /></ClientOnly>

`initialFocusRef` 只绑定 content 中的可聚焦 HTMLElement（button/input 或有合适 tabindex 的 HTML 元素），由调用方保证属于当前 document/realm。`Element | null` 签名不扩大 SVG、MathML 或组件实例支持，也不保证任意 HTML 节点能够取得焦点。

复杂内容使用 content slot，优先于 content prop。slot 的 `scope.initialFocusRef` 是**原生元素 callback ref**，绑定到希望初始聚焦的元素。content 函数 prop 只返回字符串、数值、布尔、null 或 undefined；节点、Fragment、子组件应放在 slot，避免向函数 prop 传 ReactNode。原生内容不是 HTML 字符串解析器：`content='<img ...>'` 按文本显示，0 显示为文本，null/undefined/布尔不生成文本；空内容不等于自动禁用触发。

多根 default slot 对每个原生根使用稳定的 `scope.getTriggerRef(key)`，并分别展开 triggerProps。key 必须在该 Tooltip 内唯一、稳定；当前触发的有效根作为定位锚点，没有当前触发根时使用首个登记根。跨根移动按同一触发区域处理，不从 Fragment、VNode、`$el` 或 DOM 扫描推断根。单根使用 triggerRef 即可。不要解构会动态变化的 slot 字段，使用 `scope.triggerProps`、`scope.placement.value` 等属性访问，遵循[API 与类型约定](../guide/api-contracts.md)。

禁用原生 button 不接收正常交互，因此使用显式 span 接收 ref、triggerProps 和 attrs，内部 disabled button 使用 `pointer-events: none`；span 需要可聚焦提示时，按业务提供合适的 tabindex 与名称。`wrapWhenSpecial` 保留上游兼容字段，但不检查 slot 返回值或自动发现 disabled/loading 子组件，也不自动创建 span。`wrapperClassName` 请显式放到这个业务 wrapper；它不转为弹层 class。

`getPopupContainer` 的优先级是实例 resolver、ConfigProvider 容器、当前创建 document 的 body。有效的动态 resolver 更新可迁移同一个弹层并保留内容状态；容器必须与目标处于受支持的创建 document。裸 DOM 工具跨 document 能力不等于 Vapor 渲染器跨 realm 能力，foreign document 目标/容器不会被当作完整 iframe 支持。resolver 应返回真实 HTMLElement，不能返回 null 或已卸载节点。Tooltip 不锁页面滚动；preventScroll 仅传给焦点方法。

首次插入先离屏测量，真实非零尺寸之后再定位显示。内容尺寸、容器滚动、窗口变化、`rePosKey` 更新会重新定位；`rePosition()` 也可手动请求。隐藏到保留 DOM 的重新打开会恢复测量。arrow slot 自定义箭头视觉，`arrowBounding` 仍独立控制几何，不从自定义节点反推大小。

嵌套示例使用两个真实 Tooltip。外层不会因点击自己的内部目标而关闭，点外与 Escape 由顶层协调；组件退出时保持对应层直到完成清理。不要用未交付的公共浮层组件替代本示例。

## 明暗、RTL、窄屏与溢出

<ClientOnly><VaporDemo example="tooltip/Theme.vapor" /></ClientOnly>

主题 token 从弹层**实际所在容器**继承。局部深色或 dir 容器中的目标，若弹层挂到 body，不能假设局部样式自动跟过去；示例把弹层挂到同一个主题容器。长文本按固定样式换行，最大宽度默认 240px；可使用弹层 style 改宽度。窄屏和滚动容器仍需业务安排触发元素布局，不保证任意尺寸提示永不溢出。prefixCls 改名不会生成相应主题 CSS；content 与动画类仍沿用固定上游类名。

## API

调用点移除属性或显式 undefined 恢复初始化得到的有效默认值。默认值由内置配置和实例创建时的全局 Tooltip 默认配置合并；全局 own undefined 与调用点 undefined 不同：例如全局 motion/showArrow 为 undefined 保持 falsy，而 position 是定位与 arrow slot 所需字段；全局将 position 清空会抛 TypeError，不自动补 top，动态清空同样终止并清理资源。不要用全局 undefined 删除必要定位字段。组件属性为只读输入，复杂对象请整体替换。布尔 false、数值 0 与空字符串不会作为缺失属性丢弃；它们是否适合字段仍由该字段语义决定，例如 content 空串渲染为空文本，spacing=0 保留零间距。null 仅是 content 的公开空值；不要给其他非 nullable 字段传 null。

| 属性                   | 类型                                                                                             | 默认值                                             | 说明                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `content`              | `TooltipPrimitive \| RenderContent`                                                              | 无                                                 | 文本/primitive，或 `(scope: RenderContentProps) => TooltipPrimitive`；content slot 优先 |
| `trigger`              | `Trigger`                                                                                        | `'hover'`                                          | hover / focus / click / custom / contextMenu                                            |
| `visible`              | `boolean`                                                                                        | 无                                                 | custom 的唯一可见性来源；其他触发不作为一般 veto                                        |
| `condition`            | `boolean`                                                                                        | `true`                                             | false 阻止自动触发打开                                                                  |
| `position`             | `Position`                                                                                       | `'top'`                                            | 十六种物理定位                                                                          |
| `autoAdjustOverflow`   | `boolean`                                                                                        | `true`                                             | 根据容器与视口调整                                                                      |
| `spacing`              | `number \| { x: number; y: number }`                                                             | `8`                                                | 0 保留，完整两轴对象                                                                    |
| `margin`               | `number \| { marginLeft: number; marginTop: number; marginRight: number; marginBottom: number }` | `0`                                                | 完整四边对象；溢出判定边距                                                              |
| `arrowBounding`        | `ArrowBounding`                                                                                  | `{ offsetX: 0, offsetY: 2, width: 24, height: 7 }` | 箭头几何，四字段均可选                                                                  |
| `showArrow`            | `boolean`                                                                                        | `true`                                             | 是否显示箭头；自定义节点使用 arrow slot                                                 |
| `arrowPointAtCenter`   | `boolean`                                                                                        | `true`                                             | 箭头指向锚点中心                                                                        |
| `transformFromCenter`  | `boolean`                                                                                        | `true`                                             | 按锚点中心计算变换原点                                                                  |
| `mouseEnterDelay`      | `number`                                                                                         | `50`                                               | 进入延迟，毫秒                                                                          |
| `mouseLeaveDelay`      | `number`                                                                                         | `50`                                               | 离开延迟，毫秒                                                                          |
| `motion`               | `boolean`                                                                                        | `true`                                             | 进入/退出 CSS 动画，系统 reduced-motion 由生命周期处理                                  |
| `keepDOM`              | `boolean`                                                                                        | `false`                                            | 首次打开后关闭保留隐藏 DOM；不预挂载从未打开的内容                                      |
| `getPopupContainer`    | `() => HTMLElement`                                                                              | 无                                                 | 显式 resolver 优先；否则 context → body                                                 |
| `class`                | `HTMLAttributes["class"]`                                                                        | 无                                                 | Vue class 主入口，弹层 wrapper，与 className 和内部类合并                               |
| `className`            | `string`                                                                                         | 无                                                 | 弹层 wrapper 的 string alias，与 class 和内部类合并                                     |
| `style`                | `CSSProperties`                                                                                  | 无                                                 | 弹层 wrapper 样式，不直接覆盖 portal-inner 的定位结果                                   |
| `prefixCls`            | `string`                                                                                         | `'semi-tooltip'`                                   | wrapper/箭头前缀；不能自动生成定制 CSS                                                  |
| `zIndex`               | `number`                                                                                         | `1060`                                             | Portal 层级                                                                             |
| `rePosKey`             | `string \| number`                                                                               | 无                                                 | 变化时重算位置                                                                          |
| `wrapperId`            | `string`                                                                                         | 自动申请                                           | 显式稳定 ID；缺省需祖先提供 `provideAriaIdScope(prefix)`                                |
| `wrapperClassName`     | `string`                                                                                         | 无                                                 | 上游特殊 wrapper 字段，本版由调用方显式施加                                             |
| `wrapWhenSpecial`      | `boolean`                                                                                        | `true`                                             | 兼容字段；Vapor 不做 slot/DOM 自动探测或包装                                            |
| `clickToHide`          | `boolean`                                                                                        | 无（文档约定 false）                               | 点击弹层关闭，随后悬停缓存避免立即重开                                                  |
| `clickTriggerToHide`   | `boolean`                                                                                        | 无                                                 | 上游类型公开的兼容字段，重复点击目标可进入 outside 关闭路径                             |
| `stopPropagation`      | `boolean`                                                                                        | 无（文档约定 false）                               | 弹层 click/mousedown/focus/blur 阻止冒泡，不关闭同节点用户事件                          |
| `role`                 | `string`                                                                                         | `'tooltip'`                                        | tooltip 描述关联；dialog 可使用同外壳 ARIA，不表示 Popover 交付                         |
| `closeOnEsc`           | `boolean`                                                                                        | `false`                                            | 启用 Escape 通知/自动触发模式关闭                                                       |
| `guardFocus`           | `boolean`                                                                                        | `false`                                            | 可选焦点约束，不默认开启                                                                |
| `returnFocusOnClose`   | `boolean`                                                                                        | `false`                                            | 按关闭语义恢复可用目标焦点；custom 由业务协调                                           |
| `disableArrowKeyDown`  | `boolean`                                                                                        | `false`                                            | 不使用目标上下箭头转移焦点                                                              |
| `disableFocusListener` | `boolean`                                                                                        | `false`                                            | 禁用 hover 的 focus/blur 监听                                                           |
| `preventScroll`        | `boolean`                                                                                        | 无                                                 | focus 的 preventScroll；不等于滚动锁                                                    |

### 事件与回调

| 字段               | 参数顺序                 | 返回值与时机                                             |
| ------------------ | ------------------------ | -------------------------------------------------------- |
| `onVisibleChange`  | `(visible: boolean)`     | `void`；定位完成后的 true，关闭请求的 false；不拦截状态  |
| `onUpdate:visible` | `(visible: boolean)`     | `void`；命名 model 的请求通知，与 visible 回调同来源     |
| `onClickOutSide`   | `(event: PointerEvent)`  | `void`；原拼写 OutSide；capture pointerdown 点外通知     |
| `onEscKeyDown`     | `(event: KeyboardEvent)` | `void`；原生 Escape；custom 只通知                       |
| `afterClose`       | `()`                     | `void`；退出完成后一次，取消退出或强制卸载不当成正常完成 |

`stopPropagation` 作用于弹层的 click、mousedown、focusin/focusout，不自动阻止触发器事件，也不是 stopImmediatePropagation，不取消同节点内容自己的监听。上游 onClickOutSide 是 MouseEvent/window mousedown；本版复用 ownerDocument capture pointerdown，支持公开 composedPath 与多根、触控/笔，并在顶层仲裁后通知。这是明确的事件类型与时序差异，不会额外重复通知 mousedown。回调不是 Promise 决策接口；返回 false/Promise 不会阻止操作。同一通知来源使用同函数的 listener 去重，不把不同事件合并成一个通知。

### Slots、attrs 与 ref

| 接口             | 参数                                     | 用法                                                                                                                     |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `default`        | `TooltipTriggerScope`                    | `triggerRef` 单根、`getTriggerRef(key)` 多根、`triggerProps` 事件/ARIA/tabIndex/data-popupid、`attrs` 调用方原生目标属性 |
| `content`        | `RenderContentProps`                     | `initialFocusRef: (element: Element \| null) => void`；原生节点/Fragment/子组件                                          |
| `arrow`          | `{ placement: Readonly<Ref<Position>> }` | 用 `scope.placement.value` 读取当前方向，配合 arrowBounding                                                              |
| `focusTrigger()` | 无                                       | `void`；按 returnFocusOnClose 与 custom 模式规则聚焦可用目标                                                             |
| `rePosition()`   | 无                                       | `Record<string, string \| number>`；Foundation 当前定位结果；没有可测目标时不保证有位置                                  |
| `getPopupId()`   | 无                                       | `string`；当前弹层 ID，用于关联检查                                                                                      |

缺省 ID 使用既有[DOM 工具](../guide/dom.md)的 `provideAriaIdScope`：在应用根 setup 中提供明确、不同应用不重复的 prefix；显式 wrapperId 不需要该 scope。示例全部提供独立 ID。`wrapperId=""` 保留空串，不会自动申请 ID；调用方应提供有效、唯一的非空 ID。动态 ID 同样必须保持关联有效且不与其他组件重复，不支持 SSR ID 水合承诺。普通 `Ref<TooltipInstance | null>` 可使用公开方法；JSX ref 属性 shape 的工具链限制见[兼容边界](../guide/compatibility.md)，不通过 `$el` 获取原生节点。

`class/className/style` 明确属于弹层；class 支持 Vue 的字符串、数组和对象形式，并与 className、内部 class 合并，不包含在 scope.attrs 中。调用方传 `id/data-*/aria-*/原生事件` 放到 scope.attrs，并由调用方选定目标。原生目标 class/style 请直接在 default slot 设置；不要用 Tooltip 的弹层 style 代替目标样式。多根 attrs 不自动复制全部根，避免重复 id。自定义 ARIA 应在内部 triggerProps 后显式设置，用户负责保持关联一致。

## 无障碍、焦点与清理

默认 role=tooltip，触发器 `aria-describedby` 指向 wrapperId；dialog 模式使用 expanded/haspopup/controls。`triggerProps` 提供 `tabIndex: 0`，显式展开后 span 也进入顺序键盘导航；业务需要不同顺序时在 spread 后设置 tabindex。弹层 inner 为 tabindex=-1，默认箭头 aria-hidden；不能为 disabled button 恢复点击能力。上下箭头可将焦点转向已插入内容；关闭与返回焦点只恢复仍 connected、可见、可用的目标。Tooltip 默认不启用 Escape 关闭、焦点圈定或焦点恢复，按具体内容需求配置。Escape 交给共享浮层顶层仲裁：默认 closeOnEsc=false 时不 preventDefault 或 stopPropagation；启用后，目标业务监听器提前 preventDefault 会阻止共享层关闭，stopPropagation 会使 document 无法收到该事件并保留弹层。这不同于直接执行上游 trigger keydown 的默认 Escape 阻止行为。custom 模式仍只通知。

`visible` 表示请求，退出期间 DOM 仍保留。keepDOM 隐藏层不得继续接收焦点/点外仲裁；正常退出完成才 afterClose。快速开关使旧完成失效，卸载立即释放 timer/observer/RAF/监听与 Portal，不伪造 afterClose。滚动容器和影子根只使用浏览器公开的根与事件路径，不推断 closed shadow/slot 内部。

## 验证与来源

真实文档开发/生产检查位于 `website/tests/tooltip.spec.ts`，纯 Vapor 开发/生产位于 `tests/e2e/tooltip.spec.ts`；覆盖触发、ARIA、全部方向、真实几何、动态内容与容器、禁用、多根、嵌套、明暗/RTL/窄屏和溢出。截图用于人工查看，不声明完整像素一致。文档 ClientOnly 不代表组件 SSR/水合支持，普通 Vue interop 与纯 Vapor 消费证据分开。完整限制见[兼容边界](../guide/compatibility.md)。

契约与样式固定来自 Semi Design 2.103.0 提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 Tooltip/箭头源码、完整中文文档及 Tooltip Foundation/SCSS。复用已审阅 Foundation 的定位与状态逻辑，连接[Foundation 桥接](../guide/foundation.md)、[浮层容器](../guide/overlay.md)和[动画生命周期](../guide/animation.md)。Vapor 显式原生 ref/slot、primitive render callback、arrow slot、pointerdown 点外和快速反转清理是已说明的适配差异；不克隆 VNode、不检查 slot 内容、不扩展到其他组件。[上游对齐与完成度](../guide/upstream-matrix.md)登记公共组件、类型及接受状态。
