# Typography 排版

## 用途与导入

Typography 容器及 Text、Title、Paragraph、Numeral 用于文本、标题、段落和数字格式化。项目名称是 Semi Design Vue，以下示例使用原生 Vapor 模式。

```tsx
import { Typography } from "semi-ui-vue";
import Text from "semi-ui-vue/typography/text";
import Title from "semi-ui-vue/typography/title";
import Paragraph from "semi-ui-vue/typography/paragraph";
import Numeral from "semi-ui-vue/typography/numeral";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/typography.css";
// 默认复制/成功图标依赖 icons.css；复制提示及 tooltip 依赖 tooltip.css：
import "semi-ui-vue/styles/components/icons.css";
import "semi-ui-vue/styles/components/tooltip.css";
// showTooltip.type="popover" 时另引入 popover.css。
```

根入口只导出 `Typography`；四个组件通过 `Typography.Text`、`.Title`、`.Paragraph`、`.Numeral` 使用。族子路径 `semi-ui-vue/typography` 提供默认和具名 `Typography`；四个独立子路径提供默认和对应具名组件。具名子路径是本项目包装适配，不冒充上游根具名导出。

样式的三个 SCSS 源文件固定为 Semi Foundation/Theme 2.103.0，类前缀可用 `semi-ui-vue/styles/components/typography.scss` 的 `$semi-prefix` 定制；CSS tokens 保留 `--semi-*`。主题插件支持 `styles: ["base", "typography"]`，默认复制与成功反馈复用 Icon 包装，需要显式加载 `icons.css`；`base.css` 和 `typography.css` 不包含该包装样式。复制提示及 tooltip 需 `tooltip.css`，popover 另需 `popover.css`。主题插件可选择 `tooltip`、`popover`；图标独立导入 CSS，定制图标类前缀则在单独 SCSS 文件中使用 `@use "semi-ui-vue/styles/components/icons" with ($semi-prefix: your-prefix)`。插件没有 `icons` 选项。详见[安装与样式](../guide/styles.md)。

## 基础排版与语义

<ClientOnly><VaporDemo example="typography/Basic.vapor" /></ClientOnly>

<span id="typography-target"></span>

`Typography` 默认是 `article`；省略子组件的 `component` 时，Text 和 Numeral 是 `span`，Paragraph 是 `p`，Title 按 `heading` 产生 `h1` 至 `h6`。子组件显式传入 `component={undefined}` 则沿用上游行为，回落到 Typography 容器标签（默认 `article`，可由捕获的容器全局默认配置覆盖）；动态删除该属性会恢复子组件自身的标签。`component` 指定 HTML 标签时，由使用方负责有效嵌套与标题层级。自定义 Title 标签仍保留 `hN` 样式类，不自动添加 heading role。

装饰从内到外是 `mark`、`code`、`u`、`strong`、`del`、链接 `a`；链接内的 underline 使用链接下划线样式。字符串始终作为文本转义。链接对象属性传入内部 `a`，其他 HTML attrs 和监听器传入组件根。`disabled` 改变样式并将链接改为 `span`，沿用上游属性/事件透传，不自动阻止监听器、复制或展开。没有新增 `aria-live` 或通用键盘协议。

## 省略、复制与原生内容

<ClientOnly><VaporDemo example="typography/Interactive.vapor" /></ClientOnly>

省略只支持 **`children` 属性中的字符串**。上游也仅承诺纯文本省略。普通内容使用默认函数 slot 或 `children` renderer，支持条件、多根、嵌套及稳定 key 列表；库不预执行 slot、不遍历/克隆虚拟节点，也不把 renderer 结果转成字符串。需要省略时，将原始文本作为独立数据传给 `children`；原生 slot 中的文本节点不作为测量数据源。

默认末尾单行/多行使用 CSS；中间省略、展开、非空后缀或复制组合需要文本测量。省略计算属于组件实例，内容、尺寸、字体和隐藏后显示的更新由已有 DOM/调度工具驱动；展开/收起通过 `onExpand` 通知，不是受控 expanded 属性。测量包含 padding、border 和 box-sizing，并以元素在其实际父容器中应用 min-width/max-width 后的内容宽度为准；tooltip 在实际溢出时显示完整文本。复杂原生内容不会被拆分以满足行数。

包含 copyable 或 showTooltip 的应用需在 setup 中通过 `provideAriaIdScope("应用唯一前缀")` 建立既有 G10 ARIA ID 范围，多 app 使用不同前缀；Typography 不创建全局计数器。

复制基于与锁定上游 copy-text-to-clipboard 2.2.0 一致的同步 `document.execCommand("copy")`，`onCopy` 的第三参数是该命令的布尔结果；没有 Clipboard Promise API。原始字符串/数字 `children` 可作为默认复制数据，原生 slot/renderer 内容请提供 `copyable.content`。复制失败返回 `false` 时，上游仍显示 copied 反馈，本组件保留这一行为；不能仅凭反馈判断系统剪贴板成功。默认三秒重置；移除复制功能或卸载时清理计时器，重复调用替换旧计时器。

临时 textarea 使用触发节点所属 document；结束时删除 textarea、恢复此前 Selection 的首个 range 并尝试恢复原焦点。复制后默认图标被反馈内容替换，不能承诺焦点仍停在已删除的图标上。命令抛错按上游返回 false；选中文本阶段的异常继续抛出，但 finally 仍清理临时节点并恢复选择与焦点。

默认复制交互边界沿用 `role="button"`、`tabIndex=0` 和 Enter keypress；未增加 Space 激活。自定义复制 renderer 完全负责其 UI、标签和键盘语义。`copyable.icon` 通过明确的交互容器接入，不克隆图标或向原生子节点注入事件。复制/展开不隐式阻止冒泡。`copyable.render` 的 copied 或配置变化会重新执行 renderer 并替换其原生分支，内部 DOM 和焦点可能重建；该边界不同于普通默认 slot 的稳定列表。自定义复制 renderer 与上游一样不接内部 forwardRef，因此不能保证 JS ellipsis 为其保留操作宽度；需自行提供布局空间，默认复制操作可测量。

## 数字格式化

<ClientOnly><VaporDemo example="typography/Numeral.vapor" /></ClientOnly>

Numeral 使用固定 Foundation `FormatNumeral` 算法，保留其分词、舍入和 parser 优先级。`children` 的字符串或数字进入格式化，复制读取格式化后的内容；空值不强转为数字。原生 slot/renderer 保持原样，**不执行上游 React 的 DFS 节点改写**。复杂内容请把需格式化的标量分别放入 Numeral 的 `children` 属性，或在 Numeral 默认 slot 的 `scope.format(value)` 中显式格式化；该 scoped 方法是为原生所有权提供的适配，不是递归改写。

`text` 格式化文本中的数字片段，`numbers` 提取数字片段并以逗号连接（不添加千分位）；`bytes-decimal`/`bytes-binary` 使用十进制/二进制字节单位；`percentages`、`exponential` 分别处理百分数和科学计数。未提供货币、locale 或分隔符配置。精度与负数取整沿用算法，不额外夹取。正向溢出为 Infinity 的字节值会抛出 RangeError，以避免上游无限循环；其他异常不被静默转换成零。Numeral 的空值保持空内容，不复刻上游 React DFS 读取 null.props 的崩溃；rule/parser/precision/truncate 均在格式层消费，避免上游 precision/truncate 意外落 DOM。

## 深浅主题、RTL 与字号继承

<ClientOnly><VaporDemo example="typography/Theme.vapor" /></ClientOnly>

方向从 ConfigProvider 继承；RTL 沿用锁定样式的图标间距和复制间距规则；复制区域保留上游内联 marginLeft=4px，RTL 样式另设 marginRight=4px，不能概括为清空左间距后单纯换侧。`size="inherit"` 读取最近排版子组件的 size 上下文；Typography 容器自身不提供 size。`overrideDefaultProps.Typography` 配置容器默认值；四个子组件省略 `component` 时仍使用各自标签，显式 `component={undefined}` 时使用捕获的容器标签默认值。子组件其余排版默认属性不因此改为全局覆盖。参见[上下文与默认配置](../guide/context.md)。

## API

### Typography 容器

| 属性              | 类型                                                                   | 默认值    | 说明                                            |
| ----------------- | ---------------------------------------------------------------------- | --------- | ----------------------------------------------- |
| component         | HTML 标签名                                                            | `article` | 仅支持原生 HTML 标签，不接受 React/Vue 组件对象 |
| className / class | string / HTML class                                                    | `''` / —  | 根样式类                                        |
| style             | CSSProperties                                                          | `{}`      | 根样式                                          |
| children          | TypographyContent                                                      | —         | 标量或原生 renderer；默认 slot 优先             |
| forwardRef        | `Ref<HTMLElement \| null>` 或 `(element: HTMLElement \| null) => void` | —         | 实际根 DOM，卸载置空                            |
| tooltipRef        | 同 forwardRef                                                          | —         | 上游保留字段；不绑定、不落 DOM                  |

容器没有 Text 的格式、复制或省略属性。其余合法 HTML attrs/原生事件透传到根；不支持 `innerHTML`、`textContent` 或 React 的 `dangerouslySetInnerHTML`。

### Text / Title / Paragraph / Numeral 共用

| 属性                                          | 类型                                                                             | 默认值          | 说明                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------- | --------------- | ------------------------------------------ |
| children                                      | TypographyContent                                                                | —               | 默认 slot 优先；省略需要字符串数据         |
| component                                     | HTML 标签名                                                                      | 见基础语义      | 覆盖根标签                                 |
| className / class / style                     | 同容器                                                                           | `''` / — / `{}` | 根样式与 HTML 属性                         |
| type                                          | `primary \| secondary \| tertiary \| quaternary \| warning \| danger \| success` | `primary`       | 文字颜色；链接采用链接颜色                 |
| copyable                                      | `boolean \| CopyableConfig`                                                      | `false`         | 同步复制及反馈                             |
| delete / disabled / mark / strong / underline | boolean                                                                          | `false`         | 删除、禁用外观、标记、强调、下划线         |
| link                                          | `boolean \| LinkType`                                                            | `false`         | true 产生无 href 链接；对象为 anchor attrs |

除上述子组件 `component` 的存在性规则外，顶层显式 `undefined` 恢复默认值，动态删除同样恢复。`null` 不等同于 `undefined`，不以统一 nullish 策略覆盖上游行为。配置对象为浅合并，内部显式 `undefined` 的语义与顶层不同。

原生稳定 key 列表的重排保留节点和组件生命周期；真实 DOM 搬移仍可能使焦点回到 body，与锁定 Vapor 的裸 For 行为一致。普通文本更新没有 DOM 搬移时另有保焦验证，不将其扩大到所有列表重排。

### 各子组件属性

| 组件                     | 属性      | 类型                                                                             | 默认值   | 说明                              |
| ------------------------ | --------- | -------------------------------------------------------------------------------- | -------- | --------------------------------- |
| Text、Numeral            | code      | boolean                                                                          | —        | `code` 语义包裹                   |
| Text、Numeral            | icon      | TypographyContent                                                                | `''`     | 原生前缀内容或 renderer           |
| Text、Paragraph、Numeral | size      | `normal \| small \| inherit`                                                     | `normal` | 字号与上下文继承                  |
| Text                     | weight    | number                                                                           | —        | 数值字重；style.fontWeight 可覆盖 |
| Title                    | heading   | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                                                     | `1`      | 非法运行时值回退 h1               |
| Title                    | weight    | `light \| regular \| medium \| semibold \| bold \| default \| number`            | —        | 标题字重类或数值样式              |
| Paragraph                | spacing   | `normal \| extended`                                                             | `normal` | extended 行高 24px                |
| Text、Title、Paragraph   | ellipsis  | `boolean \| Ellipsis`                                                            | `false`  | 纯字符串省略                      |
| Numeral                  | rule      | `text \| numbers \| bytes-decimal \| bytes-binary \| percentages \| exponential` | `text`   | 固定上游格式规则                  |
| Numeral                  | precision | number                                                                           | `0`      | 小数精度，不自动夹取              |
| Numeral                  | truncate  | `ceil \| floor \| round`                                                         | `round`  | 对齐相应 Math 取整                |
| Numeral                  | parser    | `(value: string) => string`                                                      | —        | 优先于内建格式规则                |

上游 Numeral 文档列出 ellipsis，但其公开 NumeralProps 未声明；本项目保持该类型边界，不将运行时透传事实扩展为承诺。Title 没有 code/icon/size/spacing，Paragraph 没有 code/icon/weight，Numeral 没有 weight；不提供 editable。

### Ellipsis

| 字段                      | 类型                                                              | 默认值                      | 说明                           |
| ------------------------- | ----------------------------------------------------------------- | --------------------------- | ------------------------------ |
| rows                      | number                                                            | `1`                         | 省略行数                       |
| pos                       | `end \| middle`                                                   | `end`                       | 截断位置                       |
| suffix                    | string                                                            | `''`                        | 省略后缀                       |
| expandable / collapsible  | boolean                                                           | `false`                     | 展开/允许再次收起              |
| expandText / collapseText | string                                                            | 当前 locale 的展开/收起文案 | 自定义操作文字                 |
| showTooltip               | `boolean \| ShowTooltip`                                          | `false`                     | 实际溢出时显示完整文本         |
| onExpand                  | `(expanded: boolean, event: MouseEvent \| KeyboardEvent) => void` | —                           | 状态变化通知；返回值不控制展开 |

`suffix` 在展开或无需省略时也附加；中间截断按 UTF-16 slice 保留两端，不承诺按字素簇切分。仅设置 `expandText` 会显示操作并通知，但只有 `expandable`/`collapsible` 才允许实际状态切换。配置对象显式 `suffix: undefined/null` 在访问 suffix.length 的路径会触发上游式 TypeError，不默认为空；短路路径仍有例外，例如 copyable 强制 JS 且 children 为空字符串时先返回空结果，不执行该访问。`rows: 0/null/undefined` 跳过测量，分数 `0.5` 的 JS 与 CSS 策略边界不同（CSS 小于 1 跳过）。显式 `pos: undefined` 不等同于省略该字段，会进入非 end 的候选策略。这些运行时异常输入不在正常类型承诺内。

`ShowTooltip.type` 为 `tooltip` 或 `popover`；`opts` 透传既有 Tooltip/Popover 支持的选项；`renderTooltip(content, children)` 自定义浮层，第二参数是原生 renderer，必须由返回的原生结构拥有并渲染。它不是 ReactNode，不能缓存、克隆或预执行探测；多个出口不能重复使用同一个内容所有权。非法非字符串 type 仅在实际溢出且要显示浮层时可能抛错，不能用未溢出例子证明该输入受支持。

### CopyableConfig

| 字段       | 类型                                                                                            | 默认值                         | 说明                                        |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------- |
| content    | string                                                                                          | 可复制标量 children            | 原生内容须显式指定复制文本                  |
| copyTip    | TypographyContent                                                                               | 当前 locale 的复制文案         | undefined 使用默认；null/false/空字符串保留 |
| successTip | TypographyContent                                                                               | 图标与当前 locale 的已复制文案 | 没有 failureTip                             |
| icon       | TypographyContent                                                                               | IconCopy                       | 自定义原生图标内容                          |
| onCopy     | `(event, content: string, result: boolean) => void`                                             | —                              | 同步命令结果通知；抛错中止随后的反馈更新    |
| render     | `(copied: boolean, doCopy: (event) => void, configs: CopyableConfig) => TypographyRenderResult` | —                              | 完全替换复制 UI；不支持 Promise renderer    |

复制空值也保留上游的具体合并顺序：没有 children 或 children 为 undefined 时，Base 默认 children=null，默认复制文本为字符串 `"null"`；显式 `copyable.content: undefined` 先覆盖计算内容，再由内部 Copyable 恢复为空字符串。运行时 `content: null` 不转换为空字符串，会在读取 length 时抛 TypeError，finally 仍清理临时节点。原生 slot/renderer 无显式 content 则安全拒绝，不把函数或 DOM 字符串化。

事件为 `MouseEvent | KeyboardEvent`。render 的第三参数是实际内部配置，因此运行时还可含 duration=3、onCopy=noop、style={}、className=''、content='' 等默认项；它们不是新增公开可配置字段。`duration` 只属于上游内部 Copyable，不是公开 CopyableConfig；本项目没有公共 Clipboard/Copyable 组件。

### Slots、renderer、ref 与类型

`TypographyContent` 是 `string | number | boolean | null | undefined | (() => TypographyRenderResult)`；renderer 结果由原生 Vapor outlet 管理，支持原生结果和标量。默认 slot 为返回原生 Block 的函数，支持 JSX 函数 children 与 `v-slots`；纯文本 slot 写作 `() => <>{text}</>`，不能直接返回裸字符串/数字。标量值应放在 children 属性；children renderer 由专用原生 outlet 处理，不能把其较宽的返回类型推断为原生 slot 的返回协议。Numeral 的默认 slot 接收 `{ format: (value: string | number) => string }`，使用 `scope.format` 保持动态配置读取；slot 声明存在性与函数返回空内容不同，不通过执行探测来选择 fallback。

锁定 JSX 编译器将嵌套函数 `<Typography.Text>{() => <>{text}</>}</Typography.Text>` 编译成默认 slot，将显式属性 `<Typography.Text children={text} />` 或 `children={() => <span>{text}</span>}` 作为 props 数据传给内容 outlet。这是两条原生编译路径；不能用裸字符串 slot 代替 children 标量数据，省略也只读取后者的字符串。

四个子组件没有新增公开实例方法或 DOM ref 属性；上游 React class ref 不转译为 focus/getElement。仅 Typography 容器的 `forwardRef` 是公开 DOM 引用。普通 Ref 赋值和 renderer 参数有严格正反类型检查；锁定编译器 JSX `ref` 属性形状检查仍有既有宽松边界，详见 [API 与类型约定](../guide/api-contracts.md)。

## 验证与限制

真实示例用于开发/生产 harness 与文档浏览器检查，覆盖语义标签、转义、标题层级、数字格式、原生 DOM 身份/焦点、列表增删重排、卸载重挂、复制命令结果、省略/展开、深浅主题、RTL、窄屏与自定义样式。系统剪贴板权限读取与测试替身证据分开记录；截图只代表实际查看的状态，不代表完整像素一致。

运行单测、严格类型、四条真实 tarball 消费者与逐文件四维覆盖率门禁后才能认定验收。保留 Vue 3.6.0-rc.9 / vue-jsx 3.3.0-rc.2 的严格 peer 安装限制，预编译消费者不替代独立 TSX 安装验证；不声明 SSR、水合、CJS 支持。生命周期和资源范围遵循[DOM 工具](../guide/dom.md)、[浮层容器与触发器](../guide/overlay.md)。

## 上游与同步维护

固定来源为 Semi `8bed560dd3f36579f85b7a522f19762f2bace756` 的 Typography 全族源码、类型、中文文档及 Foundation 2.103.0 格式算法/样式。普通文本使用 Vue 原生所有权；省略不支持复杂节点；Numeral 不递归改写原生 slot。这些差异与具名子路径适配登记在[完成度矩阵](../guide/upstream-matrix.md)，不以同名导出替代完整族验收。
