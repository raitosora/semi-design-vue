# Spin 加载中

Spin 显示加载指示器，也可包裹已有内容。它由父级的 `spinning` 控制；不发起请求、不处理请求结果。

## 用途与导入

```tsx
import { Spin } from "semi-ui-vue";
import SpinFromPath from "semi-ui-vue/spin";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/spin.css";
```

也可导入完整 `semi-ui-vue/styles.css`。根与 Spin 子路径是浏览器原生 Vapor 组件入口；纯 Node 根入口只提供基础设施，不能据此声明 Spin 支持 SSR、水合或 CJS。当前包保持 private，未来发布使用 `@raitosora` scope。详见[本地产物与消费](../guide/packages.md)与[安装与样式](../guide/styles.md)。

## 尺寸与初次加载

`small`、`middle`、`large` 的默认图标尺寸分别为 14、20、32px，默认 `middle`。`spinning` 默认 `true`。

<ClientOnly><VaporDemo example="spin/Basic.vapor" /></ClientOnly>

初次挂载时 `spinning=true` 会立即显示，即使 `delay` 大于 0。这沿用固定上游的初始化行为；delay 用于挂载后从 `false` 切换到 `true` 的过程，不是所有加载的统一最短等待时间。

## 动态状态、延迟与包裹内容

<ClientOnly><VaporDemo example="spin/Dynamic.vapor" /></ClientOnly>

等待期间切换到 `false` 会取消显示；下一次 `false → true` 重新开始计时。等待期间修改非零 delay 会从修改时刻重新计时，改为 0 则立即显示；已经显示时修改 delay 不重新隐藏。尺寸、提示或样式更新不重启等待。延迟不是真实请求取消机制。

`spinning=false` 隐藏指示器并恢复内容透明度。default slot 存在时启用 block 布局和内容遮罩；状态切换保留内容实例。即使 slot 返回空片段，slot 的存在仍决定 block 模式，不预先执行 slot 检测内容。卸载会取消该实例的待执行计时，并丢弃过期回调；重新挂载使用新的实例状态。

`childStyle` 设置 `.semi-spin-children`，`style` 设置根容器，`wrapperClassName` 与根 `class` 合并。`tip` 文本为空字符串或 0 时不显示；有 tip slot 时以 slot 为准。

## 自定义指示器、提示与配置

<ClientOnly><VaporDemo example="spin/Custom.vapor" /></ClientOnly>

命名 `indicator` slot 替换默认 SVG，内容放在旋转容器内；命名 `tip` slot 支持富文本并优先于 tip prop。自定义元素的颜色、可访问性和内部 SVG 引用由调用方管理。默认图标使用每个实例独立的渐变引用，避免多个 Spin 的 SVG ID 冲突。

ConfigProvider 的方向容器与上游 RTL 样式共同作用；Spin 不从语言代码推导方向。浅深色使用主题 tokens，局部主题由示例容器设置。示例使用原生 HTML button 控制状态，不依赖其他公共按钮组件。

## API

| 属性                         | 类型                                         | 默认值     | 说明                                            |
| ---------------------------- | -------------------------------------------- | ---------- | ----------------------------------------------- |
| size                         | `SpinSize`：`'small' \| 'middle' \| 'large'` | `'middle'` | 默认图标与根的尺寸类                            |
| spinning                     | `boolean \| undefined`                       | `true`     | 请求显示状态；false 立即停止                    |
| delay                        | `number \| undefined`                        | `0`        | false → true 时等待的毫秒数                     |
| tip                          | `string \| number \| undefined`              | 无         | 文本提示；0 / 空字符串不显示，富内容用 tip slot |
| wrapperClassName             | `string \| undefined`                        | 无         | 与根 class 合并                                 |
| childStyle                   | `StyleValue \| undefined`                    | 无         | 包裹内容的内层样式                              |
| class / style                | Vue 原生 class / `StyleValue`                | 无         | 根容器样式                                      |
| `role` / `aria-*` / `data-*` | 相应原生属性类型                             | 无         | 显式转发到根 div                                |

调用点省略或显式 `undefined` 使用有效默认值，内置 spinning 默认是 true；有效默认值来自首次创建的 Spin 默认配置解析器和内置默认值。通过既有[全局默认配置](../guide/context.md)设置的 `Spin` 默认属性在每个实例创建时捕获；后续配置仅影响新建实例，不更新已有实例。默认配置仅支持 size、spinning、delay、tip、wrapperClassName、childStyle 和 style；class、role、ARIA/data 属性及 slots 由调用点显式提供。上游通过全局 indicator React 元素再克隆的路径不提供等形 API；统一指示器可由应用封装 indicator slot。它不是 ConfigProvider 的动态 Spin props API。全局覆盖自身的 own `undefined` 可替换内置默认值：例如全局 spinning=undefined、delay=0 会隐藏；非零 delay 时首次先显示、计时后隐藏。这与调用点 undefined 回到有效默认值不同。不要依赖负数、NaN 或无限大 delay 作为产品逻辑，底层计时受浏览器 timer 规则约束。

### Slots 与类型

| Slot      | 参数 | 用途                                   |
| --------- | ---- | -------------------------------------- |
| default   | 无   | 原生 Vapor 内容，替代 React children   |
| indicator | 无   | 原生 Vapor 自定义指示器                |
| tip       | 无   | 原生 Vapor 富文本提示，优先于 tip prop |

```tsx
<Spin
  v-slots={{
    default: () => <p>内容</p>,
    indicator: () => <span aria-hidden="true">↻</span>,
    tip: () => <strong>加载中</strong>,
  }}
/>
```

仅 default slot 时可写 `<Spin>{() => <p>内容</p>}</Spin>`。slot 返回 `VaporRenderResult` 原生块；文本包在元素中，空内容用空片段或 `[]`。不接受直接返回字符串、null、undefined 或 Promise，也不接受 ReactNode、原始 children/indicator prop、VNode 克隆或 React render callback。

根与 `semi-ui-vue/spin` 子路径均导出 `Spin`、`SpinProps`、`SpinSize`、`SpinSlots`；子路径另有 default 导出。保留只读静态标识 `Spin.__SemiComponentName__ = "Spin"`。没有组件事件、公开 ref 方法、静态子组件、v-model 或 defaultSpinning API。原生事件、id、tabindex、className 不是已声明的透传属性；需要交互或额外 DOM 属性时由外层原生元素承担。

## 内容遮罩与无障碍

加载时包裹内容透明度为 0.5，block 根的伪元素遮挡指针；停止后移除遮罩、恢复透明度和文本选择。这是视觉和指针处理，不是焦点管理或键盘禁用机制。业务需要禁止操作时，应自行设置内容控件的 disabled / inert 等语义并管理焦点。

Spin 不自动添加 `role=status`、aria-live 或 aria-busy，不播报 tip，也不拦截键盘。默认 SVG 为装饰内容。动态示例显式添加 region 名称、业务 aria-busy、外部 polite 文本和内容按钮 disabled；业务请求状态会先于延迟后的图标出现。自定义指示器应自行决定装饰性或名称，避免重复播报。Spin 不承担错误提示或重试流程。

## 验证与限制

三个真实示例用于文档开发/生产浏览器检查及纯 Vapor E2E，覆盖尺寸、首次加载、延迟取消、更新、卸载与重挂、保留内容、slot、内容遮罩、ConfigProvider 方向和主题。类型检查同时验证源码与生成声明及正反调用点；消费检查使用真实 tarball。普通 Vue interop 的验证与纯 Vapor 分开，不据此声明组件 SSR / 水合。

浅色、深色、RTL 和 375px 窄屏截图用于局部视觉审阅，不代表完整像素级一致性。动画样式原样来自固定上游：默认 SVG 600ms、自定义指示器容器 1600ms 循环；没有内置 prefers-reduced-motion 分支，需要应用按自身可访问性要求覆盖动画。既有[动画生命周期工具](../guide/animation.md)的 reduced-motion 选项不会自动应用到 Spin 的 CSS。

保留 `skipLibCheck=false`。额外 exactOptionalPropertyTypes 调用点检查不表示所有依赖声明完全兼容；Vue 3.6.0-rc.9 / vue-jsx 3.3.0-rc.2 独立 TSX 编译器的严格 peer 安装限制仍有效，见[兼容边界](../guide/compatibility.md)。

## 上游与同步维护

源码、默认图标几何、SCSS、API 和行为依据 Semi Design 2.103.0 的固定提交 `8bed560dd3f36579f85b7a522f19762f2bace756`。上游 React 节点改为原生 Vapor slots；块布局根据 default slot 的存在决定。初次显示、尺寸、文本真值、内容样式与遮罩保留固定来源语义。

定时状态复用现有 Foundation 生命周期 scope 的取消与过期任务机制，不引入 React/lodash 运行时；修复上游重复 render 安排计时造成的旧回调竞争。默认 SVG 保留装饰性语义并使用实例引用隔离，根透传有限的 Vue 样式、ARIA 与 data 属性。差异随[完成度矩阵](../guide/upstream-matrix.md)维护；图标已有 spin 能力和公共 Spin 是不同验收项。
