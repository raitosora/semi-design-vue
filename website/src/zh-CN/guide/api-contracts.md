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
