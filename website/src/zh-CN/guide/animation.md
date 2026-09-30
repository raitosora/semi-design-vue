# 动画与可见性

`semi-animation-vue` 提供基于显式 DOM 引用的动画生命周期。适用于原生 Vapor JSX；不读取、保存或克隆 slot 输出。

```tsx
import {
  usePresence,
  useSizeTransition,
  waitForMotion,
} from "semi-animation-vue";
```

## 可运行示例

输入内容后快速关闭再打开，退出尚未完成时会保留同一个输入节点。尺寸示例观察独立内层内容盒；浮层示例在退出完成后销毁 host。

<ClientOnly><VaporDemo example="animation/Animation.vapor" /></ClientOnly>
<ClientOnly><VaporDemo example="animation/Animation.vapor" /></ClientOnly>

## 可见性与 DOM 保留

```tsx
const element = shallowRef<HTMLElement | null>(null);
const visible = ref(true);
const presence = usePresence({
  visible: () => visible.value,
  element: () => element.value,
  enterClass: "my-enter",
  leaveClass: "my-leave",
});
// 在 defineVaporComponent setup 中直接返回 JSX。
return (
  <div v-if={presence.present.value} ref={element}>
    内容
  </div>
);
```

`ref`、`shallowRef`、`defineVaporComponent` 从 `vue` 导入。CSS 类和关键帧由使用者提供；包没有隐式样式导入。

| usePresence 选项        | 类型 / 默认              | 说明                                                                  |
| ----------------------- | ------------------------ | --------------------------------------------------------------------- |
| visible / element       | 必需 getter              | 请求的可见性与原生元素；不使用 `$el`                                  |
| enterClass / leaveClass | 可选字符串               | 临时添加空白分隔类，结束时仅移除本次新增的类                          |
| keepMounted             | boolean / false          | hidden 时继续保留 DOM，调用方必须绑定 hidden 或其他隐藏机制           |
| motion                  | getter / true            | false 走无动画分支                                                    |
| reducedMotion           | 可选 getter              | 默认跟随元素所属窗口的 prefers-reduced-motion；提供 getter 时显式覆盖 |
| timeout                 | number / 10000           | 含 CSS delay 的最长等待毫秒；有限且非负                               |
| onEntered / onExited    | (reason) => void         | 资源释放后通知；onExited 在 Vue 移除 DOM 前运行，可在此 destroy host  |
| onCancel                | (enter 或 leave) => void | 快速反转、目标替换或显式取消当前动画的通知                            |

返回只读 `phase`、`present` 及 `finish()`、`cancel()`、`dispose()`。phase 为 hidden / entering / entered / leaving / disposed。`finish` 立即提交当前方向；`cancel` 通知取消后提交当前请求的终态，退出仍会触发 onExited。反转导致的取消不会调用旧方向的完成通知。`dispose` 释放资源且不通知完成；外部创建的实例应手动释放，setup/effectScope 内自动释放。

关闭时先进入 leaving，DOM、焦点范围、叠层与滚动锁仍有效；退出完成后才变为 hidden。`v-if` 必须绑定 present。若绑定 visible，节点会提前删除，无法播放退出。`keepMounted` 不自动修改 aria-hidden、inert 或焦点；已隐藏的内容应由接入者正确处理。

## CSS 完成与尺寸变化

`waitForMotion(element, options, done)` 观察已有 CSS 动画/过渡，不修改样式。options 支持 kind（animation / transition / both）、property（过滤过渡属性）、timeout（最大 2147483647ms）以及 ignoreCancel（默认 false）。返回 cancel（静默终止）/finish（通知一次）。reason 为 end / cancel / timeout / none / finish。子元素冒泡与伪元素事件不会完成父元素动画；零时长、缺失结束事件、无限循环都有有界收尾。`transition: all` 建议显式指定 property；未指定时以最长时长兜底。

`useSizeTransition({ element, content, axis?, duration?, reducedMotion? })` 返回只读 running、finish、dispose。axis 默认 height，duration getter 默认 200ms，负数按零处理，非有限值或超过 2147483583ms 会被拒绝。content 是独立内层测量盒，避免观察受约束外层造成反馈循环；宽度过渡要求内层宽度不随外层压缩；目标尺寸使用内层 border box，内层外边距和额外兄弟节点不计入测量，应由这个独立盒包住所有内容。完成及卸载恢复调用方原有 inline 样式。不要让其他逻辑同时写入被动画接管的尺寸/overflow/transition 属性。

## 浮层与上下文

示例复用 [host 的显式 context](./overlay.md)，设置 `deferClose: true` 后关闭通知只更新 visible；onExited 才调用 destroy。退出期间仍参与顶层仲裁与焦点约束，滚动锁在最终销毁时释放。强制 host.destroy / app.unmount 会直接取消动画并清理。host 仍限创建 realm document 内迁移；动画并不解除 renderer 的 document 边界。

## 验证范围

真实 Vapor 编译、严格源码/声明类型、浏览器 CSS 动画、尺寸观察、反转/取消/卸载与独立产物消费者共同验证这些工具。当前不提供 React Animation/Transition 的兼容包装，也不导出官方数值 spring 引擎的 API。公共 [Tooltip](../components/tooltip.md) 使用这些生命周期设施；Modal 仍未提供。

静态导入安全及文档 ClientOnly 不代表组件 SSR / 水合支持。沿用锁定 Vue RC9 的 JSX ref、动态 slot 属性读取和额外 exact 调用点检查边界，见[兼容说明](./compatibility.md)。截图仅证明展示状态，不代表完整像素一致性或全部浏览器验收。

## Progress 的数字与 CSS 动画

[Progress](../components/progress.md) 更新时以固定 300ms 线性动画驱动格式数字，复用既有生命周期取消/卸载清理；快速更新替换旧任务，motion=false 立即同步目标并取消数字任务。线形 aria-valuenow 使用目标值，环形 aria-valuenow 跟随数字。其宽高、SVG 描边过渡和不确定状态 CSS 循环来自固定上游样式，独立于 motion，且没有自动 reduced-motion 分支；应用需自行设置 motion=false 并覆盖 CSS。size/width/strokeWidth 更新保留当前 SVG 节点并更新几何，区别于上游按 size key 重建 SVG 的行为。

## Tooltip 的退出与保留

[Tooltip](../components/tooltip.md) 在真实非零测量与定位完成后进入动画，关闭请求保留退出 DOM，完成后移除或按 keepDOM 隐藏。快速反转使旧完成回调失效；卸载直接取消资源，不报告正常 afterClose。motion=false 和 reduced motion 的具体路径见组件页面，与 Progress 的数值动画策略分别定义。

## Collapsible 的独立测量与结算

[Collapsible](../components/collapsible.md) 观察独立内层，外层高度变化不会形成观察反馈。每次展开/折叠拥有完成世代，最终 DOM 样式提交后才读取 CSS 时序；调用者 duration/delay 覆盖照常参与等待。它使用 waitForMotion 的 ignoreCancel=true，避免上一个原生过渡的迟到取消事件提前结束当前请求；当前取消仍由计算时序的有限兜底结算。其他调用者的默认 cancel 完成行为保持不变。reduced motion 会取消监听并让最终 duration/delay 为零；keepDOM 只控制 slot 生命周期，不提供 hidden、inert、焦点或 ARIA 策略。
