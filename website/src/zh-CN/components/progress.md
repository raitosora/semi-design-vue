# Progress 进度条

Progress 表示任务完成比例，支持线形、纵向和环形，以及进度未知时的不确定状态。它不发起请求，也不推断业务成功或失败；没有 `status`、成功/失败图标或取消事件。

## 用途与导入

```tsx
import { Progress } from "semi-ui-vue";
import ProgressFromPath from "semi-ui-vue/progress";
import type { ProgressProps, ProgressSlots } from "semi-ui-vue/progress";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/progress.css";
```

也可导入完整 `semi-ui-vue/styles.css`。浏览器根入口提供 Progress 值，子路径提供默认/具名 Progress 及类型；纯 Node 根不提供该组件。当前包 private，未来统一使用 `@raitosora` scope，详见[本地产物与消费](../guide/packages.md)。

## 线形、环形、方向与颜色

<ClientOnly><VaporDemo example="progress/Basic.vapor" /></ClientOnly>

根始终是 `div`。线形使用 `.semi-progress`，环形使用 `.semi-progress-circle`。线形的 small 与 default 使用相同厚度，large 加粗；自定线形高度/纵向宽度使用根 style。环形 width 为真值时使用该数值，否则 default 为 72px，small 和 large 均为 24px。small 环形不显示文本，large 环形仍可显示文本，这是固定源码的实际规则。strokeWidth 和 strokeLinecap 仅影响环形；width 不控制线形宽度。

环形中心是 width / 2，半径为 (width - strokeWidth) / 2。描边圆周长为半径 × 2π，进度弧从顶部开始。size、width 和 strokeWidth 更新时保留 SVG 节点并更新几何；固定上游以 size 作为 SVG key、size 属性变化会重建 SVG，这里是明确的节点身份差异。不确定环形保持约 30% 圆周的弧并旋转；不确定线形/纵向使用 CSS 滑块，忽略 percent 对长度的控制，并隐藏信息文本。

stroke 为字符串时直接用作填充色；为数组时按原始 percent 选择颜色区间：低于首个点使用默认成功色，恰好等于某点使用该点颜色，区间中默认沿用前一个点，高于末点使用最后一点。strokeGradient 为 true 时在区间颜色之间计算当前数值对应的颜色，不生成 CSS 或 SVG 空间渐变。颜色支持固定来源解析器支持的 Hex、Rgb/Rgba、Hsl/Hsla 和 Semi 颜色 token；它不是通用浏览器颜色解析器。数组中的 Rgba/Hsla 小数 alpha 沿用固定上游的整数解析，0.5 会被解析为 0，不能按完整 CSS 颜色语法理解；直接字符串 stroke 则交给浏览器 CSS 解释。数组中的 Semi 颜色 token 从 `document.body` 的计算样式解析，不读取最近的嵌套主题容器，也不监听 body 主题变化自动重新解析；相关 props 更新触发重新选择和解析。默认 SCSS 颜色及直接传入的 CSS var 字符串仍随正常 CSS 继承响应主题，不能把它们与数组 token 的解析边界混为一谈。默认轨道/进度色来自上游 SCSS 的主题 token，orbitStroke 与 stroke 没有写入默认 props 的颜色字符串。

## 动态更新与动画

<ClientOnly><VaporDemo example="progress/Dynamic.vapor" /></ClientOnly>

percent 是父级输入，没有 defaultPercent、v-model 或 change 通知。有限数值渲染时限制到 0–100，小数保留；原始有限越界值仍参与颜色区间选择与数字动画。首次挂载直接使用当前数值；更新时 motion 为真值会用线性 300ms 数字动画，中间帧取整数，结束恢复精确目标小数。对象或函数形式 motion 只决定真值，不读取配置或执行函数，不支持用它自定时长。`ProgressMotion` 的确切类型是 `boolean | Record<string, unknown> | ((props: Record<string, unknown>) => Record<string, unknown>)`。这是供迁移的 opaque 真值类型，不保留上游 MotionObject 的已知键校验，也不表示任意配置字段已实现。类型差异是双向的：没有索引签名的 interface 对象、参数收窄为 `{ percent: number }` 的函数、返回无索引签名 interface 的函数会被本版拒绝；反过来 `{ state: 1 }` / `{ onStart: 1 }` 作为 opaque Record 可通过本版类型，但不满足上游相应已知键类型。不要将它描述为完全兼容或仅更严格；通常直接传 boolean，避免把 opaque 字段当作运行时功能。

线形长度与 aria-valuenow 立即采用目标值，文本跟随动画；环形弧长立即采用目标值，aria-valuenow 和文本跟随动画。快速更新从前一个输入目标开始新动画，并取消旧实例任务。motion=false 立即同步数值并取消尚未完成的数字动画；即使 percent 不变，仅更换 truthy motion 对象或函数的引用也会取消当前数字帧并立即归位目标，这是相对上游只响应 percent 更新的明确差异。卸载取消任务，重挂使用新实例。CSS 的宽度/高度/描边过渡和不确定循环动画独立于 motion；设置 motion=false 不会关闭这些 CSS 效果。

固定样式没有 prefers-reduced-motion 分支，数字动画也不自动监听该偏好。应用如需减少动态效果，应同时设置 motion=false，并通过自身 CSS 覆盖相应 transition/animation。既有[动画生命周期](../guide/animation.md)工具不会自动改写 Progress 的上游 CSS。文档站外壳额外提供全局降动效 CSS：reduce 偏好下动画时长为 1ms、次数为 1；这是站点配置，纯 Vapor 消费者中的组件样式仍保留上游循环。

## 格式内容与所有权

<ClientOnly><VaporDemo example="progress/Format.vapor" /></ClientOnly>

format prop 是同步标量格式化回调，参数为限制到 0–100 的当前显示数值；返回 string、number、boolean、null 或 undefined。字符串以文本显示，boolean/null/undefined 不产生文本，不解释 HTML。复杂内容使用原生 `format` scoped slot，并优先于 format prop：

```tsx
<Progress
  percent={42}
  showInfo
  v-slots={{
    format: ({ percent }) => <strong>完成 {percent.value}%</strong>,
  }}
/>
```

slot 参数 percent 是只读 `Ref<number>`，在原生 TSX 内容中读取 `.value`，不要提前取快照。slot 返回 `VaporRenderResult`；文本放进元素或 fragment，空内容用空 fragment 或 `[]`。不支持原始 ReactNode、VNode、Promise、default slot、children prop，也不预执行 slot 探测内容。不把复杂回调结果转换为字符串。只有实际显示信息时才调用格式化内容；这与上游 render 无条件执行 format 有差异，回调必须保持纯函数，不应用来安排任务。

示例覆盖条件内容、fragment 多根、包装组件、稳定 key 列表和嵌套内容的响应式所有权。富内容示例额外用局部 CSS 让线形根自适应内容高度、轨道保持 4px、信息列限定宽度并换行，避免较高内容覆盖相邻行；这些是示例布局，不是组件新增默认样式。嵌套进度条及交互控件用于验证 DOM 生命周期，不推荐作为产品的可访问结构：progressbar 的后代不会获得独立的完整语义。业务操作应放在进度条之外。

## 主题、方向、溢出与无障碍

<ClientOnly><VaporDemo example="progress/Theme.vapor" /></ClientOnly>

根固定 `role=progressbar`、`aria-valuemin=0`、`aria-valuemax=100`，不确定状态移除 aria-valuenow。支持 aria-label、aria-labelledby、aria-valuetext；业务应提供可访问名称。格式文本不会自动成为 aria-valuetext，也没有自动 aria-live 播报。轨道、SVG 及圆形均为 aria-hidden 装饰元素；没有内建图标或键盘交互。

主题使用既有 tokens；方向来自 ConfigProvider 容器或真实 DOM 祖先，Progress 不从语言推断方向。长格式内容不自动截断或换行，示例用业务容器控制横向滚动，避免页面在窄屏溢出。

## API

所有可选属性均允许显式 undefined；调用点省略、undefined 和动态移除使用实例捕获的有效默认值。

| 属性                                          | 类型                              | 内置默认值                 | 说明                                            |
| --------------------------------------------- | --------------------------------- | -------------------------- | ----------------------------------------------- |
| percent                                       | `number`                          | `0`                        | 任务数值；有限数值按 0–100 限制显示             |
| type                                          | `'line' \| 'circle'`              | `'line'`                   | 形态                                            |
| direction                                     | `'horizontal' \| 'vertical'`      | `'horizontal'`             | 仅线形方向                                      |
| size                                          | `'default' \| 'small' \| 'large'` | `'default'`                | 实际尺寸与显示规则见上文                        |
| showInfo                                      | `boolean`                         | `false`                    | 显示格式信息；small 环形与不确定状态不显示      |
| indeterminate                                 | `boolean`                         | `false`                    | 不确定状态                                      |
| format                                        | `ProgressFormat`                  | `percent => percent + '%'` | 同步标量回调；复杂内容用同名 slot               |
| motion                                        | `ProgressMotion`                  | `true`                     | boolean、对象或函数；仅用真值控制数字动画       |
| stroke                                        | `ProgressStroke`                  | 无                         | 字符串或 `{ percent: number; color: string }[]` |
| strokeGradient                                | `boolean`                         | `false`                    | 区间颜色插值                                    |
| orbitStroke                                   | `string`                          | 无                         | 轨道色覆盖                                      |
| strokeLinecap                                 | `'round' \| 'square'`             | `'round'`                  | 环形端点                                        |
| strokeWidth                                   | `number`                          | `4`                        | 环形描边宽度                                    |
| width                                         | `number`                          | 无                         | 环形画布宽高，0 使用尺寸回退                    |
| className                                     | `string`                          | `''`                       | 附加根类名                                      |
| class                                         | Vue 原生 class                    | 无                         | 与内置类、className 合并                        |
| style                                         | `CSSProperties`                   | `{}`                       | 根样式；覆盖同名根 CSS                          |
| id                                            | `string`                          | 无                         | 根 ID                                           |
| aria-label / aria-labelledby / aria-valuetext | `string`                          | 无                         | 根可访问属性                                    |
| data-\*                                       | `string \| number \| boolean`     | 无                         | 根数据属性                                      |

不透传任意 role、aria-valuenow、aria-valuemin/max、title、tabindex、原生事件或 innerHTML/textContent。样式优先级是根内联 style 覆盖根 CSS，轨道色与进度色分别由 orbitStroke/stroke 设置；根 style 不代替内部节点样式。

通过[默认配置](../guide/context.md)设置的 Progress 默认 props 在实例创建时捕获；后续全局配置影响新实例。调用点 undefined 回到有效默认值，全局 own undefined 则可替换对应内置值，两者不能混为一谈。全局将 percent、strokeWidth、format 显式设为 undefined 时分别安全回退到 0、4 和空内容；上游缺失 format 仍会调用并抛错，这是安全适配差异。全局 type、direction、size 为 undefined 仍按固定上游比较逻辑分别进入 circle、vertical 和 24px 环形分支；width 为 undefined 使用尺寸回退。全局配置支持 `data-*`，调用点显式值覆盖它，调用点 undefined 恢复该实例的有效默认值；全局配置不接受 class 别名或 format slot，共享复杂格式内容应使用应用包装组件。

子路径导出 `ProgressProps`、`ProgressSlots`、`ProgressFormat`、`ProgressMotion`、`ProgressStroke`，浏览器根只导出组件值。保留 `Progress.__SemiComponentName__ = 'Progress'`，没有静态子组件、公开 ref 方法或组件事件。上游导出的 ProgressState 仅描述 React 类内部 percentNumber 状态；Vue 不提供该内部状态类型或 expose，避免把实现细节作为公共实例 API。

## 边界、验证与限制

非有限 percent 有明确安全差异：NaN 转为 0，正无穷转为 100，负无穷转为 0，避免无效 ARIA 和不结束的数字插值。固定上游首次 NaN 可进入渲染、更新时抛错；无限值缺少动画保护，不声明这些异常输入与上游完全一致。非有限 width 回到尺寸默认，非有限 strokeWidth 回到 4；有限负值或 strokeWidth 大于 width 保留上游几何，不承诺有意义的 SVG 外观；极端有限 width（如 Number.MAX_VALUE）也可能按上游几何运算产生 Infinity 描边参数，浏览器可以不绘制，恢复为 72 后正常。不承诺所有有限尺寸均产生有效 SVG，业务应传入合理尺寸。极端 percent 从 Number.MAX_VALUE 到负 Number.MAX_VALUE 时，本版使用加权插值避免上游先计算差值造成的溢出，这也是明确的安全差异。

真实示例由文档 ClientOnly 挂载；`website/tests/progress.spec.ts` 验证文档开发/生产页面，`tests/e2e/progress.spec.ts` 验证纯 Vapor 开发/生产入口。覆盖 DOM、SVG 几何、ARIA、颜色、格式内容、快速更新、动态移除、卸载重挂、明暗、RTL、窄屏与溢出；局部截图用于人工审阅，不声明完整像素一致。普通 Vue interop 与纯 Vapor 证据分开，不声明 SSR、水合或 CJS。保持 skipLibCheck=false，独立 TSX 编译器严格 peer 安装限制见[兼容边界](../guide/compatibility.md)。

## 上游与同步维护

契约依据 Semi Design 2.103.0 固定提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 Progress 源码、类型、完整中文文档、颜色辅助函数与 SCSS。Progress 上游没有对应状态 Foundation 实例；原生 Vapor 通过私有颜色/数值协作及既有生命周期设施实现，不新增公共 Foundation 入口或 React/lodash 运行时。复杂 ReactNode 格式映射为原生 slot，异常数字保护及取消旧任务为明确差异，来源和维护随[上游对齐与完成度](../guide/upstream-matrix.md)记录。
