# Highlight 高亮文本

Highlight 将字符串中匹配的片段标记出来，适合搜索结果、关键词提示和正文中的重点文本。它不是代码语法高亮组件，不解析 HTML 或 Markdown，也不提供 CodeHighlight 的语言、行号等能力。

## 导入与样式

```tsx
import { Highlight } from "semi-ui-vue";
import HighlightFromPath from "semi-ui-vue/highlight";
import type { HighlightProps } from "semi-ui-vue/highlight";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/highlight.css";
```

也可使用完整样式入口 `semi-ui-vue/styles.css`。根入口具名导出 `Highlight`，子路径提供默认与具名导出。样式与来源参见[安装与样式](../guide/styles.md)。

## 基础文本与安全显示

<ClientOnly><VaporDemo example="highlight/Basic.vapor" /></ClientOnly>

`sourceString` 是原文，`searchWords` 是关键词数组。没有匹配时直接显示原文，空原文不生成内容。空关键词字符串忽略，重复、重叠和相邻的命中区间合并为一个片段，最终按原文顺序显示。

Highlight **没有外层根元素**：未命中部分是文本节点，命中部分默认用 `mark` 包裹。请像示例一样放在 `p`、`span` 等适当容器中；直接放到 flex 或 grid 容器可能把文本片段分成独立布局项。换行、长文本换行和溢出策略由调用方的容器 CSS 控制。

使用默认 `mark` 或可信的普通文本标签时，文本和关键词作为字符串处理，`<script>`、`<style>`、HTML 标签、实体和正则特殊字符不会被当成 HTML 解析。`component` 本身必须是开发者提供的可信标签，不能直接采用用户输入；生成高亮片段时，对 `script`、`style` 标签不区分大小写地抛出 TypeError，防止匹配文本被解释为脚本或样式。默认 `autoEscape=true` 将关键词作为字面文本匹配，`[a+b]` 匹配原样文本。默认不区分大小写，但保留原文大小写；不执行 Unicode 规范化、分词或字素簇分割。

## 自定义标签和关键词样式

<ClientOnly><VaporDemo example="highlight/Custom.vapor" /></ClientOnly>

`component` 指定**每个高亮片段**的原生标签，不是整个组件的根标签；字符串不会解析为应用注册的同名 Vue 组件。使用 `strong` 会改变语义，使用 `span` 不再有原生 `mark` 语义；请按内容含义选择。`component` 的声明仍为 `string`，没有新增公开标签白名单；这不意味着所有标签适合承载文字。`script`、`style` 明确拒绝且不会静默回退为 `mark`；void 标签可能无法显示文本，自定义元素自身的行为和生命周期由调用方负责。

关键词对象包含 `text`、可选 `className` 和 `style`。片段类名依次包含内置 `semi-highlight-tag`、`highlightClassName` 和关键词类名。`highlightStyle` 先应用，关键词 `style` 覆盖同名属性。区间合并时采用按起点稳定排序后的第一个非空关键词类名，后续区间样式覆盖前面同名属性；同起点的顺序由关键词数组和该关键词的匹配顺序决定。合并后不会为每个关键词保留独立嵌套元素。

`autoEscape=false` 将字符串作为 JavaScript 正则模式，使用全局标记 `g`，不区分大小写时额外使用 `i`。正则不启用 `u`，位置使用 UTF-16 编码单元；零长度匹配不生成高亮并向后推进。非法模式会抛出正则错误。仅将此模式用于经过审查的模式；组件不提供正则执行超时、灾难性回溯防护或异步中断。普通用户搜索输入应保留默认字面匹配。

## 动态更新与缺省值

<ClientOnly><VaporDemo example="highlight/Dynamic.vapor" /></ClientOnly>

修改原文、关键词数组、标签、大小写或转义选项都会重新计算并更新片段。示例支持清空文本、清空关键词、同一轮快速更新、卸载与重挂。组件没有本地输入状态，输入框属于示例容器。动态移除属性或显式传入 `undefined` 均恢复有效默认值；`component=""` 同样回退到 `mark`。

## 明暗主题、RTL 与窄屏

<ClientOnly><VaporDemo example="highlight/Theme.vapor" /></ClientOnly>

高亮颜色来自固定上游 Foundation CSS 和主题 tokens。示例使用局部主题容器、原生 `dir`、`white-space: pre-wrap` 与 `overflow-wrap: anywhere` 展示明暗、RTL、换行和窄屏长文本。Highlight 不读取 ConfigProvider 来自动增加容器或方向属性；阅读方向由真实 DOM 祖先决定，片段始终保持原文顺序。

## API

| 属性                 | 类型                                                                                              | 默认值   | 说明                                         |
| -------------------- | ------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| `sourceString`       | `string`                                                                                          | `''`     | 原文；不接受节点或 HTML                      |
| `searchWords`        | `(string \| { text: string; className?: string; style?: Record<string, string> } \| undefined)[]` | `[]`     | 字面关键词或关键词对象；请传有效字符串或对象 |
| `component`          | `string`                                                                                          | `'mark'` | 可信的高亮片段标签；拒绝 `script` / `style`  |
| `highlightClassName` | `string`                                                                                          | 无       | 与内置高亮类、关键词类合并                   |
| `highlightStyle`     | `CSSProperties`                                                                                   | 无       | 全局片段样式；关键词对象样式优先             |
| `caseSensitive`      | `boolean`                                                                                         | `false`  | 是否区分大小写                               |
| `autoEscape`         | `boolean`                                                                                         | `true`   | 是否转义关键词中的正则特殊字符               |

没有事件、v-model、slots、render callback、静态子组件或公开命令式 ref。上游原文与关键词均为字符串数据，没有 ReactNode/render callback 需要映射为 Vapor slot。不要传入 children 代替 `sourceString`。

上游 `SearchWord` 声明包含 `undefined`，但实际算法读取对象的 `text` 时会抛出 TypeError；这里保留该行为，不把无效成员静默改为空关键词。请在传入数组前过滤 `undefined`，并始终提供包含字符串 `text` 的对象。

不存在根容器，因此不提供 `class`、`style`、`className`、`id`、`aria-*`、`data-*` 或原生事件的属性透传。固定上游 runtime propTypes 虽列出 `className`、`style`，渲染不读取它们，正式 HighlightProps 也不包含它们。将这些属性放在自己的容器上；片段样式通过 `highlightClassName` / `highlightStyle` 设置。

## 无障碍与验证范围

默认 `mark` 保留原文中的标记语义，但高亮本身不会产生焦点、键盘交互或状态播报。需要宣告搜索结果变更时，请由业务容器提供合适的 `aria-live`，避免频繁更新造成冗余播报。原文中的标签和实体仍是可读文本，不成为可交互元素。

真实示例的文档浏览器检查见 `website/tests/highlight.spec.ts`，纯 Vapor 开发和生产构建端到端检查见 `tests/e2e/highlight.spec.ts`。局部截图用于检查匹配结构、动态更新、换行、明暗主题、RTL 与窄屏，不代表完整像素一致或跨浏览器一致。文档通过 ClientOnly 挂载真实 Vapor 示例；当前不声明组件 SSR、水合或 CJS 支持。Vue 3.6.0-rc.9 与 vue-jsx 3.3.0-rc.2 的独立编译器安装限制见[兼容边界](../guide/compatibility.md)。

## 来源与同步维护

契约依据 Semi Design 2.103.0 固定提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 `semi-ui/highlight/index.tsx`、完整中文文档、`semi-foundation/highlight/foundation.ts` 与对应 SCSS。匹配算法作为私有协作实现保留于组件内部，不扩大 Foundation 补丁或引入 React/lodash 运行时。与固定上游相比，Vapor 版显式拒绝 `script` / `style` 标签：真实浏览器探针验证了直接创建这些标签可能执行匹配文本或安装其 CSS，因此这是有意的安全差异；默认 `mark` 内的脚本和样式文本仍原样显示。来源登记和差异见[上游对齐与完成度](../guide/upstream-matrix.md)，产物消费边界见[本地产物与消费](../guide/packages.md)。
