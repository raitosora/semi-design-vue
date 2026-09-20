# 虚拟滚动与指针交互

`semi-ui-vue` 提供面向原生 DOM 的虚拟滚动与指针工具，供自定义界面组合使用。工具不创建 Tree、Table、DragMove 或 Resizable 组件，不隐式设置选择、键盘导航或 ARIA 模式。

```ts
import {
  useVirtualList,
  createPointerSession,
  clampDragOffset,
  resizeRect,
} from "semi-ui-vue";
```

## 动态高度列表

切换数据量、插入、倒序、改变高度或定位到项目 500。示例使用原生 Vapor `For` 的稳定业务 key，每行通过显式 ref 参与测量。

<ClientOnly><VaporDemo example="virtualization/Virtual.vapor" /></ClientOnly>

| useVirtualList 选项 | 类型 / 默认                       | 用途                                              |
| ------------------- | --------------------------------- | ------------------------------------------------- |
| items               | () => readonly T[]                | 当前数据，更新时替换数组                          |
| getKey              | (item, index) => string 或 number | 唯一、稳定的业务 key，不使用可变索引              |
| estimateSize        | number 或 () => number            | 未测量行的预估高度，必须为有限正数，单位为 CSS px |
| scrollElement       | () => HTMLElement 或 null         | 当前垂直滚动元素                                  |
| overscan            | number / 1                        | 窗口两侧额外渲染的行数                            |
| focusedKey          | 可选 getter                       | 额外保留一个聚焦行；失焦时由接入者清空            |

返回只读 `virtualItems`、`range` 和 `totalSize`。`virtualItems` 是窗口内行与最多一个聚焦行的并集；每项包含 `key`、`index`、`item`、`start`、`size`、`pinned`。`range` 是连续窗口，不含额外聚焦行。使用独立 spacer 的 `height: totalSize`，把每行绝对定位至 `top: start`；不要让列表同时使用浏览器自动滚动锚定，滚动元素设置 `overflow-anchor: none`。

| 方法                         | 行为                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| registerItem(key, element)   | 登记实际行元素；用于 ResizeObserver 测量                                                                     |
| unregisterItem(key, element) | 仅释放仍匹配该实际节点的登记，旧 ref 清理不会移除新节点                                                      |
| offsetFor(key)               | 返回当前估算/测量布局中的偏移；找不到时为 undefined                                                          |
| scrollToKey(key, { align })  | start / center / end / auto，默认 auto；已挂载滚动元素且找到 key 返回 true；ref 尚未挂载时返回 false，不排队 |
| invalidate(key?)             | 清除一项或全部测量，使未重新测量项使用预估值                                                                 |
| dispose()                    | 释放监听、observer 和待执行 RAF；setup/effectScope 内随 scope 自动释放                                       |

测量按 key 保存，数据重排不会把旧索引高度错误地分配给另一行。未访问的行仍使用预估高度，所以总高度和远端定位可能在测量后修正；这不是一次调用就能得到全部真实高度的保证。改变内容后需失效未渲染行的旧测量；宽度变化会使依赖换行的高度失效。支持垂直、水平书写方向的无外边距行盒；不包含横向虚拟化、无限数据源、跨 document 渲染迁移或浏览器最大滚动尺寸之外的数据集。

焦点 key 只控制 DOM 保留。重排时的焦点/文本选择恢复、删除聚焦行后的目标，以及 Tree/Table 的 roving、role、aria-setsize/posinset 等语义由接入层负责。示例在自己的原生输入节点上保存并恢复选择区；不推测组件根或封闭 ShadowRoot 的内部路径。示例输入是局部草稿，未聚焦行移出窗口后会卸载；需要持久编辑时，应把值存入业务数据。

## 拖动与尺寸

<ClientOnly><VaporDemo example="pointer/Pointer.vapor" /></ClientOnly>

`createPointerSession({ element, onStart?, onMove?, onEnd? })` 返回 `active`、`refresh()`、`dispose()`。`element` 为原生元素 getter；ref 挂载或替换后显式调用 refresh。刷新会结束旧会话并重新绑定，dispose 幂等。setup/effectScope 内自动在卸载时释放。

回调接收 `{ point, delta, pointerId, event }`；point 是 `clientX/clientY`，delta 是相对按下起点的差值，单位为视口 CSS px。仅接受未取消的主指针左键按下，一次会话捕获一个 pointerId。同一 document 中的嵌套工具不会争夺同一指针。原生 capture 让移动到手柄之外的事件继续送达；结束、取消、丢失捕获和卸载都会释放会话。onEnd 的 reason 为 `end`、`cancel`、`lost-capture` 或 `dispose`。工具不自动回滚业务数据；需要取消还原时，在 onStart 保存快照并在 onEnd 根据 reason 还原。

`clampDragOffset(origin, delta, bounds?)` 返回约束后的新点，bounds 为 `{ left, top, right, bottom }`。边界代表允许的位置范围；约束整个盒子时需预先扣除盒子宽高。`resizeRect(initial, start, current, edges, options?)` 返回新 `{ x, y, width, height }`；edges 使用 left/right/top/bottom，options 提供 minWidth/minHeight/maxWidth/maxHeight/bounds。同一轴不能同时选择相反两条边；指定 bounds 时初始矩形必须完整处于边界内。非法数值或不可满足的约束会报错，调用方需给出自洽范围。

所有几何量必须处于同一轴向和坐标系。例子把视口位移应用于未缩放的局部平移；不支持旋转、缩放补偿、拖动期间祖先滚动补偿、跨 iframe 指针坐标转换、多指手势、吸附或比例锁定。使用者为手柄设置合适的 `touch-action`，并提供所需键盘等价操作。工具不代表完整可访问的拖拽或分栏组件。

## 生命周期和验证范围

工具复用[资源管理](./dom.md)和[动画共享生命周期](./animation.md)。不保存或克隆 VNode；本身不延迟卸载。需要退出动画时由接入层决定何时移除 DOM，最终卸载仍释放交互资源。

已接入真实 Vapor 编译、严格类型、Chromium 浏览器和独立产物消费者检查。原生鼠标 capture、动态 ResizeObserver 和 DOM 交互与确定性边界回归共同验证；合成 pointercancel 不等于真实触屏硬件手势覆盖。静态导入和空目标调用安全不代表组件 SSR/水合支持。浏览器、ref/slot 和声明限制见[兼容边界](./compatibility.md)。
