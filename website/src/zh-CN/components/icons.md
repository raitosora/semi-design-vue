# Icon 图标

`Icon` 为任意 SVG 提供统一的尺寸、颜色、旋转和无障碍外层。资源包中的
`IconHome` 等组件仍然只输出原始 SVG；把它们放进 `Icon` 才会获得外层
`span`、具名尺寸和 spin 协议。

```ts
import { Icon } from "semi-ui-vue";
import { IconHome } from "semi-icons-vue";
import "semi-ui-vue/styles/components/icons.css";

<Icon aria-label="首页" size="large">
  {() => <IconHome aria-hidden="true" size="inherit" />}
</Icon>;
```

## 基础与工厂图标

<ClientOnly><VaporDemo example="icons/Basic.vapor" /></ClientOnly>

默认图标是装饰用途，输出 `aria-hidden="true"`。传入 `aria-label` 或
`aria-labelledby` 后自动输出 `role="img"`。`type` 仅生成 class，不会从资源
名称推导可访问名称；需要朗读时始终明确提供名称。原生 `role` 和 `aria-hidden`
属性可以覆盖默认结果。

`semi-icons-vue` 根入口还提供 `convertIcon(svg, type)`。它把一个具名 SVG slot
factory 封装成带 `elementType = "Icon"`、`getElement()` 的组件；factory 接收同一份
SVG 作用域而不检查或克隆渲染节点。上面示例的 `FactoryIcon` 就是完整的调用方式。

## 自定义 SVG 与渐变隔离

<ClientOnly><VaporDemo example="icons/CustomSvg.vapor" /></ClientOnly>

传入 `svg` 具名 slot 时优先于 default slot。slot 参数为
`{ size: "1em", fill, id }`：调用方将 `size` 写入 SVG 的宽高；`fill` 是只读颜色
数组，按需显式读取；`id` 是实例前缀。渐变、clipPath 等 SVG 定义都应使用它生成
本实例专属 ID，并在 `url(#...)` 中引用同一个 ID，避免多个图标互相引用。
原生 Vapor slot 的响应字段应通过 `scope.fill` 读取，不要解构 `fill` 后在闭包中使用，
否则会捕获初始值；即使 `size` 和 `id` 在当前实例中稳定，统一通过 `scope` 读取更安全。

## 尺寸、颜色、状态与按钮

<ClientOnly><VaporDemo example="icons/States.vapor" /></ClientOnly>

`size` 仅接受 `extra-small`、`small`、`default`、`large`、`extra-large`、`inherit`，
默认值为 `default`。任意尺寸请用 `style` 的 `fontSize: "30px"` 配合 `inherit`，
不传数字给 `size`。`color` 继承给内部 SVG；`spin` 默认 `false`，`rotate` 仅在安全
整数时生效。`prefixCls` 默认 `semi`，`className`、`style` 与其余原生 HTML 属性会传给
外层 `span`。

图标按钮的可访问名称应来自 `button`，内部图标保持 `aria-hidden="true"`，避免重复朗读。

## 可搜索资源目录

<ClientOnly><VaporDemo example="icons/Catalog.vapor" /></ClientOnly>

目录由锁定的 SVG manifest 生成，包含 523 个图标、84 个实验图标和 16 个插画。
可以按导出名和资源包过滤，并选择任一结果加载实际 SVG 预览；资源模块按选择动态
导入，初始示例不会打包全部 623 个资源。每项同时给出根具名导出对应的名称子路径：
`<包名>/<名称>` 默认导入。

## API

| 名称                  | 类型 / 默认值                  | 说明                                      |
| --------------------- | ------------------------------ | ----------------------------------------- |
| `size`                | `IconSize` / `default`         | 六个具名尺寸。                            |
| `spin`                | `boolean` / `false`            | 是否应用旋转动画。                        |
| `rotate`              | `number`                       | 仅安全整数角度生效。                      |
| `prefixCls`           | `string` / `semi`              | class 前缀。                              |
| `type`                | `string`                       | 附加到 class 的类型名。                   |
| `color` / `fill`      | `string` / `readonly string[]` | 外层颜色与 SVG slot 的只读 fill 数组。    |
| `className` / `style` | 原生 HTML 属性                 | 外层 `span` 的 class 与样式。             |
| `IconSlots`           | slot 类型                      | `default` 与优先级更高的 `svg` slot。     |
| `IconSvgScope`        | slot 参数                      | `{ size, fill, id }`。                    |
| `IconHandle`          | expose                         | `getElement(): HTMLSpanElement \| null`。 |

组件不发出自定义事件；原生事件和其余 HTML 属性传给外层 `span`。通过组件 ref 可读取
`IconHandle`，没有 `$el` 私有字段协议。

浏览器或默认导入条件下，`semi-ui-vue` 根入口只具名导出 `Icon` 及 `IconProps`、
`IconSize`、`IconSlots`、`IconSvgScope`、`IconHandle` 类型；`semi-ui-vue/icons` 另提供
默认导出。纯 Node 导入条件的 UI 根入口只提供静态工具，不含 `Icon`，其条件声明也相同。
`semi-icons-vue` 根入口和 `semi-icons-vue/Icon` 子路径都提供默认 `Icon`、具名 `Icon`、
相同类型与 `convertIcon`；二者都需要浏览器 Vapor 编译/运行上下文。

## 边界

组件与示例是客户端 Vapor 路径；不承诺 Icon SSR、水合或 CJS，也不提供 Node 伪组件。
正常应用应使用 Bundler 类型解析；基础 NodeNext 验证只覆盖静态工具。当前包保持 private，
未来发布将使用 `@raitosora` scope。严格 peer 安装仍要求精确的
`vue@3.6.0-rc.9`；`vue-jsx` 的 `^3` peer 对该 Vue RC 的严格安装限制仍存在。
