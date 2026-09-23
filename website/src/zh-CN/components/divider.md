# Divider 分割线

Divider 用水平或垂直线分隔内容，也可在水平线上显示文字或自定义内容。它是视觉布局组件，没有状态控制、焦点管理或键盘操作。

## 导入与样式

```ts
import { Divider } from "semi-ui-vue";
import DividerFromPath, {
  Divider as NamedDivider,
  type DividerProps,
  type DividerSlots,
} from "semi-ui-vue/divider";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/divider.css";
```

根入口仅具名导出 `Divider` 的组件值。`DividerProps` 与 `DividerSlots` 从 `semi-ui-vue/divider` 子路径导入，不在根入口导出。默认和具名 Divider 指向同一实现；没有静态子组件或公开 ref 方法。完整 `semi-ui-vue/styles.css` / `semi-ui-vue/styles/index.css` 也包含分割线样式，勿与分项入口重复加载。

这些入口用于浏览器原生 Vapor；纯 Node 根入口不导出 Divider。当前没有 CJS、组件 SSR 或水合支持，见[本地产物与消费](../guide/packages.md)。

## 水平、垂直与间距

<ClientOnly><VaporDemo example="divider/Basic.vapor" /></ClientOnly>

`layout` 默认为 `horizontal`，`dashed` 默认不启用。水平线默认占满可用宽度；垂直线沿用固定上游的 20px 高度，可用 `style` 调整。`margin` 为水平线设置上下间距，为垂直线设置左右间距；数字按像素设置，字符串交给 CSS 解析。`style` 最后合并，因此可覆盖 `margin` 生成的某一侧样式。`margin={0}` 保留零间距；空字符串交给浏览器处理，不当作缺省值。

## 文字与动态内容

<ClientOnly><VaporDemo example="divider/Content.vapor" /></ClientOnly>

原生 Vapor 内容通过函数形式的默认 slot 传入。文本可放在 fragment 内；不能直接返回原始字符串、VNode、ReactNode 或 Promise。

```tsx
<Divider align="left" margin={16}>
  {() => <>分组标题</>}
</Divider>
```

`align` 为 `left`、`center` 或 `right`，只影响带有效内容的水平线。纯文本使用带 `semi-divider_inner-text` 与 `x-semi-prop="children"` 的 span；复杂内容使用稳定的 `display: contents` 插槽容器，由内容自己提供所需间距。不会预执行 slot 探测内容，也不会缓存或克隆渲染节点。

内容分类依据实际挂载的 DOM：忽略注释和长度为零的文本，保留空格文本；条件内容清空后恢复普通线条。数字 `0` 会显示并启用文字布局，这是对上游 React `children` 真值判断的明确差异。空元素仍算有效内容，隐藏元素也不会被推断为空。分类在挂载或内容变更后的 DOM 观察阶段更新，程序读取应等待更新完成。

垂直方向不挂载默认 slot。水平切换为垂直会卸载内容，恢复水平时新建内容实例；仅更改文字位置、边框或间距保留当前内容实例。卸载 Divider 会断开所属 DOM 观察，重挂会重新建立状态。

## 主题、RTL 与窄屏

<ClientOnly><VaporDemo example="divider/Theme.vapor" /></ClientOnly>

颜色跟随容器的 `--semi-color-border` 与 `--semi-color-text-0`。局部深浅主题用 `semi-always-light` / `semi-always-dark`；ConfigProvider 在外层容器动态设置 `direction`，Divider 通过 CSS 继承方向；它不读取配置上下文，也不会把方向自动写到自己的根属性。ConfigProvider 不注入 Divider props、修改前缀或控制主题。显式根 `dir` 属性可覆盖继承方向。

文字布局沿用上游 `white-space: nowrap` 和左右短线规则：RTL 下受容器方向影响，不新增逻辑 `start` / `end` API。短标题在窄屏下可正常布局，超长内容不会自动省略或折行，应由调用方约束内容或容器。类名前缀固定为 `semi-*`；定制 SCSS 前缀只改变 CSS 输出，不会自动改写组件 DOM，见[定制主题](../guide/theme.md)。

## API

| 属性        | 类型                            | 默认值         | 说明                                                                     |
| ----------- | ------------------------------- | -------------- | ------------------------------------------------------------------------ |
| `align`     | `'left' \| 'center' \| 'right'` | `'center'`     | 带内容水平线的文字位置                                                   |
| `layout`    | `'horizontal' \| 'vertical'`    | `'horizontal'` | 分割方向；垂直方向不挂载内容                                             |
| `dashed`    | `boolean`                       | `false`        | 水平、垂直及带文字两侧线条使用虚线                                       |
| `margin`    | `number \| string`              | 无             | 水平时上下间距，垂直时左右间距；未指定时使用上游 CSS                     |
| `className` | `string`                        | 无             | 与内部类名和 Vue `class` 合并的兼容别名                                  |
| `class`     | Vue `HTMLAttributes['class']`   | 无             | 支持 Vue 原生 class 绑定                                                 |
| `style`     | Vue `HTMLAttributes['style']`   | 无             | Vue 原生 StyleValue 适配，支持对象、字符串和数组，优先于 `margin` 生成值 |

`align`、`layout` 的显式 `undefined` 与缺省使用相同默认值；`dashed={undefined}` 不启用虚线，`margin={undefined}` 不生成间距覆盖。动态移除属性后恢复相应默认行为。Divider 不读取 `semiGlobal.overrideDefaultProps`，没有 `text`、`children`、`prefixCls` 或额外配置 props。

`DividerSlots.default?: () => VaporRenderResult` 提供内容，无参数和返回值业务回调。没有命名 slots、v-model、受控值、组件自定义事件、静态成员或公开 imperative API。安全的 Vue `HTMLAttributes`（含 `id`、`title`、`dir`、ARIA、data 属性及原生事件）转发到根 div；`className` 不作为 DOM 属性透传。`innerHTML` 和 `textContent` 不在公开类型中，运行时也不透传，以保护插槽内容所有权。

## 无障碍与语义

固定上游输出 div，默认不加 `role`、`tabindex` 或可访问名称。装饰性线条无需加入键盘焦点序列；当内容需要结构分隔语义时，可显式设置 `role="separator"`、`aria-orientation="horizontal"` 或 `"vertical"`，必要时提供 `aria-label`。这些是调用方的原生属性，不会随 `layout` 自动推导。复杂 slot 中的交互控件由自身负责名称、键盘与焦点。

## 来源、验证与限制

契约依据 Semi Design `2.103.0`、固定提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 Divider 源码、导出、中文文档及 SCSS。上游 Divider 没有 Foundation 状态机；本实现复用固定样式与原生方向继承，不创建多余 Foundation 实例，不改写 ButtonGroup 的私有分隔线。

真实示例由 `website/tests/divider.spec.ts` 和 `tests/e2e/divider.spec.ts` 在开发与生产浏览器路径执行；组件回归另覆盖缺省/显式 undefined、空与动态 slot、生命周期、类型正反例和真实 tarball 消费。截图与计算样式检查覆盖关键 DOM/CSS、水平垂直、文字定位、明暗、RTL 和窄屏，不代表完整像素一致性、Firefox/WebKit 或真实移动硬件验收。纯 Vapor 与普通 Vue interop 的证据分别登记，完整范围见[兼容边界](../guide/compatibility.md)与[完成度矩阵](../guide/upstream-matrix.md)。
