# API 与类型约定

Semi Design Vue 使用原生 Vapor 模式。下面规定公共 API 的实现与消费方式，运行示例是协议夹具，不是已交付的 Input、Select 或 Form。当前包均为 private；未来发布统一使用 `@raitosora` scope，现阶段不提供 npm 安装承诺。

## React → Vapor 映射

| React / Semi API                                     | Vue / Vapor 约定                                                          | 差异与替代                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `value` / `checked` / `visible`                      | 保留原字段，分别配对 `update:value` / `update:checked` / `update:visible` | 不统一重命名为 `modelValue`。本页实际验证 `value`，其余字段须随组件验收                 |
| `defaultValue` / `defaultChecked` / `defaultVisible` | 初次 setup 的非受控快照                                                   | 后续 default\* 更新不重置；明确传入 `undefined` 仍为受控                                |
| `onChange(value, event)`                             | TSX `onChange`；通知没有可依赖的返回值                                    | 参数以组件表为准，浏览器事件为原生 Event，没有 React `persist()` / `nativeEvent`        |
| 返回 false / Promise 的回调                          | 保留具名函数 prop，直接调用并传回其返回值                                 | 不通过 `emit` 获取结果；emit 返回 `undefined`。异步取消、并发、卸载时序需各组件单独验收 |
| ReactNode / children / renderX                       | 明确命名的 slot 或 render callback                                        | slot children 是函数或函数映射；不遍历、克隆 VNode，不预调用 slot 判断内容              |
| `ref` / imperative handle                            | 显式 `defineExpose` + `Ref<公开接口 \| null>`                             | 无 `$el` / `$props` / React instance。JSX ref 属性的 shape 检查仍宽松                   |
| `className`                                          | 兼容字符串别名；Vue `class` 为主入口，两者与内部 class 合并               | Vue `class` 接受数组/对象；不将 className 原样写到 DOM                                  |
| rest props / native listeners                        | `inheritAttrs: false`，按组件确定的 DOM 目标显式转发                      | 多根组件、内部回调、受控值不得盲目透传                                                  |
| `Parent.Child`                                       | 同时提供具名子组件和指向同一实现的静态属性                                | 初始化新组件对象时附加；不复制已有组件丢失构造类型，不在使用中修改静态属性              |
| 泛型数据与回调                                       | 同一个 `T` 关联 items/value/event，必要时显式 `<T>`                       | 用 `NoInfer<T>` 防止 value 扩大数据类型；不以 `any` / 断言恢复已丢失的关联              |
| Form 包装 / children 注入                            | 可选 `FieldContext<T>` 与控件注册协议                                     | 基础控件可独立使用，不导入完整 Form；未实现表单引擎                                     |

静态子组件是否另有根具名导出以固定上游为准。[Layout](../components/layout.md) 仅在根入口导出 `Layout` 值，四个子组件通过 `Layout.Header`、`Layout.Footer`、`Layout.Content`、`Layout.Sider` 使用；`semi-ui-vue/layout` 导出 Layout 与上游命名类型。不能从通用协议夹具推断 `Header` 等是根具名导出。

[Skeleton](../components/skeleton.md) 同样只在根入口导出 `Skeleton` 值。Avatar、Title、Button、Paragraph、Image 占位组件通过 `Skeleton.Avatar` 等静态成员使用；它们不构成同名公共产品组件，也不是根入口的独立具名导出。`semi-ui-vue/skeleton` 提供 Skeleton 默认与具名值，以及该族的 Props/Slots 类型。

## 属性存在性与默认值

包根入口提供 `hasProvidedProp(source, key)`，实现为 `Object.hasOwn`。它接收调用方尚未归一化的属性对象，或 Vue 公开的 `useAttrs()` 结果。**不能把已声明的 props 对象传给它当作调用方存在性证据**：锁定的 Vapor 版本会让声明键始终存在。

需要检测的受控字段（示例中的 `value`）保持在 attrs 边界，**不加入运行时 `props` 声明**；类型接口仍声明 `value`。`defaultValue` 等字段正常声明。每次响应式读取时检测存在性并读取 attrs 值，不能在 setup 中展开 attrs 为快照。业务类型在该边界验证，不用类型断言把任意 attrs 值当作正确输入。

| 调用方输入                    | `hasProvidedProp(attrs, 'value')` | 有效值                         |
| ----------------------------- | --------------------------------- | ------------------------------ |
| 缺失 value，有 defaultValue   | false                             | 首次 defaultValue 或后续本地值 |
| `value={undefined}`           | true                              | undefined，不回退默认值        |
| `value={false}`               | true                              | false                          |
| `value={0}`                   | true                              | 0                              |
| `value=""`                    | true                              | 空字符串                       |
| 动态 spread 增加 / 删除 value | 随实际键变化                      | 按当前模式选择                 |

这是锁定 Vue `3.6.0-rc.9` / vue-jsx `3.3.0-rc.2` 下验证的模式。Vue 保留的 key/ref 和已声明 emits 对应 listener 不属于普通 attrs，不适用此检测方式。键按 attrs 中的实际拼写处理；例如未声明的 `activeKey` 与 `active-key` 不自动视为同一键，复合名称组件须明确规范化并测试冲突顺序。

根入口的 `useControllableValue<T>` 接收三个 getter：`isControlled`、`value`、`defaultValue`，返回只读 computed `controlled`、`value` 与 `setValue(next)`。它只选择和保存状态，不派发事件、不运行异步钩子、不修改调用方对象。

- 非受控时 `setValue` 更新本地值；defaultValue 只在初始化读取一次。
- 受控时 `setValue` 不改变有效值。组件仍通知一次 update 和一次业务 change，父级回传后才改变显示。
- 非受控 → 受控：读取父级值。受控 → 非受控：恢复最后的本地值（未曾编辑则为初始 defaultValue）；不隐式复制最后一个受控值。需要不同策略的组件必须在自己的 API 页明示。
- 没有回传的受控输入必须保持父级决定的显示；本夹具在 input 通知后还原父级决定的 DOM 值。IME、光标保持和完整输入控件行为仍须随具体组件验收。

<ClientOnly>
  <VaporDemo example="contracts/Protocol.vapor" />
</ClientOnly>

## 事件、回调和命名 v-model

TSX 写法为 `<Example v-model:value={value.value} />`，等价于 `value` + `onUpdate:value`。同一更新通知只选择一种派发机制：通过声明的 emit，或者直接调用声明的函数 prop。不得对同名通知两者都调用，也不得把内部 listener 再透传到根 DOM。

示例选择 emit：先写非受控本地状态，再派发 `update:value`，最后 `change(value, nativeEvent)`。Vue 负责合并多个 TSX spread 的监听器；同一事件重复出现的同一个函数只调用一次。一个用户输入各调用一次。更新通知和业务通知是两个不同事件；调用者同时监听两者会分别收到一次，即使传入同一个函数也不跨事件去重。

`DecisionCallback<T>` 返回 `boolean | void | Promise<boolean | void>`，用于需要返回值的钩子。示例公开的 `decide(value)` 原样返回函数结果、Promise 或抛出的错误，不代表已执行控件变更。消费方可 `await` 结果，按具体组件约定解释 false/undefined；拒绝必须交给调用者处理。没有定义统一的 Promise 状态机或所有组件的取消语义。

`ChangeCallback<T, E = Event>` 是通知签名。TypeScript 允许返回值函数赋给 void 回调，不代表库会读取该返回值。vue-jsx 的部分内置 DOM handler 类型仍含合成事件描述；夹具在 handler 边界以 `instanceof Event` 确认真实事件，不向用户虚构 React 事件成员。

## slots 与公开 ref

使用类型化函数映射；具名 slot 的参数必须在 API 表列出。

```tsx
<Protocol v-slots={{ default: (slot) => <p>{String(slot.value)}</p> }} />
```

动态参数在函数体里通过 `slot.value` 访问：当前编译器下 `({ value }) => ...` 在本夹具实测保留首次值，不能宣称这种解构写法支持动态更新。

使用 `const api = ref<ProtocolApi | null>(null)`，只调用声明的 focus/request/decide；卸载后为 null。JSX `ref={错误形状的Ref}` 仍可能被工具链接受。替代做法是先赋给 `Ref<ProtocolApi | null>` 类型变量，让普通 TypeScript 检查，再传入 JSX。源码和生成声明的反例检查这种普通赋值及公开成员；这没有修复 JSX ref 自身限制。

静态子组件通过 `ProtocolGroup.Part` 与具名 `ProtocolPart` 两条路径运行，身份相同。组件不得依赖 slot 返回内容遍历来识别子组件；有协作需求时使用显式数据或注册。

## 泛型

<ClientOnly>
  <VaporDemo example="contracts/Generic.vapor" />
</ClientOnly>

示例的 `GenericChoiceProps<T>` 从 readonly items 推导 T，value 使用 `NoInfer<T>`，onSelect 保持 T。数字数据配字符串 value、错误事件参数、缺少静态子组件必需属性，均有源码和生成声明反例。此证明不扩展为尚未实现的 Table / Select 泛型支持，也不涵盖泛型实例 ref 自动推导。

## 可选字段协议

根入口导出 `FieldContext<T>`、`FieldControl<T>`、`FieldControlRegistration`、`FieldMetadata`、`FieldContextProps<T>` 与 `createFieldContextKey<T>()`。

host 和控件共享同一个 key（工厂每次产生新 key），使用 Vue 公开的 provide/inject。显式 fieldContext 优先于注入；两者都没有时独立运行。metadata 和 value ref 对控件只读；只读是类型约束，不意味着深冻结调用方数据。

控件注册提供 id、只读 value ref 和可选 focus。host 返回幂等 dispose，控件卸载时调用它；旧注册的 dispose 不能移除替换后的新注册。测试验证嵌套 host 隔离、值更新、独立实例、移除及重挂。当前只提供协议和注入键，不提供生产注册表、校验、布局、提交或完整 Form；字段值更改仍通过控件事件交给 host。

## 验证范围

协议示例参与真实 TSX 编译、浏览器交互、源码及生成声明的严格类型正反例、文档开发/生产构建及独立 createVaporApp 消费者。嵌套 JSX 由编译器通用组件分派 helper 处理，独立消费者检查 bundle 无 VDOM renderer/interop，并通过浏览器执行证据确认原生 Vapor 创建路径。简单计数器另有不含该分派 helper 的严格纯产物门禁，两者不混为相同输出形态。库根入口还有 manifest + dist 隔离消费检查。仍不等于完整 tarball 安装、组件 SSR/水合、Firefox/WebKit、真实移动硬件或 Semi 视觉对齐。完整边界见[兼容边界](./compatibility.md)。

相关基础说明：[Vue attrs](https://vuejs.org/guide/components/attrs.html)、[Vue v-model](https://vuejs.org/guide/components/v-model.html)。本页 Vapor 行为以锁定版本的实际夹具为准，不将普通 Vue 文档视为全部 Vapor 支持保证。

## Locale 消费

[LocaleProvider / LocaleConsumer](../components/locale.md) 使用独立的语言上下文。Consumer 的原生 Vapor slot 传递稳定只读 Ref，字段通过 `.value` 动态读取；与 React 四个位置参数的 render callback 不同。slot 返回 JSX 或空 fragment，原始字符串/null 不属于已验证的 Vapor block。Provider 不透传 class/style，无公开 ref 方法、事件或 v-model。

## Spin 的原生内容

[Spin](../components/spin.md) 的 children、indicator 与富文本 tip 使用 default、indicator、tip 原生插槽，返回 VaporRenderResult；字符串需包在元素中，条件空内容可返回空数组。tip 文本属性仅接受 string/number，不接受 React 节点或异步回调。组件只按 slot 键存在性决定包装布局，不调用 slot 检测内容，也不缓存或克隆渲染结果。size、spinning、delay 的显式 undefined 与缺省采用有效默认值；这个组件的默认值规则不等同于 context 字段的显式清空规则。

## Divider 的内容与原生属性

[Divider](../components/divider.md) 仅有函数形式的 default slot；文本放在 fragment 内，原始字符串、VNode 与异步结果不属于 Vapor slot 返回值。水平布局根据已挂载 DOM 分类纯文本、复杂节点与空内容，忽略注释/零长度文本但保留空格和数字 0；不预执行 slot，不遍历或克隆 VNode。垂直布局不挂载 slot，恢复水平时新建内容实例。

其安全 HTML attrs 与原生事件转发到根 div，`innerHTML` / `textContent` 被类型与运行时同时排除，避免覆盖 slot 所有权；role/ARIA 由调用方显式指定。`align` / `layout` 显式 undefined 恢复有效默认值，不适用受控字段的清空协议。根入口只导出组件值，Props/Slots 类型由 divider 子路径提供；没有全局默认配置、静态成员或公开 ref API。

## Grid 的上下文与响应式属性

[Grid](../components/grid.md) 的 Row 与 Col 均只接受函数形式的默认 Vapor slot；Col 需处于 Row 的上下文中。Row 的 gutter 可为数字、固定断点对象或横纵两项数组，Col 的六个响应式尺寸可为数字或含 span/order/offset/push/pull 的对象。缺省与显式 undefined gutter 使用相同默认值；动态更新时内层 Row 的 gutter 不受外层改变影响。根入口只提供 Row/Col 组件值，类型由 grid 子路径提供；无静态子组件或公开命令式 ref。

## Layout 的静态子组件与侧栏协作

[Layout](../components/layout.md) 与 Header/Footer/Content/Sider 都使用无参数默认 Vapor slot。Sider 挂载后向最近 Layout 按实例身份注册，条件移除和多侧栏不会互相误注销；`hasSider={true}` 可显式要求横向，`false` 不压过已注册 Sider。没有受控字段、v-model、自定义折叠事件或公开命令式 ref。当前 Vapor 编译器下，`tagName` 更新更换根元素并重挂 slot 子树，子组件状态与旧焦点会重置，Sider 重新注册；其余类名、样式和侧栏变化保留未移除的节点。当前 vue-jsx Vapor RC2 中，默认 slot 唯一根为裸 `visible && <Layout.Sider>` 的写法有未卸载风险，条件侧栏用 `v-if={visible}`；动态 Sider 列表用 `<For getKey>`，避免注册触发的父级更新与裸 `.map()` 列表互相递归。Sider 的断点仅通知媒体匹配，不自动折叠。

## Skeleton 的占位和真实内容

[Skeleton](../components/skeleton.md) 将固定上游的 `placeholder` 和 `children` ReactNode 改为无参数 `placeholder` 与 `default` Vapor slots。`loading=true` 只挂载占位分支及 Skeleton 根；`false` 只挂载真实内容，切换后分支内状态和焦点不会保留。slot 可返回多根 fragment；组件不探测、克隆或缓存 slot 输出。`active` 仅控制 Foundation CSS 类，动态切换没有 JS 定时器。默认值、子组件尺寸及 Avatar 的 `default` 尺寸源码/样式差异见组件页。

## Highlight 的文本片段

[Highlight](../components/highlight.md) 仅接受七个上游文本/匹配属性。原文与非命中部分为文本节点，命中部分默认 `mark`；`component` 改的是命中标签。无 slots、render callback、事件、ref 或属性透传；容器属性由调用方所有，片段样式由 highlightClassName/highlightStyle 与关键词对象合并。缺省和显式 undefined 恢复默认值，关键词数组中的 undefined 则保留上游 TypeError 边界。私有匹配器按固定 Foundation 的 UTF-16、正则和相邻区间合并规则实现。

## Progress 的格式内容

[Progress](../components/progress.md) 的 format prop 保留同步标量返回；复杂 ReactNode 内容映射到同名原生 scoped slot。slot 的 percent 是只读 Ref，在 TSX 中读取 `.value`；slot 优先且仅在信息可见时渲染。没有 default slot、children、status、事件或 ref API。根为 div，仅接受已声明 id、ARIA、data 和 Vue class / CSSProperties style；role 与数值 ARIA 由组件所有。NaN 与无穷输入、数字动画取消及 SVG 节点复用差异以组件页面为准。ProgressMotion 的对象/函数分支仅提供 opaque 真值迁移，不保留上游 MotionObject 已知键校验，且与上游存在双向类型差异；建议使用 boolean，确切签名及反例见组件页面。

## Tooltip 的显式触发器

[Tooltip](../components/tooltip.md) 的 default scoped slot 提供原生 `triggerRef`、稳定 keyed `getTriggerRef`、`triggerProps` 与 `attrs`，由调用方绑定当前 document/realm 的实际 HTMLElement；入口 `Element | null` 类型不承诺 SVG、MathML、组件实例或跨环境目标支持。content 的 initialFocusRef 同样由调用方绑定可聚焦 HTML 元素，具体边界见组件页。组件不检查子项或添加默认包装；disabled/loading 元素需显式可接收事件的外层。结构化内容使用 content slot，原始值 content callback 不能返回 VNode、对象或异步结果；arrow slot 拥有自定义箭头。默认 ID 需要显式应用 ARIA scope，也可传 wrapperId。

`trigger="custom"` 按 visible 显示，其余模式沿上游自动触发，visible 更新作为外部命令。condition 仅拦截自动显示入口。属性、回调通知、ARIA 覆盖顺序和公开 ref 返回值以组件页的完整契约为准。

## OverflowList 的原生 renderer 与测量

[OverflowList](../components/overflowList.md) 用显式 items 驱动每个拥有原生内容的项目分支，不探测 slot 返回值识别项目。raw callback `visibleItemRenderer(item, index)` 接收当前普通参数；item/index 改变时重建 callback 拥有的子分支，稳定 key 的项目包装元素保留。命名 slot `visibleItem(scope)` 的 item/index 则是只读实时 getter，直接读取 scope.item/index，不解构为快照，也不使用 Ref.value；同 key 的原生子内容保留。各命名 slot 的 scope 属性浅只读，拒绝替换或删除；scope.item 与 scope.items 中的调用者记录保持原对象身份，不深只读、不冻结数组或项目，不应通过 slot 修改输入。两条路径均支持同步 Vapor fragment、多根、条件、For、嵌套及原生元素 ref。`overflowRenderer(items)` 在 collapse 接收一维数组，在 scroll 接收两侧二维数组并返回两份内容。原生 collapse `overflow(scope)` 通过 scope.items 的实时 getter 读取一维折叠项；原生 scroll 改用 `overflowStart(scope)`、`overflowEnd(scope)`，每侧的 scope.items 均为一维溢出项，分别由真正的原生 outlet 管理。滚动双命名 slot 是 Vue 内容所有权的必要适配扩展，不是上游属性；不检查或拆分 slot 渲染结果。slot 优先于对应 renderer；不接受默认 slot、ReactNode、Promise 或 children。

raw renderer 的 `OverflowRenderResult` 支持原生内容、标量与递归数组：字符串/数字规范化为文本，boolean/null/undefined 为空内容。named slots 仅返回 Vue `VaporRenderResult | null | undefined`，原始字符串/数字/boolean 不属于原生 slot block，文本需写在 JSX 文本容器或 fragment 中。Vue JSX 联合类型无法静态区分 Vapor 与 VDOM，不宣称静态拒绝所有 VNode。普通 Vue 宿主的 named slots 可通过 `vaporInteropPlugin` 返回 h() 内容，由 Vue outlet 完成转换；raw renderer 不支持手造 VNode 或 VDOM return-render，纯 Vapor 与 interop 证明范围分开。

OverflowList slot 的实时 getter 必须在 JSX 的原生 effect/条件块内读取。`overflow: (scope) => <>{scope.items.length ? <span>+{scope.items.length}</span> : null}</>` 会生成响应条件块；函数最外层普通 JavaScript 的 if/ternary 仅在内容分支创建时求值，getter 更新不令它自动执行。遵循 [Vapor 示例编写](./authoring.md#真实源码流程) 与上方 slots 读取规则，不把 setup/slot 函数解释为反复 VDOM render。

scroll raw tuple 在当前 pair 分支的共同资源 scope 创建，两份原生内容分别挂在 display:contents 的真实 div 载体上，增加 DOM 祖先而不增加该载体布局盒。仅在侧 slot 缺失、需要 fallback 时调用 raw callback，每个 pair 分支一次；双侧 slot 提供时不调用。单侧覆写只将该侧 raw 载体移出文档，共同资源及另一侧 DOM 身份、点击、响应性继续存在；移除槽后插回 live 载体。renderer/items 使 pair 分支重建或组件卸载时才共同释放，不能宣称单侧覆写已经独立 unmount，也不将此共同分支管理说成 slot 预执行或 VNode 缓存。

OverflowList 折叠计算以根、项目包装和溢出提示包装的整数 `clientWidth` 为准，与固定上游策略一致。根值包含 padding、不包含 border，项目内容 margin 可能影响包装实测宽度；根 flex gap 不另行扣除，子像素布局会受到整数舍入影响。根宽 146、三个包装各宽 48 的宽度和 144 可以保留三项，但额外 12px gap 仍会使实际内容越过根边缘；不承诺调用者额外 gap、margin 下的总包围盒无溢出。尺寸监听与字体变化重新测量沿用同一计算边界。

折叠候选项临时参与真实测量后卸载，稳定展示只保留一份内容树；测量候选项通过 inert/aria-hidden 排除交互。折叠项闭包状态的独立变化需要新 items/renderer 身份或已支持尺寸触发重新测量。固定上游 floor(width/4) 候选数量启发式没有移植；每轮临时挂载全部项目测量，不承诺虚拟化或相同测量开销。安全空列表、最小项数归一化、统一 key、滚动包装与非单调溢出内容的有限收敛差异见组件页面。根接受安全 HTML attrs，内部测量 visibility/maxWidth 最后应用；没有公开 ref 方法、静态子组件、键盘或额外列表 ARIA 协议。

## Avatar 的内容与分组所有权

[Avatar](../components/avatar.md) 保留显式字符串 children 的文字缩放路径，default slot 承载富内容；不能预执行 slot 判断它是否是字符串或 Avatar。hoverMask、topSlot/bottomSlot 的 text 和 render 使用同步原生内容协议，组件不克隆、缓存 VNode，也不将 renderer 结果强制字符串化。顶层 onError 是实际 Foundation 的零参数返回值回调，严格 false 阻止默认图片回退；imgAttr 的原生图片事件与它不是同一协议。

AvatarGroup 通过子 Avatar 注册和真实 DOM 顺序处理稳定 key、增删重排与条件内容；组 size/shape 覆盖成员，对嵌套组遵循最近上下文。折叠项保留原生子树，用 hidden/inert/aria-hidden 阻止展示与交互，不将折叠描述成卸载或业务资源暂停。renderMore 接收数量及只读 AvatarGroupItem 描述快照（id/index/props/label），不是可克隆的 ReactNode 或可重挂的内容。默认更多提示只显示 +N，需要交互时调用者组合 Popover 与原生 button。组件没有 Avatar.Group、more 命名 slot 或公开 imperative ref。
