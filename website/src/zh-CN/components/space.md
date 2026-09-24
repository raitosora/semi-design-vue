# Space 间距

Space 将相邻内容放在同一个弹性布局容器中，通过 CSS gap 设置间距。适合一组按钮、标签或简短信息的排列。Space 不创建子项包裹元素，也不控制子组件的状态或焦点。

## 导入与样式

```ts
import { Space } from "semi-ui-vue";
import SpaceFromPath, {
  Space as NamedSpace,
  type SpaceProps,
  type SpaceSlots,
  type Align,
  type Spacing,
} from "semi-ui-vue/space";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/space.css";
```

根入口具名导出 `Space` 组件值；类型由 `semi-ui-vue/space` 子路径导出。默认和具名子路径导出指向同一实现。完整 `semi-ui-vue/styles.css` / `semi-ui-vue/styles/index.css` 已包含 Space 样式，勿与分项 CSS 重复加载。这些入口用于浏览器原生 Vapor；当前不提供组件 SSR、水合或 CJS，见[本地产物与消费](../guide/packages.md)。

## 方向、间距与对齐

<ClientOnly><VaporDemo example="space/Basic.vapor" /></ClientOnly>

默认水平排列、居中对齐，间距为 `tight`。固定主题下 `tight`、`medium`、`loose` 分别是 8px、16px、24px；定制主题可以改变这些 Sass 变量。单个数字同时设置行、列间距；数组的前两项 `[横向, 纵向]` 分别设置 `column-gap`、`row-gap`，每项可用预设或数字。上游类型接受任意长度数组，但运行时仅读取前两项；空数组不生成预设或内联 gap。数字 `0` 表示零间距。`style` 可覆盖预设类名的 gap；数字间距按上游计算为内联样式，优先于传入的同名 style 字段。

`vertical` 改变主轴为列。`align` 控制交叉轴上的项目对齐；`wrap` 只在水平排列时启用。Space 根节点使用 `display: inline-flex`，因此宽度由内容决定；需要填满容器或限制宽度时，由调用方设置样式或外层容器。

## 动态内容与嵌套

<ClientOnly><VaporDemo example="space/Dynamic.vapor" /></ClientOnly>

默认 slot 必须是原生 Vapor 渲染函数；可返回 fragment、多根元素、条件元素和稳定 key 的列表。Space 让 slot 自己管理内容，不提前执行 slot，也不遍历 VNode。条件项消失、列表增删或重排后，由浏览器的 flex gap 对当前布局中的项目自动计算间距。空 slot 不会创建子项包裹元素；非空白文本形成匿名 flex 项，纯空白文本节点不会额外占用一个间距，注释节点不参与布局。空元素本身仍是一个 flex 项。需要表达条件内容时，请使用条件元素，而非空格占位。

改变方向、间距或对齐只更新容器样式，不应重建仍存在的子组件；示例可通过内容计数与焦点验证。卸载 Space 会按 Vue 生命周期卸载其 slot 内容，重新挂载会创建新实例。嵌套 Space 是普通嵌套弹性容器，内外间距独立。

## 换行、RTL 与窄屏

<ClientOnly><VaporDemo example="space/Responsive.vapor" /></ClientOnly>

水平 `wrap` 允许项目换行；垂直模式即使设置 `wrap` 也不启用换行类。`ConfigProvider` 在外层容器设置方向时，Space 随 CSS 继承 `direction`，但自身不读取配置上下文，也不自动写入 `dir` 属性。固定上游的 RTL 样式也支持 `.semi-rtl` / `.semi-portal-rtl` 容器。窄屏下是否出现多行取决于容器宽度、子项尺寸及浏览器 flex 排版。不要将截图断言视为完整像素一致性验证。

## API

| 属性        | 类型                                         | 默认值     | 说明                                                                                |
| ----------- | -------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `vertical`  | `boolean`                                    | `false`    | 列方向排列；否则为行方向                                                            |
| `wrap`      | `boolean`                                    | `false`    | 水平模式允许换行；垂直模式不生效                                                    |
| `align`     | `'start' \| 'center' \| 'end' \| 'baseline'` | `'center'` | 交叉轴对齐                                                                          |
| `spacing`   | `Spacing \| Spacing[]`                       | `'tight'`  | 预设、像素数字或数组前两项；`Spacing` 为 `'tight' \| 'medium' \| 'loose' \| number` |
| `className` | `string`                                     | 无         | 与内部类名及 Vue `class` 合并的兼容别名                                             |
| `class`     | Vue `HTMLAttributes['class']`                | 无         | 原生 class 绑定                                                                     |
| `style`     | Vue `HTMLAttributes['style']`                | 无         | 根节点样式；数字 spacing 生成的 gap 优先                                            |

缺省及显式 `undefined` 使用同一默认值；动态移除属性后恢复默认行为。`data-*` 属性转发至根 div；没有上游自定义事件、v-model、命名 slot、静态子组件或公开 ref 方法。`SpaceSlots.default?: () => VaporRenderResult` 是唯一 slot。Space 不读取 `semiGlobal.overrideDefaultProps`，不新增 `size`、`direction`、`separator` 或 `itemStyle` 等属性。

## 无障碍与语义

固定上游是普通 div，不自动设置 `role`、`tabindex` 或 ARIA 名称。Space 仅改变视觉间距，不改变子项语义。需要一组可访问操作时，在外层使用适当的原生语义元素，例如带名称的 `nav`；按钮、链接及其键盘行为仍由子项负责。Space 不拦截事件或转移焦点。

## 来源、验证与限制

契约依据 Semi Design `2.103.0`、固定提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 中 Space 的源码、导出、中文文档、Foundation 常量及 SCSS。Space 没有 Foundation 状态机；Vapor 实现使用原生 slot 和 CSS gap，不移植 React `Children.forEach` 或 fragment 扁平化。React 子项的表示与 Vapor DOM 不同，空白和文本间距遵循浏览器 flex 布局，是明确的适配边界。

`website/tests/space.spec.ts` 与 `tests/e2e/space.spec.ts` 在真实 Chromium 的开发与生产路径检查 DOM、计算样式、动态内容、RTL、窄屏和截图。截图覆盖关键状态，不代表完整像素一致、Firefox/WebKit 或真实移动设备验收。纯 Vapor 与普通 Vue interop 的证据分别登记，范围见[兼容边界](../guide/compatibility.md)与[完成度矩阵](../guide/upstream-matrix.md)。
