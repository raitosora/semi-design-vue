# 浮层容器与触发器

Semi Design Vue 提供 `createOverlayScope`、`createOverlayHost`、`createTrigger` 和 `mergeEventHandlers` 组合工具，从 `semi-ui-vue` 根入口导入。下面两个示例各自拥有独立 host 和 context，清空或卸载其中一个不会销毁另一个。它们使用原生 HTML 和真正的 Vapor 应用展示容器与清理；它们不是 Tooltip、Popover、Modal 或 Toast 组件。

<ClientOnly><VaporDemo example="overlay/Overlay.vapor" /></ClientOnly>
<ClientOnly><VaporDemo example="overlay/Overlay.vapor" /></ClientOnly>

## 容器与叠层

`createOverlayScope()` 返回 `open(options)`、`destroyAll()` 和 `dispose()`。`open` 返回稳定的 `element`、只读 `destroyed`、`update(options)` 和幂等的 `destroy()`。在 setup 或 effectScope 内创建会自动释放；在外部创建则由调用方 `dispose()`，释放后不能重新打开。`destroyAll()` 只关闭自身浮层，仍可再次打开。

| 选项             | 类型                             | 默认与用途                                           |
| ---------------- | -------------------------------- | ---------------------------------------------------- |
| `container`      | `() => HTMLElement \| undefined` | 锚点所属 document.body；无锚点时为当前 document.body |
| `target`         | `() => HTMLElement \| null`      | 无；明确指定定位锚点                                 |
| `roots`          | `() => readonly Element[]`       | 无；额外的点内区域，多根分别登记                     |
| `parent`         | `OverlayHandle`                  | 无；必须属于同一 scope，销毁父层同时销毁子层         |
| `closeOnOutside` | `boolean`                        | `true`，在捕获阶段处理 pointerdown                   |
| `closeOnEscape`  | `boolean`                        | `true`，尊重已取消的键盘事件                         |
| `trapFocus`      | `boolean`                        | `false`，打开后聚焦可用元素，Tab 循环及焦点外逸约束  |
| `restoreFocus`   | `boolean`                        | `true`，关闭时尝试恢复有效的原焦点或锚点             |
| `lockScroll`     | `boolean`                        | `false`，锁定当前容器 overflow，多层共享计数         |
| `onClose`        | `(reason, event) => void`        | 点外 / Esc 的通知，随后销毁；不是异步确认钩子        |
| `onDestroy`      | `() => void`                     | 销毁时调用一次                                       |

getter 中读取的响应式容器和锚点会在 DOM 更新后重新定位，也可调用 `update`。移动容器保留节点和挂载实例。容器和锚点必须属于同一 document；body 使用 fixed，自定义容器使用 absolute，建议容器具有 `position: relative`。当前定位是锚点下方左侧对齐，响应尺寸、滚动与窗口变化；不包含自动翻转、箭头、多方向 placement 或动画。

同一个 document 中只有物理顶层处理关闭与焦点约束，不同 scope 的 `destroyAll` 互不影响。`parent` 表示显式生命周期关系，不由 DOM 父子位置推断；不要用不同 CSS stacking context 的 z-index 数字推导任意跨容器的视觉覆盖关系。

## 命令式 host 与 context

`createOverlayHost<P>({ mount, context?, overlay? })` 创建独立的命令式 host。`mount(element, state)` 只执行一次，必须返回卸载函数；`state.props.value` 为只读浅快照，`state.context.value` 来自显式的 `StaticContext`。返回的 host 支持 `open(props, options?)`、`destroyAll()`、`dispose()`；每个实例支持 `update(propsPatch, optionsPatch?)` 和 `destroy()`，更新保持局部状态。

```ts
import {
  createOverlayHost,
  createStaticContext,
  useSemiContext,
} from "semi-ui-vue";

const context = createStaticContext(useSemiContext());
const host = createOverlayHost<{ title: string }>({
  context,
  mount(element, state) {
    // 在此挂载自己的预编译 Vapor 组件，读取 state.props / state.context。
    // 返回 app.unmount；完整实现见上方可运行示例。
    element.textContent = state.props.value.title;
    return () => element.replaceChildren();
  },
});
const entry = host.open({ title: "内容" });
entry.destroy();
```

`overlay` 是 host 的默认浮层配置，每次 `open` 的 own key 覆盖它。未指定 container 时读取 `context.container`；显式 `container: undefined` 清除 context 容器选择，回到 body。host 不抓取“最后一个应用”，也不枚举 provides。context 的方向会同步为容器 `dir`；语言、日期和配置供 renderer 明确消费。需要向子组件注入时使用公开 `app.provide(semiContextKey, source)` 或 `provideSemiContext`，不会自动继承其他应用的插件或任意 injection。

Vapor host 的容器必须属于创建 host 的当前 document；初始和显式 update 的跨 document 选择会同步报错，动态 getter 改到外部 document 会释放该实例并报告错误。当前 JSX 常规事件编译为直接监听；另行验证的 Vue RC9 document 委托事件不能随节点跨 document 迁移。host 统一采用当前 document 边界，以兼容这两种 renderer；iframe 内应使用 iframe 自身运行环境建立 app 和 host。原生 DOM scope 的 document 迁移不等于 Vapor renderer 迁移支持。

每次 `update` 合并自己的顶层 props，允许类型声明支持的显式 undefined；destroy 后更新无效。renderer 挂载失败时须自行卸载部分建立的应用，host 负责回收容器；正常卸载抛错也继续清理其他实例。所有权与初始化默认值约定见[上下文与默认配置](./context.md)。

## 显式触发器与事件

`createTrigger({ roots, disabled?, onClick?, onTrigger })` 返回 `onClick` 和 `dispose`。把同一 `onClick` 显式绑定到每个真实根，`roots()` 返回当前元素数组，支持嵌套根。同一个 Event 对象在同一 binding 中只处理一次，包括回调重入或手动重新分发；模拟新的点击请创建新的 Event。当前工具负责 click 激活；原生 button 的 Enter / Space 由浏览器生成 click，hover、延迟及可见性状态机由具体使用者负责。禁用控件请明确登记可接收事件的外层区域，不能假设禁用 button 在所有浏览器发送所有事件。

`onClick()` 返回用户处理器数组，先按函数身份去重后依次执行；`preventDefault()` 取消激活，`stopPropagation()` 仅阻止传播，不阻止同一组合内后续处理器。`mergeEventHandlers(...handlers)` 也可独立使用。点外判断使用捕获阶段与 composedPath，内部停止冒泡不会被误当点外；Esc 必须到达键盘处理阶段，用户 stopPropagation / preventDefault 会保留浮层。同一次事件在每个 document 内只关闭其顶层；roots 跨 document 时，各文档独立仲裁，不受监听注册顺序影响。

## 支持边界

使用显式 DOM ref，不检查 slot 内容、不克隆 VNode、不依赖 `$el`。沿用 [DOM 工具](./dom.md) 的禁用、visibility、slot 和 ShadowRoot 约束；浏览器未公开的 closed slot 路径无法推断。焦点和滚动锁需按实际内容选择；自定义 dialog 的可访问名称与业务语义由调用方提供。

真实编译、严格类型、Chromium 开发 / 生产交互与独立产物消费者验证这些组合工具。静态导入安全只保证 Node 求值边界，组件 SSR / 水合未建立。示例截图仅说明已验证页面结果，不表示完整 Semi 像素一致性。当前包均为 private，尚不发布 npm。

## 退出动画

需要退出动画时设置 `deferClose: true` 并提供 onClose：该回调只请求关闭，host 持续保留 DOM、焦点范围、叠层和滚动锁。调用方在动画 onExited 中显式 destroy；可反转 visible 取消退出。未提供 onClose 时仍立即销毁，回调抛错时先销毁清理再报告。默认 deferClose=false 保留立即关闭行为。详见[动画与可见性](./animation.md)。
