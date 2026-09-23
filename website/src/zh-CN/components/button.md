# Button 按钮

Button 使用原生 `button` 触发操作或提交表单。`ButtonGroup` 为一组直接 Button 子项提供共享视觉字段，`SplitButtonGroup` 负责相邻原生按钮的首尾圆角。

## 导入与样式

```ts
import { Button, ButtonGroup, SplitButtonGroup } from "semi-ui-vue";
import ButtonFromPath, {
  ButtonGroup as ButtonGroupFromPath,
  SplitButtonGroup as SplitButtonGroupFromPath,
} from "semi-ui-vue/button";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/button.css";
```

也可单独从 `semi-ui-vue/button/buttonGroup` 或 `semi-ui-vue/button/splitButtonGroup` 导入对应组合组件。完整样式入口 `semi-ui-vue/styles.css` 同样包含本组件。生成图标无需额外包装样式；使用公开 `Icon` 包装时再引入 `styles/components/icons.css`。

这些入口是浏览器原生 Vapor 路径。纯 Node 根入口不导出组件，当前没有 CJS、SSR 或水合支持；包仍为 private，未来统一使用 `@raitosora` scope，详见[本地产物与消费](../guide/packages.md)。

## 基础用法

<ClientOnly><VaporDemo example="button/Basic.vapor" /></ClientOnly>

Button 默认是 `primary`、`light`、`default` 尺寸和原生 `type="button"`。`text` 是纯文本快捷方式；复杂内容放在默认 slot。原生 Vapor 的 `default` slot 必须是函数。

```tsx
<Button v-slots={{ default: () => <strong>保存</strong> }} />
```

## 状态、图标和表单

<ClientOnly><VaporDemo example="button/StateForm.vapor" /></ClientOnly>

图标使用 `icon` scoped slot。需要多彩图标时，slot 参数的只读 `fill` 数组必须由 SVG 自己消费；组件不会克隆图标节点或补 `aria-hidden`，装饰性图标由 icon slot 自己设置 `aria-hidden`。只有图标的按钮必须给出 `aria-label`。

`loading=true` 显示加载图标并用 CSS 阻止指针交互，但保持原生键盘和程序 `click()` 语义；需要完全禁用时设置 `disabled=true`。disabled 优先显示原图标，且由原生 `disabled` 阻止交互。`htmlType="submit"` 和 `htmlType="reset"` 保留原生表单行为。

## 组合与动态内容

<ClientOnly><VaporDemo example="button/Groups.vapor" /></ClientOnly>

ButtonGroup 通过 Vapor 上下文适配**直接公开 Button** 子项：`disabled`、`size`、`type` 只补充 child/global 均未提供的字段，`theme` 与 `colorful` 在 group own key 存在时覆盖 child/global 值。已注册的原生 `button` 必须是 group DOM 的直接子项；包装节点内的 Button 不继承组字段。自定义组件不按组件类型识别或 clone；若它最终直接返回一个已注册的 Button 根，仍参与该 DOM 直接子项协议。嵌套组管理自己的直接 Button。动态直接子项会在挂载、更新和卸载时重新计算组合分隔线；初次挂载后应等待一次 `nextTick` 再读取继承属性、分隔线或首尾状态。注释和空分支忽略，Button 后有真实非 Button 节点时仍保留该 Button 的分隔线。组合嵌套保留各自的 `role="group"` 和可访问名称。

SplitButtonGroup 不含 Dropdown 或菜单行为，只为后代实际原生 `button` 标记首尾样式；运行时新增或删除按钮会同步更新。嵌套 SplitButtonGroup 中的按钮归最近的 split 容器，不与外层共同计算首尾。方向由 ConfigProvider 的 `direction` 传递，文案由调用方或 locale 显式选择，组件不会据 locale 推断 RTL。

## API

### Button

除下列字段外，安全的 Vue `ButtonHTMLAttributes`（例如 `id`、`name`、`value`、`form`、`tabindex`、`title`、ARIA、data 属性和原生 `onClick`）会传给根 button。`type` 是视觉类型，原生 type 使用 `htmlType`。

| 属性                           | 类型                                                              | 默认值          | 说明                                                                                 |
| ------------------------------ | ----------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| `block`                        | `boolean`                                                         | `false`         | 撑满可用行宽                                                                         |
| `circle`                       | `boolean`                                                         | `false`         | 圆形按钮样式                                                                         |
| `disabled`                     | `boolean`                                                         | `false`         | 原生禁用，优先于 loading                                                             |
| `htmlType`                     | `'button' \| 'submit' \| 'reset'`                                 | `'button'`      | 根 button 的原生 type                                                                |
| `size`                         | `'default' \| 'small' \| 'large'`                                 | `'default'`     | 按钮尺寸                                                                             |
| `type`                         | `'primary' \| 'secondary' \| 'tertiary' \| 'warning' \| 'danger'` | `'primary'`     | 视觉类型                                                                             |
| `theme`                        | `'light' \| 'solid' \| 'borderless' \| 'outline'`                 | `'light'`       | 视觉主题                                                                             |
| `colorful`                     | `boolean`                                                         | `false`         | 启用固定上游多彩分支                                                                 |
| `loading`                      | `boolean`                                                         | `false`         | 显示加载图标，不禁用键盘或程序点击                                                   |
| `text`                         | `string \| number \| null`                                        | 无              | 默认内容的标量快捷方式                                                               |
| `iconPosition`                 | `'left' \| 'right'`                                               | `'left'`        | 图标与内容的相对位置                                                                 |
| `noHorizontalPadding`          | `boolean \| 'left' \| 'right' \| readonly ('left' \| 'right')[]`  | `false`         | 图标按钮的水平内边距控制                                                             |
| `iconSize`                     | `IconSize`                                                        | 无              | 保留的上游无操作字段；由 icon slot 自己设定尺寸                                      |
| `iconStyle`                    | `CSSProperties`                                                   | 无              | 保留的上游无操作字段；由 icon slot 自己设定样式                                      |
| `prefixCls`                    | `string`                                                          | `'semi-button'` | 无图标路径控制基础类前缀；有图标时仅控制 IconButton 装饰类，基础类仍为 `semi-button` |
| `contentClassName`             | `string`                                                          | 无              | 内容 span 的附加类                                                                   |
| `x-semi-children-alias`        | `string`                                                          | `'children'`    | 内容 span 的固定上游标记名                                                           |
| `class` / `className`、`style` | Vue 原生类型                                                      | 无              | 根元素附加样式                                                                       |

`default?: () => VaporRenderResult` 提供按钮内容；`icon?: (scope: { readonly fill: readonly string[] | undefined }) => VaporRenderResult` 提供图标。`fill` 是每次调用都存在的只读 scope key，值可为 `undefined`。slot 不接受原始字符串、VNode、Promise 或 ReactNode。没有 `children`、`icon` 节点 props、v-model、公开 ref 方法或静态子组件。

### ButtonGroup

| 属性                           | 类型           | 默认值      | 说明                                                                                            |
| ------------------------------ | -------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `disabled`                     | `boolean`      | 无          | group own key 存在时，只补充 child/global 均未提供的直接 Button                                 |
| `size`                         | Button `size`  | `'default'` | group own key 缺失时也向直接 Button 补充 `'default'`；显式值只补充 child/global 均未提供的字段  |
| `type`                         | Button `type`  | 无          | group own key 存在时，只补充 child/global 均未提供的直接 Button                                 |
| `theme`                        | Button `theme` | 无          | group own key 存在时覆盖直接 Button 的 child/global 值；显式 undefined 恢复 global 或基础默认值 |
| `colorful`                     | `boolean`      | 无          | group own key 存在时覆盖直接 Button 的 child/global 值；显式 undefined 恢复 global 或基础默认值 |
| `aria-label`                   | `string`       | 无          | `role="group"` 的可访问名称                                                                     |
| `class` / `className`、`style` | Vue 原生类型   | 无          | 容器附加样式                                                                                    |

只接受函数形式的 `default` slot。它不克隆 children、不接收 `Button.Group`，也不把字段传给任意嵌套元素。

### SplitButtonGroup

| 属性                           | 类型         | 默认值 | 说明                        |
| ------------------------------ | ------------ | ------ | --------------------------- |
| `aria-label`                   | `string`     | 无     | `role="group"` 的可访问名称 |
| `class` / `className`、`style` | Vue 原生类型 | 无     | 容器附加样式                |

只接受函数形式的 `default` slot。它没有下拉菜单、受控 visible、事件回调或公开 ref API。

## 导出、主题和兼容边界

根入口具名导出 `Button`、`ButtonGroup`、`SplitButtonGroup` 及其 props/slots 类型。`semi-ui-vue/button` 默认导出 Button，并具名导出三组件及 `BaseButtonProps`、`HorizontalPaddingType` 类型；两个 group 子路径各自默认导出其组件和对应 Props/Slots 类型。Button 提供静态只读 `elementType = 'Button'` 与 `__SemiComponentName__ = 'Button'`；组合组件没有静态成员，且没有 `Button.Group`。私有 BaseButton 的值不导出。

主题 tokens 跟随当前容器；可用 `semi-always-light` / `semi-always-dark` 做局部预览。ConfigProvider 只把已支持的方向上下文传入，不能改写 `prefixCls` 或注入 Button props。需要默认值时，使用 `semiGlobal.configure({ overrideDefaultProps: { Button: { ... } } })`：每个 Button 在 setup 时捕获该快照；child own 的非 `undefined` 值覆盖快照，own `undefined` 保留已有全局值。随后 group 只补充缺少的 disabled/size/type，而 group own theme/colorful 覆盖这些值；最后 BaseButton 补齐基础默认值。之后配置只影响新创建的 Button。主题插件需显式选择 `button` 样式入口，见[定制主题](../guide/theme.md)。

基准为 Semi Design `2.103.0` 提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 Button、ButtonGroup、SplitButtonGroup、按钮 SCSS 与 SpinIcon。React children / icon 节点映射为 text 和原生 Vapor slots；React cloneElement 组继承映射为直接子项的上下文协议。截图仅记录浏览器检查结果，不代表完整 Semi 像素一致性。
