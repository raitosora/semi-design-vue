# Steps 步骤

Steps 展示有先后关系的任务进度，提供填充式、简易式与导航式三种外观。当前进度由调用方管理。

## 导入与样式

```tsx
import { Steps, Step } from "semi-ui-vue";
import StepsFromPath, {
  Steps as NamedSteps,
  type StepsProps,
  type StepProps,
  type StepsSlots,
  type StepSlots,
  type StepsContent,
  type StepsRenderResult,
  type Status,
  type Size,
  type Direction,
} from "semi-ui-vue/steps";
import StepFromPath from "semi-ui-vue/steps/step";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/steps.css";
```

浏览器根具名导出 `Steps` 和 `Step`，`Steps.Step` 与根 Step、`steps/step` 默认导出是同一组件。族子路径提供默认、具名 Steps 和公开类型；没有额外的 BasicSteps、FillSteps、NavSteps 公共组件。上游的内部 legacy 子路径不作为本库公开入口。组件没有公开命令式 ref 方法，也不提供 `$el`；操作内容中的原生控件时，使用调用方自己的元素 ref。

默认 `type="fill"`；简易式须显式指定 `type="basic"`，导航式指定 `type="nav"`。按需样式包含固定 Steps SCSS、图标和填充式所需 Grid 闭包，也可使用完整 `semi-ui-vue/styles.css`。主题插件支持 `styles: ["base", "steps"]` 与定制前缀；CSS tokens 仍为 `--semi-*`。参见[样式指南](../guide/styles.md)。

## 默认样式、进度与事件

<ClientOnly><VaporDemo example="steps/Basic.vapor" /></ClientOnly>

<p id="steps-details" tabindex="-1">流程详情：链接保持原生导航，Steps 不阻止默认行为。</p>

`current` 默认 0，没有内部选中状态、defaultCurrent 或 v-model 协议。点击只发出通知；需要改变显示时，调用方更新 current。

填充式与简易式按 `initial + 位置索引` 推导状态：等于 current 时采用父 status，小于 current 为 finish，否则为 wait。子项 truthy status 优先于推导状态，显式 undefined、null、false、0 或空字符串这种 falsy 运行时值不覆盖推导。basic 的 active/done 仍按位置判断，不随子 status 改变。

通知保留固定实现的算式：只有**位置索引不等于 current** 时调用 `onChange(位置索引 + initial)`。此处比较没有减去 initial；例如 initial=5、current=6 时，第二项是进行中，点击它仍通知 6。不要把这条规则概括为“当前项始终不触发”。nav 的 active 只比较位置索引与 current，不加 initial。

步骤点击先调用 `Step.onClick(event)`，再调用父 onChange；Enter 先调用 `Step.onKeyDown(event)`，再调用父 onChange，不合成 onClick。事件不自动 preventDefault 或 stopPropagation。标题中的原生链接保留默认跳转；冒泡到 Step 的点击也会触发该步骤。其他按键不会调用 Step.onKeyDown，Space 和方向键没有 Steps 导航协议。

## 类型、尺寸、状态与图标

<ClientOnly><VaporDemo example="steps/Variants.vapor" /></ClientOnly>

- fill/basic 支持 horizontal、vertical；nav 不提供 direction。
- basic/nav 支持 default、small；fill 的固定实现不使用 size。
- hasLine 只用于 basic，默认 true。
- fill/basic 使用 wait、process、finish、error、warning；nav 只呈现标题与箭头，不显示 description、icon 或 status。nav 末项不显示箭头。
- 父 status 为 error 且某项位置等于 `current - 1` 时，该项 className 被替换为 `prefixCls + "-next-error"`；不是与原 className 合并，也不减去 initial。独立 Vue `class` 仍用于调用方类名。

自定义 icon 采用属性存在性：省略时显示状态图标或编号；显式 `icon={undefined}` 仍表示已提供图标，抑制默认图标，动态移除 icon 才恢复。fill 的静态标量图标按 truthy 显示，0/false/null/undefined 不产生图标容器；basic 不显示静态标量自定义图标。复杂图标使用同步 renderer 或 icon slot。

icon slot 按声明存在性保留自定义图标容器，即便当前内容为空；组件不预执行 slot 来探测输出。这与 React 的有效元素检查存在明确差异。icon renderer 则在其单次原生内容所有者中求值并分类：fill 仅为 truthy 返回值创建容器；basic 仅接受原生 Element、fragment 或 Vapor 组件作为图标，不显示标量或数组返回值。renderer 不会为了探测再执行一次。状态图标复用已有 Icons，不创建新的资源副本。

fill 始终有 description 容器，字符串标题/描述同时提供原生 title 属性。basic 的 description 标量为 truthy 才创建描述容器；0 或 NaN 保留原始文本结果而没有描述容器，false/null/undefined 不显示文本。声明的 description slot 保留描述容器，即便当前内容为空。basic 标量 title 为 falsy 时带 title-text-empty 类，0 仍显示文本。nav 不挂载 description/icon 内容。

## 原生内容与动态协作

<ClientOnly><VaporDemo example="steps/Dynamic.vapor" /></ClientOnly>

Steps.default 是无参数原生 slot，声明存在时优先于 children；已声明但当前返回空片段的 slot 仍覆盖 children。Step 提供 title、description、icon 三个命名 slot，各自优先于同名属性，没有默认正文 slot。不要通过调用 slot 预探测内容，也不要传 React 元素或克隆 VNode。

调用方拥有 fragment、多根、条件内容与原生 For 的稳定 key。保持的内容保留组件实例、DOM 身份和原生控件值，稳定更新保留焦点；真实 DOM 移动不承诺焦点保持。卸载重挂或切换 Steps.type 会创建新的内部视图和内容实例。嵌套 Steps 使用独立上下文。

Steps 的 default/children renderer 保留调用方的原生内容，包括顶层文本与 0；只有实际直接 Step 元素参与编号。固定 React 实现会过滤掉顶层非有效元素，本库不预执行 slot 或克隆内容，因此不声明与 React children 过滤等价。标题、描述等普通内容 renderer 保留合法数组和原生块；basic icon 返回数组不显示，其求值时创建的内容也会释放。

排列与末项判断依据已注册的原生 Step 元素在实际容器中的顺序。basic/nav 识别根的直接 Step 元素，fill 复用 Row/Col 并识别相应列中的 Step。返回多根 Step 的原生组件可以参与排列；任意 div 包装并不等同于 Step，不通过遍历 slot 或克隆任意元素分配状态。React.Children 对 fragment、包装组件、空位的过滤和索引方式与此不完全相同；请用原生 Step 表达步骤。

顺序协作使用 MutationObserver 观察实际子节点变化，卸载时断开；没有计时器、RAF、异步状态机或额外键盘管理器。空内容、空数组与稀疏数组不自动生成占位步骤或空态文案。没有 items、dataSource、reverse、disabled 或步骤校验 API。

## 主题、RTL 与长内容

<ClientOnly><VaporDemo example="steps/Theme.vapor" /></ClientOnly>

主题来自既有 CSS tokens，RTL 来自 ConfigProvider 的祖先类和固定样式；Steps 不修改 body.dir。窄屏不会自动选择 type、size 或 direction。标题和描述沿用对应样式的换行、截断规则；示例中的长单词换行由内容 span 的 overflowWrap 显式提供。240px 等窄容器中的横向步骤可能溢出，容器范围内仅能看到部分步骤；fill 的 vertical 同样保留 Grid 的固有内容宽度，长标题在窄容器中仍可能溢出；direction 不承诺自动适配宽度。需要完整呈现时，应提供足够宽度，或由调用方明确约束内容；basic 的 vertical 可作为纵向布局选择。窄屏横向示例的容器截图仅展示容器内可见范围，不表示全部步骤都已显示。

## API

### Steps

| 属性              | 类型                                               | 默认值     | 说明                                       |
| ----------------- | -------------------------------------------------- | ---------- | ------------------------------------------ |
| type              | `"fill" \| "basic" \| "nav"`                       | fill       | 三种视图，切换后重挂内容                   |
| current           | number                                             | 0          | 外部控制的当前位置比较值                   |
| initial           | number                                             | 0          | 编号偏移和通知返回值偏移                   |
| status            | Status                                             | process    | fill/basic 当前步骤的默认状态              |
| direction         | Direction                                          | horizontal | fill/basic 方向                            |
| size              | Size                                               | default    | basic/nav 尺寸                             |
| hasLine           | boolean                                            | true       | 仅 basic 连接线                            |
| prefixCls         | string                                             | semi-steps | 父容器类名前缀，不自动修改 Step 的默认前缀 |
| children          | StepsContent                                       | 无         | 未声明 default slot 时的原生内容           |
| onChange          | `(current: number) => void`                        | 无         | 仅通知，算式见前文                         |
| aria-label        | string                                             | 无         | 根 div 可访问名称                          |
| className / class | `string / HTMLAttributes["class"]`                 | 无         | 根 div 类名                                |
| style             | CSSProperties                                      | 无         | 根 div 样式                                |
| `data-*`          | `string \| number \| boolean \| null \| undefined` | 无         | 根 div 数据属性                            |

StepsProps 是 FillStepsAllProps、BasicStepsAllProps、NavStepsAllProps 的联合；明确 type 时采用对应类型约束。族子路径同时提供上游类型名称 FillStepsProps、BasicStepsProps、NavStepsProps、FillStepProps、BasicStepProps、NavStepProps。这些类型名称不表示额外运行时组件或子路径已导出。

### Step / Steps.Step

| 属性              | 类型                               | 默认值   | 说明                                                      |
| ----------------- | ---------------------------------- | -------- | --------------------------------------------------------- |
| title             | StepsContent                       | 无       | 标题，title slot 优先                                     |
| description       | StepsContent                       | 无       | fill/basic 描述，description slot 优先                    |
| icon              | StepsContent                       | 无       | fill/basic 图标，icon slot 优先；按属性存在性抑制默认图标 |
| status            | Status                             | 父级推导 | truthy 子状态优先，nav 忽略                               |
| className / class | `string / HTMLAttributes["class"]` | 无       | 步骤 div 类名                                             |
| style             | CSSProperties                      | 无       | 步骤 div 样式                                             |
| onClick           | `(event: MouseEvent) => void`      | 无       | 原生点击回调，在父通知前执行                              |
| onKeyDown         | `(event: KeyboardEvent) => void`   | 无       | 仅 Enter，随后执行父通知                                  |
| role              | `HTMLAttributes["role"]`           | 无       | 显式提供时传递到步骤 div                                  |
| aria-label        | string                             | 无       | 步骤 div 可访问名称                                       |

Status 为 wait、process、finish、error、warning；Size 为 default、small；Direction 为 horizontal、vertical。默认值只针对省略/undefined，不统一把 null、false、0 规范化为默认值。onKeyDown、role、aria-label 在固定 StepProps 源码中漏列，但实际视图与中文文档均支持；本库明确补齐这三项类型。Step 不透传 data-\*、id 或任意 DOM 属性，不允许 innerHTML/textContent。

StepsSlots.default 和 StepSlots.title/description/icon 均无参数，返回原生 Vapor 结果。StepsContent 接受 string、number、boolean、null、undefined 或同步函数；StepsRenderResult 还接受原生 Vapor 结果与递归数组。字符串按文本转义；renderer 返回基本值不会被强制当作 HTML。Promise、任意对象、React 元素不受支持；跨 iframe/realm Node 不在原生内容识别范围。Vue RC9 的 VaporRenderResult 声明包含 VNode，不能仅靠 TypeScript 排除所有 Vue VNode；普通 interop 桥接不意味着原生 renderer 可返回任意 VNode。

## 边界与可访问性

根为 div，fill 内含 Grid Row/Col，basic/nav 直接承载步骤 div。每个 Step 都使用 `tabindex="0"`、`aria-current="step"`，包括未开始和已完成的步骤；这不是仅当前项才有 aria-current。没有默认 role、aria-live、roving tabindex 或方向键协议。读屏遵循真实 DOM 顺序，调用方可显式给步骤提供 role/aria-label。

数值不进行取整、范围钳制或 NaN/Infinity 修正；负数、小数、NaN、Infinity 按固定算式比较和显示。越过类型传入其他非法类型不构成公开支持，不保证 getter/Proxy 副作用次数或错误时序与 React 一致。type 在运行时为不支持的值时不输出步骤容器；Step 需要位于 Steps 的上下文内使用。

Steps 不创建 Foundation 实例。复用固定 Foundation 的常量语义与 SCSS，以及已验收的 Grid、Icons；不扩大 Foundation 补丁或运行时依赖范围。

## 验证与维护

真实示例与浏览器检查覆盖受控状态、偏移算式、显式子状态、图标、最后一项、文本转义、默认链接行为、冒泡、Enter 与未支持按键、DOM 和焦点、原生内容生命周期、主题、RTL、窄屏及动态方向。代表截图只用于检查当前呈现，不表示完整像素一致、全浏览器或真实移动设备验收。

纯 Vapor 与普通 Vue interop 分开验证。没有 SSR、水合或 CJS 承诺；Vue 3.6.0-rc.9 / vue-jsx 3.3.0-rc.2 的独立严格 TSX 编译器安装限制继续保留，预编译消费者不替代该验证。参见[兼容边界](../guide/compatibility.md)与[完成度矩阵](../guide/upstream-matrix.md)。

契约固定在 Semi 2.103.0、提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 [Steps 源码](https://github.com/DouyinFE/semi-design/tree/8bed560dd3f36579f85b7a522f19762f2bace756/packages/semi-ui/steps)、[中文文档](https://github.com/DouyinFE/semi-design/blob/8bed560dd3f36579f85b7a522f19762f2bace756/content/navigation/steps/index.md)与 [Foundation 样式](https://github.com/DouyinFE/semi-design/tree/8bed560dd3f36579f85b7a522f19762f2bace756/packages/semi-foundation/steps)。中文文档“nav 不支持交互”与实际源码不一致，本库以固定源码的点击/Enter 行为为准。样式闭包与完整 MIT 许可由既有构建流程验证；修改时同步中文示例、类型、浏览器、四条真实 tarball 消费者与生成矩阵。
