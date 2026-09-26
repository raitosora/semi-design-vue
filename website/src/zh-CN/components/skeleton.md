# Skeleton 骨架屏

Skeleton 在内容等待期间显示占位结构。`Skeleton.Avatar`、`Skeleton.Title`、`Skeleton.Button`、`Skeleton.Paragraph`、`Skeleton.Image` 仅是骨架屏子组件，不是独立的公共 Avatar、Typography、Button 或 Image 实现。加载状态由调用方控制；Skeleton 不发起请求。

## 导入与样式

```tsx
import { Skeleton } from "semi-ui-vue";
import SkeletonFromPath from "semi-ui-vue/skeleton";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/skeleton.css";
```

也可使用完整样式入口 `semi-ui-vue/styles.css`。根入口的组件值为 `Skeleton`；五个占位子组件通过 `Skeleton.Avatar` 等静态成员使用，不代表根入口额外导出同名独立组件。子路径有默认与具名 `Skeleton` 导出。浏览器组件采用原生 Vapor；当前不声明组件 SSR、水合或 CJS 支持，参见[本地产物与消费](../guide/packages.md)。

## 基础占位与组合

<ClientOnly><VaporDemo example="skeleton/Basic.vapor" /></ClientOnly>

头像、标题、按钮、图像和段落的默认背景来自上游 Foundation 主题 token。`Skeleton.Image` 默认为父容器的 100% 宽高，因此需给它或父容器明确高度；默认 `Skeleton.Title` 为 100% 宽、24px 高，`Skeleton.Button` 为 115px × 32px。`Skeleton.Avatar` 默认 `medium`、`circle`，宽高 48px。`Skeleton.Paragraph` 默认四行，每行高 16px、相邻间距 10px；末行通常为 60% 宽，单行同时符合首行 100% 宽规则。可用 `style` 调整尺寸。

`Skeleton` 在 `loading=true` 时显示 `placeholder` 命名 slot 的内容，并为它提供 `.semi-skeleton` 根容器；在 `loading=false` 时显示 default slot 的真实内容。两支内容是互斥的，切换会卸载旧分支再挂载新分支；放在分支内的组件状态和焦点不会跨分支保留。没有 `placeholder` slot 时加载根仍存在，但不会自动生成占位结构。五个子组件可独立渲染；离开 `.semi-skeleton-active` 祖先后不运行高亮动画。

## 加载切换与动态更新

<ClientOnly><VaporDemo example="skeleton/Dynamic.vapor" /></ClientOnly>

示例同时更新 `loading`、`active`、段落行数和头像形状，并可卸载整个 Skeleton 后重新挂载。自定义 placeholder 返回多个根节点；真实内容包含可聚焦输入框和计数按钮。切回占位时真实内容被卸载，重新显示后计数从零开始。业务层的 `aria-busy` 和状态文字由示例显式提供，不能用占位块本身代替加载状态播报。

`loading` 缺省或显式 `undefined` 都使用默认 `true`；`active` 缺省、显式 `undefined` 为关闭。动态移除这些属性会回到默认行为。`rows={0}` 不生成行，负值或非整数不是推荐的页面输入；上游声明为 `number`，但未定义此类值的产品语义。自定义宽高的零值是有效 CSS 值，不能当作未传入。

## 动画、主题、RTL 与窄屏

<ClientOnly><VaporDemo example="skeleton/Theme.vapor" /></ClientOnly>

`active` 在根上添加 `.semi-skeleton-active`。固定上游 Foundation CSS 为后代占位块使用 1400ms 的循环渐变动画；组件没有 JS 定时器或动画句柄，`active` 更新与卸载不需要额外释放。组件本身不提供减少动态效果的属性；需要遵循用户减少动态效果偏好时，请在应用样式中覆盖动画。

占位颜色使用 `--semi-color-fill-0` 和 `--semi-color-fill-1`。示例切换局部明暗主题及 `ConfigProvider` 方向，并限制容器宽度来观察窄屏布局。Skeleton 不会自行改写文本方向；RTL 由上层方向上下文及上游样式决定。占位尺寸大于窄屏容器时，调用方应限制宽度或选择滚动策略。

## Skeleton API

| 属性                         | 类型                   | 默认值  | 说明                               |
| ---------------------------- | ---------------------- | ------- | ---------------------------------- |
| `loading`                    | `boolean \| undefined` | `true`  | 显示占位分支；`false` 显示真实内容 |
| `active`                     | `boolean \| undefined` | `false` | 给占位后代启用 CSS 高亮动画        |
| `className`                  | `string`               | 无      | 与内置类和 Vue `class` 合并        |
| `class`                      | Vue HTML class         | 无      | 加载状态下根容器类名               |
| `style`                      | Vue HTML style         | 无      | 加载状态下根容器样式               |
| `role` / `aria-*` / `data-*` | 相应原生属性           | 无      | 加载状态下的根容器透传属性         |

`placeholder` 与真实内容分别使用无参数的原生 Vapor 命名 `placeholder` slot 和 `default` slot，代替上游 ReactNode props。只在 `loading=true` 时有根容器；`loading=false` 时直接返回真实内容，根的 class、style 与原生属性不会包裹或转发给真实内容。没有组件自定义事件、v-model 或公开命令式 ref。

```tsx
<Skeleton
  loading={busy.value}
  v-slots={{
    placeholder: () => <Skeleton.Paragraph rows={3} />,
    default: () => <article>实际内容</article>,
  }}
/>
```

Slot 返回原生 Vapor 渲染结果；多根内容可用 fragment，文本需放入元素。不要传 ReactNode、原始 `children`/`placeholder` 元素、Promise 或 VNode 克隆。动态内容由拥有该 slot 的组件负责，Skeleton 不会预执行 slot 探测内容。

## 占位子组件 API

| 子组件               | 主要属性                                                                                                                                        | 默认值             | 根元素与行为             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------ |
| `Skeleton.Avatar`    | `size`：`'extra-extra-small' \| 'extra-small' \| 'small' \| 'default' \| 'medium' \| 'large' \| 'extra-large'`；`shape`：`'circle' \| 'square'` | `medium`；`circle` | `div`；对应尺寸与形状类  |
| `Skeleton.Title`     | `prefixCls`、`type`、`className`、`style`                                                                                                       | `type='title'`     | `div`；默认 100% × 24px  |
| `Skeleton.Button`    | `prefixCls`、`type`、`className`、`style`                                                                                                       | `type='button'`    | `div`；默认 115px × 32px |
| `Skeleton.Image`     | `prefixCls`、`type`、`className`、`style`                                                                                                       | `type='image'`     | `div`；默认 100% × 100%  |
| `Skeleton.Paragraph` | `rows: number`；`prefixCls`、`className`、`style`                                                                                               | `rows=4`           | `ul` 和对应数量的空 `li` |

所有子组件均接受 Vue `class` 和 `style`；`className` 与内置类型类合并，`style` 可覆盖 Foundation 尺寸。`prefixCls` 默认 `semi-skeleton`；自定义前缀需要配套 CSS。Avatar 也继承 `prefixCls`、`type`、`className` 和 `style`，默认 `type='avatar'`。四个 `div` 子组件的 `type` 改变类型类名，非内置类型需要配套 CSS；Paragraph 的上游基础类型声明也含 `type`，但实际渲染固定使用 `-paragraph` 类，不读取该字段。Avatar 的尺寸集合依据固定上游 `avatar/constants.ts`：其中 `default` 虽存在于源码允许值中，但 Skeleton SCSS 没有对应 `-avatar-default` 尺寸规则；需要稳定尺寸请使用其余明确尺寸。`shape` 只影响 Avatar，不扩展到 Image、Title 或 Button。Paragraph 的 `rows` 可动态更新，`rows={0}` 生成空列表。以上字段缺省或显式 `undefined` 均恢复各自有效默认值。

固定上游的四个 `div` 子组件若显式传入 `type={undefined}`，生成器的属性展开会覆盖默认类型并在后续字符串处理时报错。Vapor 版把显式 `undefined` 视为缺省值，恢复各子组件的内置类型；动态移除 `type` 也遵循此规则。这是有意的 Vue 差异。

这些占位子组件仅构成视觉结构，默认没有可访问名称、加载状态或键盘行为。为加载区域提供有意义的状态文字、`aria-busy` 或命名 region 时，应在应用容器上明确设置，并在真实内容切换时同步更新。占位元素不需要进入 Tab 顺序。

## 来源与验证边界

契约依据 Semi Design 2.103.0 固定提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 `skeleton/index.tsx`、`skeleton/item.tsx`、中文文档、`avatar/constants.ts` 与 Foundation 的 `skeleton.scss` / `animation.scss`。上游 `placeholder`/`children` ReactNode 改为 Vapor slots；子组件仍是 Skeleton 静态成员。更多来源差异见[上游对齐与完成度](../guide/upstream-matrix.md)。

真实示例、浏览器断言及局部截图覆盖加载分支、实际内容、子组件、动态更新、动画、RTL 与窄屏；截图不代表跨浏览器或完整像素一致。当前包保持 private，Vue 3.6.0-rc.9 与 vue-jsx 3.3.0-rc.2 的独立 TSX 消费者安装限制仍见[兼容边界](../guide/compatibility.md)。
