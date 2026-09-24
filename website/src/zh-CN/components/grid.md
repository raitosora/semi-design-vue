# Grid 栅格：Row / Col

Row 与 Col 使用固定上游的 24 栅格样式组织页面区域。Col 必须位于 Row 的组件上下文内；Row 可以嵌套，每层间距独立。栅格仅负责布局，不提供交互控件的语义与焦点管理。

## 导入与样式

```ts
import { Row, Col } from "semi-ui-vue";
import {
  Row as NamedRow,
  Col as NamedCol,
  type RowProps,
  type ColProps,
  type ColSize,
  type Breakpoint,
  type Gutter,
} from "semi-ui-vue/grid";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/grid.css";
```

根入口具名导出 `Row`、`Col` 组件值；`semi-ui-vue/grid` 子路径导出两个具名组件及类型，不提供默认导出。完整样式入口 `semi-ui-vue/styles.css` / `semi-ui-vue/styles/index.css` 已包含栅格样式；选择完整入口时无需重复引入分项 CSS。组件入口用于浏览器原生 Vapor；当前没有组件 SSR、水合或 CJS 支持，见[本地产物与消费](../guide/packages.md)。

## 栏宽、偏移与排列

<ClientOnly><VaporDemo example="grid/Basic.vapor" /></ClientOnly>

每行分为 24 份。`span={12}` 占半行；同一行的列宽和超过 24 时按浏览器浮动或 Flex 换行。普通 Row 使用上游的块级布局和浮动列；`type="flex"` 时启用 Flex 换行，`justify` 与 `align` 才产生排列和交叉轴对齐效果。`order` 的视觉顺序不会更改 DOM 顺序、朗读顺序和键盘顺序。

`offset` 设置左侧空格，`push` / `pull` 用相对定位移动列。它们的数字对应 24 等分中的格数，不会改变列自身在文档流内的占位。样式只生成 1～24 格的对应规则；基础 `span={0}` 和响应式 `span: 0` 类先设置 `display: none`，但更高断点的正数宽度类可按固定 CSS 顺序重新显示该列。常规 `order`、`offset`、`push`、`pull` 的 0 值不生成基础修饰类，响应式对象中的 0 值则保留修饰类，沿用固定上游的类名判断。

## Gutter 与响应式断点

<ClientOnly><VaporDemo example="grid/Responsive.vapor" /></ClientOnly>

`gutter` 支持数字、断点对象，或 `[横向, 纵向]` 两项数组。单个数字或对象只设置横向间距；数组的第二项设置纵向间距。横向正间距由 Row 左右负半边距与 Col 左右半内边距配对实现；纵向正间距相应作用于上下方向。`0` 不生成内联间距覆盖，沿用样式表的基础 gutter。传给 Row/Col 的 `style` 最后合并，可覆盖计算出的 margin/padding。嵌套 Row 只提供自己的 gutter 给内部 Col。

对象 gutter 在当前匹配的断点中按 `xxl → xl → lg → md → sm → xs` 查找第一个已定义值，不把多个值相加。缺少对应值时为 0。Row 在挂载时按浏览器的实际媒体查询测量，视口改变后响应式 gutter 更新；Col 的响应式类由 CSS 媒体查询生效，无需在组件中计算列宽。固定阈值如下：

| 断点  | 匹配范围                                   |
| ----- | ------------------------------------------ |
| `xs`  | 视口宽度 ≤575px；`xs` 列类作为基础规则存在 |
| `sm`  | ≥576px                                     |
| `md`  | ≥768px                                     |
| `lg`  | ≥992px                                     |
| `xl`  | ≥1200px                                    |
| `xxl` | ≥1600px                                    |

上游中文文档的 `sm ≥575px` 是边界笔误；源码媒体查询和 SCSS 均为 576px。Grid 使用固定上游断点，不读取 `ConfigProvider.responsiveMap`。ConfigProvider 的方向会通过其外层 DOM 与上游 RTL 规则影响 Grid，但不会改写断点。响应式 Col 可以写成 `sm={12}`，也可传入含 `span`、`offset`、`order`、`push`、`pull` 的对象；各断点设置由 CSS 级联决定，未指定的字段不会自动清除较低断点的规则。

## 动态内容、嵌套与 RTL

<ClientOnly><VaporDemo example="grid/Dynamic.vapor" /></ClientOnly>

默认 slot 使用原生 Vapor 渲染函数，可返回 fragment、多根元素、条件内容及稳定 key 的列表。Row/Col 不提前执行 slot、不遍历或克隆 VNode；保留的子组件在改变 gutter、列列表和可见性时保持状态与焦点。卸载再挂载会创建新的子实例。独立 Col 缺少父级 Row 上下文，会抛出错误。

固定上游的 `.semi-rtl` / `.semi-portal-rtl` 规则使 Row 使用 RTL 方向、浮动列靠右，并反转非零 offset 的一侧。`ConfigProvider direction="rtl"` 可提供外层 RTL 类；Row/Col 自身不会自动写入 `dir`。在窄屏下，请以实际视口和容器宽度检查换行与溢出；Row 的负边距也要纳入外层容器的布局预算。

## Row API

| 属性        | 类型                                                                | 默认值   | 说明                                                     |
| ----------- | ------------------------------------------------------------------- | -------- | -------------------------------------------------------- |
| `type`      | `'flex'`                                                            | 无       | 启用 Flex 模式；缺省使用普通栅格                         |
| `align`     | `'top' \| 'middle' \| 'bottom'`                                     | 无       | Flex 交叉轴对齐，须与 `type="flex"` 配合                 |
| `justify`   | `'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between'` | 无       | Flex 主轴排列，须与 `type="flex"` 配合                   |
| `gutter`    | `Gutter \| [Gutter, Gutter]`                                        | `0`      | `Gutter = number \| Partial<Record<Breakpoint, number>>` |
| `prefixCls` | `string`                                                            | `'semi'` | 类名前缀；自定义时须自行提供对应栅格 CSS                 |
| `className` | `string`                                                            | 无       | 与内部类名及 Vue `class` 合并的兼容别名                  |
| `class`     | Vue `HTMLAttributes['class']`                                       | 无       | 根 div 的原生 class 绑定                                 |
| `style`     | Vue `HTMLAttributes['style']`                                       | 无       | 根 div 样式，优先于计算出的 gutter margin                |

缺省或显式 `undefined` 的 gutter 均按 0 处理。动态移除属性后恢复相应默认行为。Row 不读取 `semiGlobal.overrideDefaultProps`，不提供 `wrap`、`columns` 或自定义断点 props。`prefixCls` 按上游可改变生成类名，只有默认 `semi` 前缀有随包提供的固定样式。

## Col API

| 属性                                     | 类型                          | 默认值   | 说明                                                      |
| ---------------------------------------- | ----------------------------- | -------- | --------------------------------------------------------- |
| `span`                                   | `number`                      | 无       | 占位格数；0 隐藏列                                        |
| `offset`                                 | `number`                      | 无       | 左侧偏移格数                                              |
| `order`                                  | `number`                      | 无       | Flex 项视觉顺序                                           |
| `push` / `pull`                          | `number`                      | 无       | 相对原位置左右移动的格数                                  |
| `xs` / `sm` / `md` / `lg` / `xl` / `xxl` | `number \| ColSize`           | 无       | 响应式占位数或 `{ span?, order?, offset?, push?, pull? }` |
| `prefixCls`                              | `string`                      | `'semi'` | 类名前缀；须与 Row 和实际 CSS 保持一致                    |
| `className`                              | `string`                      | 无       | 与内部类名及 Vue `class` 合并的兼容别名                   |
| `class`                                  | Vue `HTMLAttributes['class']` | 无       | 根 div 的原生 class 绑定                                  |
| `style`                                  | Vue `HTMLAttributes['style']` | 无       | 根 div 样式，优先于父级 gutter 生成的 padding             |

两者的安全 HTML attrs（例如 `id`、`title`、`role`、ARIA、data 属性和原生事件）转发到各自根 div。`innerHTML` / `textContent` 不在公开类型或透传集合内，以保护 slot 内容所有权。`RowSlots.default` 和 `ColSlots.default` 均为无参数的原生 Vapor 渲染函数；没有命名 slot、v-model、组件自定义事件、静态成员或公开命令式 ref 方法。

## 无障碍与验证边界

Row/Col 输出普通 div，不自动设置 `role`、ARIA 名称或 `tabindex`。若列中有操作，应使用有名称的原生按钮、链接等元素；视觉排序不应承担阅读顺序。Grid 不拦截事件，也不管理焦点。

本页契约依据 Semi Design `2.103.0` 固定提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 `grid/row.tsx`、`grid/col.tsx`、中文文档、导出和 Foundation Grid SCSS。`website/tests/grid.spec.ts` 在真实 Chromium 的开发和生产路径检查计算样式、列宽、偏移、排序、gutter、断点边界、连续缩放、嵌套、RTL、窄屏、无障碍属性与截图。截图用于检查关键状态，不代表完整像素一致性、其他浏览器或真实移动设备验收。纯 Vapor 与普通 Vue interop 证据分别记录，见[兼容边界](../guide/compatibility.md)。
