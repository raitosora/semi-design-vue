# Collapsible 折叠

Collapsible 是受控的内容容器，通过 `isOpen` 展开或裁剪内容；不提供标题、导航、互斥面板或业务状态管理。

## 用途与导入

```tsx
import { Collapsible } from "semi-ui-vue";
import CollapsibleFromPath from "semi-ui-vue/collapsible";
import type {
  CollapsibleProps,
  CollapsibleSlots,
} from "semi-ui-vue/collapsible";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/collapsible.css";
```

也可使用完整 `semi-ui-vue/styles.css`。浏览器根导出组件值；子路径提供默认、具名组件和类型，纯 Node 根没有组件。当前包 private，未来统一使用 `@raitosora` scope，见[本地产物与消费](../guide/packages.md)。

## 受控展开与动画

<ClientOnly><VaporDemo example="collapsible/Basic.vapor" /></ClientOnly>

默认关闭，默认动画时长 250ms；父级改变 isOpen 驱动状态，没有 defaultOpen、v-model 或 change 通知。首次挂载不产生完成通知。退出期间保留内容，当前请求结束后才按 keepDOM 规则移除；快速反转取消旧请求的监听与计时，旧完成不能移除新内容。onMotionEnd 无参数、返回 void；回调先于退出内容移除，回调内再次展开不会被旧退出销毁。

motion=false 或 prefers-reduced-motion: reduce 时立即同步并取消旧任务，不发送 onMotionEnd。motion=true 且时长为 0、没有有效 CSS 过渡或没有结束事件时仍可完成一次当前请求；这与固定上游只响应 transitionend 的行为不同。正常模式 style 可覆盖计算出的 height、opacity 和过渡时序；完成等待使用最终 CSS 的 duration、delay，而不是只按 duration prop 计时。reduce 偏好下最后追加 0ms duration/delay 覆盖用户时序，避免继续动画。浏览器计时上限为 2,147,483,647ms，超出时序按这一有限上限保护，不承诺无限等待。

## 动态尺寸与嵌套

<ClientOnly><VaporDemo example="collapsible/Dynamic.vapor" /></ClientOnly>

观察独立内部内容节点，不观察被裁剪外层。内容尺寸更新会改变展开高度；reCalcKey 改变后重新读取 scrollHeight。隐藏父级恢复显示时重新测量。卸载断开 ResizeObserver，取消当前结束监听、计时和媒体查询订阅；强制卸载不触发完成通知。嵌套内容的 transitionend 不结束父级请求。旧过渡产生的 transitioncancel 也不会提前结束当前请求；外部样式取消当前过渡时仍由当前最终 CSS 时序的兜底完成，不承诺取消事件立即触发 onMotionEnd。

默认 slot 属于父级，支持原生 fragment、多根、条件分支与动态更新，不预执行内容探测、缓存或克隆 VNode。`children` ReactNode prop 不支持；TSX 使用函数 slot。没有额外 render callback、公开 ref 方法或静态子组件。保留 `Collapsible.__SemiComponentName__ = 'Collapsible'` 及 `getEntryInfo(entry)` 静态测量辅助方法；后者返回 `{ isShown: boolean; height: number }`，borderBoxSize 高度向上取整，缺失时读目标 clientHeight。

## DOM 保留与预览高度

<ClientOnly><VaporDemo example="collapsible/Retention.vapor" /></ClientOnly>

keepDOM=false 在退出完成后移除 slot 内容，内外两个容器仍存在。keepDOM=true 默认首次关闭也挂载内容；同时 lazyRender=true 时直到首次展开才挂载，之后保留。非零 collapseHeight 即使关闭也渲染内容，优先于延迟挂载。collapseHeightAdaptive=true 时关闭高度取 Math.min(内容高度, collapseHeight)。fade 仅在关闭且 collapseHeight=0 时将 opacity 设为 0；预览高度非零时不透明。

## 主题、方向与无障碍

<ClientOnly><VaporDemo example="collapsible/Theme.vapor" /></ClientOnly>

基础样式同时交付固定 Theme animation.scss 的 CSS 动画变量；按需入口须先加载 base.css，SCSS 主题插件选择 base 和 collapsible。组件使用固定上游高度/透明度过渡样式，不额外绘制背景和边框；主题示例的容器背景、换行和边框由业务设置。方向沿真实 DOM 继承，裁剪不改变内容方向。

id 设置在**内部内容容器**，与实际固定源码一致；上游中文文字将其称为 wrapper，不能据此改成外层。触发按钮应自行设置 aria-controls、aria-expanded。组件不提供触发按钮、键盘处理、焦点转移、aria-hidden、inert 或 hidden。保留内容在高度为 0 时仍可能被键盘访问；业务须自行安排关闭前焦点转移及保留内容的可访问状态，不应把视觉裁剪当作隐藏语义。

## API

可选属性允许显式 undefined；省略、undefined、动态移除回到实例创建时捕获的有效默认值。全局默认通过[上下文与默认配置](../guide/context.md)配置，新配置只影响新实例。

| 属性                   | 类型             | 内置默认值 | 说明                           |
| ---------------------- | ---------------- | ---------- | ------------------------------ |
| isOpen                 | boolean          | false      | 父级控制展开                   |
| motion                 | boolean          | true       | 当前请求的过渡开关             |
| duration               | number           | 250        | 过渡时长，单位 ms              |
| keepDOM                | boolean          | false      | 退出后保留内容                 |
| lazyRender             | boolean          | false      | 与 keepDOM 配合延迟首次挂载    |
| collapseHeight         | number           | 0          | 关闭高度，单位 px              |
| collapseHeightAdaptive | boolean          | false      | 关闭高度不超过内容高度         |
| fade                   | boolean          | false      | 零预览高度关闭时淡出           |
| reCalcKey              | number \| string | 无         | 更新后重新测量内容             |
| id                     | string           | 无         | 内部内容节点 ID                |
| className              | string           | 无         | 追加外层类名                   |
| class                  | Vue 原生 class   | 无         | 与外层内置类和 className 合并  |
| style                  | Vue StyleValue   | 无         | 外层样式，正常模式覆盖计算样式 |
| onMotionEnd            | () => void       | 无         | 当前动画请求完成通知           |

HTML attrs 和原生事件应用于外层；innerHTML、textContent 和 transitionend 监听属性被过滤以维护 slot 所有权和完成生命周期。default slot 类型为 `() => VaporRenderResult`；不支持 ReactNode、VDOM VNode 或 Promise。不存在组件 Foundation 实例的公开 expose。

## 验证与限制

`website/tests/collapsible.spec.ts` 验证中文页面开发/生产模式；`tests/e2e/collapsible.spec.ts` 验证纯 Vapor 开发/生产模式。覆盖展开几何、完成通知、保留输入、延迟挂载、自适应高度、动态内容、嵌套、卸载重挂、明暗、RTL 和窄屏。截图用于有限范围人工观察，不声明完整像素一致。组件为 ClientOnly，不声明 SSR、水合或 CJS；普通 Vue interop 与纯 Vapor 证据分开，独立 TSX 编译器严格 peer 限制见[兼容边界](../guide/compatibility.md)。

## 上游与同步维护

固定来源为 Semi Design 2.103.0 提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 Collapsible 完整实现、Foundation 类型、中文文档及 SCSS。Foundation 四个更新方法只转发状态；本版以私有原生状态配合既有动画生命周期设施实现，不新增 Foundation 公共入口或 React/lodash 运行时。原生 slot、精确请求取消、无事件结算、reduce 支持、子事件过滤和卸载不通知为明确适配差异，维护记录见[上游对齐与完成度](../guide/upstream-matrix.md)。
