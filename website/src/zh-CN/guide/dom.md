# DOM 与键盘交互

Semi Design Vue 的 DOM 工具从 `semi-ui-vue` 根入口导出，可用于应用自己的原生元素与 Vapor 组合函数。下面两个示例各自拥有尺寸观察、媒体订阅、键盘状态和 ID；它们使用原生 HTML，不是公开组件。

<ClientOnly><VaporDemo example="dom/Dom.vapor" /></ClientOnly>
<ClientOnly><VaporDemo example="dom/Dom.vapor" /></ClientOnly>

## 显式元素与尺寸

`createDomRef<T extends Element>()` 返回只读的 `element`、回调 `set` 和 `dispose`。把 `set` 绑定到实际 DOM 元素；组件 ref 请使用该组件明确暴露的元素接口。多根结构分别登记元素，再通过 getter 返回数组。工具不会猜测组件的根节点。

```ts
import { createDomRef, observeResize, getScrollParents } from "semi-ui-vue";

const panel = createDomRef<HTMLDivElement>();
const stop = observeResize(
  () => (panel.element.value ? [panel.element.value] : []),
  (entries) => {
    const contentRect = entries[0]?.contentRect;
    console.log(contentRect?.width, contentRect?.height);
  },
);
// JSX: <div ref={panel.set} />
// 在挂载后或事件回调中读取：
const ancestors = getScrollParents(panel.element.value);
```

`observeResize` 在 DOM 更新后重新读取目标，用原生 ResizeObserver 观察实际尺寸。目标替换会断开旧观察；空数组表示不观察，缺少浏览器 API 时不安装 polyfill。回调包含原生 entries，内容尺寸与带边框的 `getBoundingClientRect()` 含义不同。多根尺寸由调用者按 entry.target 区分。

`getScrollParents` 每次读取当前 DOM 和计算样式，返回最近到最远的可滚动祖先及所属窗口；支持 Shadow DOM 祖先及浏览器公开的 slot 分配路径，空目标返回空数组。它不注册滚动监听或锁定页面滚动。

## 焦点和键盘

`focusElement(element, options?)` 返回是否成功获得焦点。禁用、`aria-disabled`、隐藏、inert 和已脱离文档的节点不会获得焦点。子元素显式设置 `visibility: visible` 可以覆盖继承的 `visibility: hidden`，但不能覆盖祖先的 `display: none` 或 inert。

`createRovingTabindex(items, options?)` 管理调用者列出的元素：一个可用项为 `tabindex=0`，其余为 `-1`。将返回的 `onKeydown` 绑定到工具栏，使用 `refresh()` 在外部 DOM 更新后重新核对，`dispose()` 释放管理并恢复原 tabindex。不要同时用 JSX 响应式绑定同一元素的 tabindex。

| 选项          | 类型                                         | 默认   |
| ------------- | -------------------------------------------- | ------ |
| `orientation` | `() => 'horizontal' \| 'vertical' \| 'both'` | `both` |
| `direction`   | `() => 'ltr' \| 'rtl'`                       | `ltr`  |
| `loop`        | `() => boolean`                              | `true` |

已持有闭合 ShadowRoot 内部元素的显式引用时，也可确认该元素的焦点。slot 祖先识别覆盖浏览器可访问的分配路径；闭合树未公开的 slot 路径无法自动推断。

方向键按 orientation 移动；水平 RTL 反转左右方向；Home / End 到首尾可用项。Tab 保留原生行为，输入区域、组合输入及带修饰键的事件不被当作导航。工具只负责焦点，不代替业务选择状态、角色和标签；请按实际控件语义提供它们。

`getNavigationKey(event, orientation, direction)` 是同一键盘规则的独立入口，可供自有事件处理器使用。工具不会安装全局快捷键。

## ARIA 关联与多应用

`createAriaIdScope(prefix)` 创建局部 ID 分配器，`next(suffix?)` 每次生成新 ID。每个应用应持有自己的 scope，prefix 必须在同一文档内唯一且生命周期内稳定；prefix 与 suffix 不允许空字符串或空白字符。不要为每个组件重复创建同名 scope，也不要在响应式渲染表达式中反复申请 ID。

也可通过 `app.provide(ariaIdScopeKey, scope)` 显式注入应用级 scope。`provideAriaIdScope(prefix)` 在父组件 setup 提供 scope（当前组件可使用返回的 scope.next），后代在 setup 中调用 `useAriaId(suffix?)` 获取一个 ID；没有提供 scope 时明确抛错。此协议不猜测最后挂载的应用，也没有模块级递增计数器。示例只在客户端使用 `crypto.randomUUID()` 构造独立前缀；它不是服务端 ID 复用方案。

把同一 ID 写入 `label for` / `input id`，或说明元素 `id` / 控件 `aria-describedby`。调用方自行指定的 ID 仍由调用方确保唯一。

## 点外事件、媒体与调度

| 工具                                               | 用法与边界                                                                                                                                                                                                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `observeOutsidePointer(roots, callback, enabled?)` | roots 为元素数组 getter；在所属 document 的捕获阶段监听 pointerdown，按 composedPath / contains 判断多个受保护根。enabled 默认 true，动态禁用后停止通知。空 roots 不监听全局文档。禁用原生按钮需要监听其外层区域时，显式把该区域作为 root。               |
| `observeMediaQuery(query, callback, view?)`        | query 为字符串 getter；初始匹配和匹配变化调用 callback。view 返回所属窗口，省略时使用客户端全局窗口。query / view 更新后释放旧订阅，callback 读取的其他响应式状态不改变订阅；要求现代 MediaQueryList.addEventListener API，无 legacy addListener 兼容层。 |
| `createDomScheduler(view)`                         | view 为窗口 getter；`frame(callback)` 返回取消函数；`debounce(callback, delay)` 返回 `schedule(...args)`、`cancel()`、`flush()`，仅保留最后一次调用。`dispose()` 取消待执行任务；释放后不再安排任务。                                                     |

这些接口在 setup / effect scope 中创建时跟随 scope 清理，组件外使用必须显式释放；观察接口返回清理函数。DOM ref 释放后为 null。把返回的清理函数登记到既有 Foundation `scope.own` 也可明确归属；不要让同一 observer 或计时器拥有两套互不知情的生命周期。

调度器只提供单次 RAF 和尾部防抖，不承诺 lodash 的 leading / maxWait 等配置。点外工具只报告事件，不创建弹层、不关闭其他应用内容。

## 验证范围

使用锁定的 Vue / vue-jsx 编译器验证真实 Vapor DOM、动态目标、尺寸、键盘、应用隔离及卸载清理；独立消费者读取生成的 ESM 和声明。Node 静态导入安全和空目标调用不等于组件 SSR / 水合支持。这些工具不自动恢复任意 keyed DOM 移动后的焦点或输入选择区，仍须由具体列表/编辑器保留并恢复。JSX ref 属性的上游类型限制没有因此消失；明确的 `set` 参数、普通 Ref 赋值与声明调用点另有严格检查。

浏览器与视觉限制见[兼容边界](./compatibility.md)。当前包仍为 private，未来发布统一采用 `@raitosora` scope。
