# Foundation 桥接

Semi Design Vue 用 `useFoundation` 连接状态机与 Vue 生命周期。此页展示输入和浮层的内部协议夹具，其范围与公共 [Tooltip](../components/tooltip.md) 分别定义。内部夹具不提供 Input 或 Popover 公共组件，也不构成主题、完整定位与无障碍的兼容承诺。

## 状态与生命周期

`useFoundation` 在 Vapor setup 内调用。传入 `props` getter、`initialState`、`create(adapter, scope)` 和 `onError`，可选 `contexts` getter 与 `watchProps`。返回 `foundation`、`adapter`、只读 computed `state`、资源 `scope` 及幂等 `dispose()`。

| 接口                                     | 行为                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `getProps / getProp`                     | 读取最新 getter，形成仅含自有键的浅快照，不保存首次 props                     |
| `getStates / getState`                   | 同步读取最近一次状态提交；无需等待 DOM 更新                                   |
| `setState(patch, callback?)`             | 浅合并为新快照；不修改原始状态或消费者数据。callback 在 Vue `nextTick` 后执行 |
| `getCache / getCaches / setCache`        | 每个实例独立的缓存；替换顶层对象，销毁时清空                                  |
| `getContext / getContexts`               | 只从显式 getter 读取；不访问 Vue 实例内部的 provides                          |
| `stopPropagation / persistEvent`         | 使用原生事件；persistEvent 无需操作，不伪造 React 事件池                      |
| `watchProps(next, previous, foundation)` | 初始化完成后的 post-flush 变化通知；不自动调用组件特有的 update 方法          |

`create` 只负责构造。DOM 挂载后执行一次 `init`，卸载前或显式 `dispose` 时执行一次 `destroy`。先使异步任务、回调和已登记资源失效，再销毁状态机。构造或初始化失败同样释放已登记资源；某项清理失败不会跳过其余清理。

同一轮多次 `setState` 都同步生效，回调按登记顺序看到批处理后的 DOM，而非每个中间 DOM。卸载后不再执行回调或状态提交。状态和缓存只保护顶层快照，嵌套对象保留身份；状态机不得直接修改消费者的数组、Ref 或嵌套数据。

受控值使用[既有存在性与受控协议](./api-contracts.md)：缺失与显式 `undefined` 不同；getter 必须保留这种区别，不能无条件补上 `value`。bridge 不接管 `defaultValue`、模式切换或字段注册策略，也不强行把所有控件改成 `modelValue`。

## 资源与异步结果

`scope.own(disposer)` 返回幂等释放函数；已释放的资源不会重复释放。`timeout`、`interval`、`frame` 登记定时器及动画帧；原生 observer 的 `disconnect`、事件监听的 `removeEventListener` 通过 `own` 登记。`guard(callback)` 在销毁后不再调用 callback。

Foundation 自己创建的计时器仍由其 `destroy` 负责。bridge 无法自动发现任意第三方资源，也不会取消没有登记的网络请求或 Promise。主动取消请求可把 AbortController 的 abort 登记到 `own`。

每次 `scope.task()` 创建一个“最新请求”凭据；后续 task、`invalidate()`、props 响应式变化或销毁会使旧凭据失效。异步返回后通过 `task.commit(() => ...)` 写入状态；返回 false 表示结果已过期。props 失效检测同步执行，组件的 watchProps 通知仍在 DOM 更新后执行。一个 scope 是单一请求序列，互不相关的并发业务需要分别定义其失效策略，不能共用一个序列后假定互不影响。

通知用 `scope.notify` 调用 Vue emit；返回值钩子用 `scope.decide` 直接调用函数，保留 false、Promise 身份、同步抛错和异步 rejection。返回 false 的业务含义仍由组件决定。不要把需要返回值的回调改为 emit，也不要对同名通知派发两次。

`onError` 接收 init、props getter/watch、DOM 回调和销毁阶段错误；应接入应用错误展示或报告。直接调用的决定钩子、任务 effect 和资源回调错误仍由调用者处理。不要使用空错误处理器掩盖失败。

## 固定上游与验证范围

状态机输入固定为 `@douyinfe/semi-foundation@2.103.0`。只对已消费的输入/浮层依赖闭包维护版本化补丁，使用经边界测试的 `es-toolkit/compat` 替换原工具引用；并不代表所有上游 Foundation 模块均已迁移。

示例构建内联所需的补丁后状态机与工具函数，消费者无需配置仓库的 patch 或 override。通用 UI 包当前只导出桥接与协议，不 external 官方 Foundation 为运行时依赖。完整组件、样式及 tarball 安装验收另行推进。

继承[兼容边界](./compatibility.md)：客户端示例不代表组件 SSR/水合支持；JSX ref 类型限制与 slot 动态参数写法不变。浏览器验证范围为 Chromium，尚无 Firefox/WebKit、真实移动设备或 Semi 全量视觉对齐结论。

## 真实状态机示例

<ClientOnly>
  <VaporDemo example="foundation/Input.vapor" />
  <VaporDemo example="foundation/Tooltip.vapor" />
</ClientOnly>

输入夹具验证原生 input、受控回传、焦点事件和 mode 更新。启用 `composition` 后，组合输入期间保留独立草稿，不派发更新；结束时提交最终文字，受控父级拒绝更新时恢复其当前值。此路径通过浏览器 composition/input 事件序列验证，尚未覆盖操作系统输入法。可选字段注册复用既有 `FieldContext`：切换或移除 context 时释放旧注册，卸载释放当前注册；清理保留注册对象方法的调用上下文。浮层夹具仅验证 hover/top、延迟显示隐藏、真实 DOM 测量及资源清理。未实现的触发类型、完整 Portal、溢出调整、箭头、焦点约束与主题样式不作为这些夹具的支持能力。

示例产物随附 [Semi Foundation MIT 许可](/licenses/semi-foundation-2.103.0-MIT.txt) 与 [es-toolkit MIT 许可](/licenses/es-toolkit-1.39.10-MIT.txt)。
