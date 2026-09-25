# Layout 布局

Layout 用 Flex 划分页面区域。`Layout.Header`、`Layout.Footer`、`Layout.Content` 和 `Layout.Sider` 分别提供页头、页脚、主要内容和侧栏。组件本身不提供背景色、文字颜色、固定高度或收起控件；尺寸和外观由调用方设置。

## 导入与样式

```ts
import { Layout } from "semi-ui-vue";
import LayoutFromPath, {
  Layout as NamedLayout,
  type BasicProps,
  type BasicLayoutProps,
  type SiderProps,
  type ResponsiveMap,
} from "semi-ui-vue/layout";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/layout.css";

const { Header, Footer, Content, Sider } = Layout;
```

根入口只具名导出 `Layout` 组件值；`Header`、`Footer`、`Content`、`Sider` 是 `Layout` 的静态成员，不是根入口的独立具名导出。`semi-ui-vue/layout` 提供 Layout 默认及具名导出。完整样式入口 `semi-ui-vue/styles.css` 或 `semi-ui-vue/styles/index.css` 已包含布局样式；选用完整入口时无需再加载分项 CSS。浏览器组件采用原生 Vapor；组件 SSR、水合和 CJS 不在当前支持范围，见[本地产物与消费](../guide/packages.md)。

## 基本布局

<ClientOnly><VaporDemo example="layout/Basic.vapor" /></ClientOnly>

无侧栏时 Layout 为纵向 Flex 容器；有侧栏时添加 `semi-layout-has-sider` 并改为横向。Header、Footer、Content 的默认原生标签依次为 `header`、`footer`、`main`，Layout 为 `section`，Sider 为 `aside`。上游样式使 Header/Footer 不伸缩、Content 占剩余空间，Sider 的宽度由调用方提供。嵌套 Layout 独立决定自己的方向：外层有侧栏，不会令无侧栏的内层也横向排列。

`Layout` 的 `tagName` 可替换根标签；Header、Footer、Content 也可用 `tagName` 覆盖其语义标签。覆盖时应自行保证文档结构和可访问语义。例如页面通常只应有一个主要 `main` 区域，嵌套示例的内部 Content 如表示非主要区域，可改用其他合适标签。`prefixCls` 改变生成的类名前缀，定制前缀需要自行提供对应 CSS。

## 动态侧栏与多根 slot

<ClientOnly><VaporDemo example="layout/Dynamic.vapor" /></ClientOnly>

默认 slot 是原生 Vapor 渲染函数，可以返回 fragment、多根、条件节点和带稳定 key 的列表。Layout 不预执行 slot，也不分析或克隆 VNode。条件侧栏请用 `v-if={visible}`；在当前 vue-jsx Vapor RC2 下，默认 slot 仅返回一个裸 `visible && <Layout.Sider>` 时，条件转假后该侧栏可能没有卸载。fragment 内的条件内容和本页 `v-if` 示例已按实际编译语义运行。动态 Sider 列表请使用 `vue-jsx/vapor` 的 `<For getKey>` 和稳定、唯一的键；直接在 Layout slot 中用 `.map()` 创建 Sider，注册引发的父级更新可能导致递归更新。Sider 与最近的 Layout 协作；挂载与卸载会更新该 Layout 的横向状态。多个 Sider 各有实例身份，移除其中一个不会清除其他 Sider；嵌套 Layout 的 Sider 不应影响外层。侧栏增删而不移动焦点所在内容时，保留的子组件继续保持状态与焦点；带 key 的列表重排保留节点和状态，但浏览器移动已聚焦节点时可能使其失焦。整个 Layout 卸载后重挂会建立新实例。

`hasSider={true}` 可显式要求横向排列；缺省、显式 `undefined` 和动态移除该属性时由实际 Sider 协作决定。固定上游的 `hasSider={false}` 不能压过已注册的 Sider；它只取消显式强制。对于包装组件或动态 slot，首次挂载后的协作能识别 Sider；React 上游额外通过直接子元素类型预判首帧，而 Vapor 不读取 VNode 列表，因此首帧可能经历从纵向到横向的更新。需要首帧直接横向时可显式指定 `hasSider={true}`。

## 断点回调、RTL 与尺寸

<ClientOnly><VaporDemo example="layout/Breakpoint.vapor" /></ClientOnly>

Sider 的 `breakpoint` 可以包含 `xs`、`sm`、`md`、`lg`、`xl`、`xxl`。`onBreakpoint(screen, match)` 通知对应媒体查询的匹配状态，`match` 为布尔值。固定条件为 xs ≤575px、sm ≥576px、md ≥768px、lg ≥992px、xl ≥1200px、xxl ≥1600px；多个 min-width 条件可同时匹配。断点本身不改变侧栏宽度、可见性或折叠状态。订阅建立时报告当前匹配状态，随后在该断点状态变化时再次通知；卸载后清理订阅。

固定上游 `.semi-rtl` / `.semi-portal-rtl` 样式使 Layout 采用 RTL 方向；组件不会凭自身 API 生成导航顺序或折叠控件。可用 `ConfigProvider direction="rtl"` 提供外层 RTL 类。窄屏下 Sider 的固定宽度可能挤压 Content，调用方应设置适当的宽度、最小宽度和滚动策略。`semi-layout-has-sider` 对直接子 Layout 和 Content 设置横向溢出规则；它不代替页面级滚动设计。

<ClientOnly><VaporDemo example="layout/RTL.vapor" /></ClientOnly>

## Layout API

| 属性        | 类型           | 默认值          | 说明                                         |
| ----------- | -------------- | --------------- | -------------------------------------------- |
| `hasSider`  | `boolean`      | 无              | `true` 强制横向；无值时由 Sider 实例协作决定 |
| `tagName`   | HTML 标签名    | `'section'`     | 根标签                                       |
| `prefixCls` | `string`       | `'semi-layout'` | 类名前缀；自定义前缀需配套 CSS               |
| `className` | `string`       | 无              | 与内置类和 Vue `class` 合并的兼容别名        |
| `class`     | Vue HTML class | 无              | 根节点 class                                 |
| `style`     | Vue HTML style | 无              | 根节点样式                                   |

Layout 默认 slot 不接收参数。根节点可接收 `id`、`title`、`role`、`aria-*`、`data-*` 等安全原生属性及事件；`innerHTML`、`textContent` 不属于公开内容通道，以保留 slot 所有权。`hasSider` 没有双向绑定、通知事件或公开命令式 ref 方法。

`tagName`、`prefixCls` 缺省或显式 `undefined` 均使用各自默认值；动态移除属性后也恢复默认。`className` 与 Vue `class` 和内置类共同存在，不替换布局类。`style` 作用于根节点，可覆盖上游样式；数字 `0` 是有效样式值。Layout 不根据缺省尺寸补写宽高或滚动样式。在当前 Vapor 编译器下，动态改变 `tagName` 会替换实际根元素并重挂其 slot 子树，子组件状态重置，旧焦点离开；Sider 会重新注册。普通 `class`、`style`、`hasSider`、原生属性和侧栏变化保留根元素与未移除的内容。

## Header / Footer / Content API

| 属性        | 类型           | 默认值                                                       | 说明                                           |
| ----------- | -------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| `tagName`   | HTML 标签名    | Header: `'header'`；Footer: `'footer'`；Content: `'main'`    | 根标签                                         |
| `type`      | `string`       | Header: `'header'`；Footer: `'footer'`；Content: `'content'` | 生成对应类型类名；自定义类型需配套 CSS         |
| `prefixCls` | `string`       | `'semi-layout'`                                              | 对应 `-header`、`-footer`、`-content` 类名前缀 |
| `className` | `string`       | 无                                                           | 与内置类和 Vue `class` 合并                    |
| `class`     | Vue HTML class | 无                                                           | 根节点 class                                   |
| `style`     | Vue HTML style | 无                                                           | 根节点样式                                     |

三个子组件都只提供无参数默认 slot，没有组件自定义事件、v-model、命名 slot 或公开 ref 方法。可传安全原生属性到各自根标签。它们也可作为独立组件挂载；布局样式仍由类名决定，但父 Layout 的 Flex 结构由调用方提供。

## Sider API

| 属性           | 类型                                                   | 默认值          | 说明                                 |
| -------------- | ------------------------------------------------------ | --------------- | ------------------------------------ |
| `breakpoint`   | `Array<'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'>` | 无              | 要订阅的固定媒体条件                 |
| `onBreakpoint` | `(screen, match: boolean) => void`                     | 无              | 媒体匹配变化通知，无返回值约定       |
| `prefixCls`    | `string`                                               | `'semi-layout'` | `-sider`、`-sider-children` 类名前缀 |
| `className`    | `string`                                               | 无              | 与内置类和 Vue `class` 合并          |
| `class`        | Vue HTML class                                         | 无              | 根 `aside` 的 class                  |
| `style`        | Vue HTML style                                         | 无              | 根 `aside` 的样式，包括宽度          |
| `aria-label`   | `string`                                               | 无              | 为侧栏提供可访问名称                 |
| `role`         | `string`                                               | 无              | 固定上游声明此属性，但未输出到根节点 |

Sider 的根节点为 `aside`，默认 slot 放在内部 `.semi-layout-sider-children` 容器。可传 `aria-label` 为侧栏命名；侧栏内的导航请使用有名称的原生 `nav`、链接或按钮。Sider 没有 `collapsed`、`collapsible`、`trigger`、`width`、`reverseArrow` 或折叠事件。`breakpoint` 是通知 API，不是响应式收起 API。独立 Sider 可以渲染，但没有父 Layout 时不触发父级横向协作。

## 来源与验证边界

契约依据固定 Semi Design `2.103.0`、提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 `layout/index.tsx`、`Sider.tsx`、`layout-context.ts`、中文文档及 Foundation `layout.scss` / `rtl.scss`。Foundation Layout 只有前缀常量和 SCSS，没有额外布局状态机。Vapor 以组件生命周期和最近 Layout 的 context 协作，保留 slot 自身所有权；React 上游直接子项首帧类型预判与 Vapor 的挂载后注册之间的差异如上记录。

浏览器行为、声明消费、按需样式、截图及已验收范围应以仓库 `docs/tasks/C-layout.md` 和[兼容边界](../guide/compatibility.md)为准。截图只用于关键状态目视检查，不代表跨浏览器或完整像素一致性。
