# Empty 空状态

Empty 展示空内容说明、插画和操作区域。组件本身没有默认插画；示例按需复用已交付的插画资源和 Button。

## 导入与样式

```tsx
import { Empty } from "semi-ui-vue";
import EmptyFromPath, { Empty as NamedEmpty } from "semi-ui-vue/empty";
import type {
  EmptyProps,
  EmptySlots,
  EmptyContent,
  EmptyRenderResult,
  EmptyImage,
} from "semi-ui-vue/empty";
import { IllustrationNoResult } from "semi-illustrations-vue";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/empty.css";
// 使用操作按钮时增加：
import "semi-ui-vue/styles/components/button.css";
```

浏览器根具名导出 Empty；empty 子路径提供默认/具名组件和上述五个类型。没有静态子组件、命令式 ref 方法或组件事件。Node 根不导出组件值；不声明 SSR、水合或 CJS 支持。empty 按需样式已包含内部标题所需的 Typography 样式闭包。完整 `semi-ui-vue/styles.css` 可替代按需样式。

## 默认、文本、插画和操作

<ClientOnly><VaporDemo example="empty/Basic.vapor" /></ClientOnly>

省略全部内容时，图片容器和内容容器仍存在。默认 layout 为 vertical，没有默认标题、描述、操作或插画尺寸。缺省和显式 undefined 都恢复 vertical；动态移除 layout 同样恢复默认值。水平布局须显式选择 horizontal，图片尺寸用 imageStyle 或插画组件自身的 size/width/height 控制。

字符串 image 作为原生 img 的 src，包括空字符串；只有 description 属性是字符串时才用它作为 alt，其余情况 alt 为 `empty`。description slot 不会被执行或提取文本来计算 alt。`{ id: "symbol-id" }` 生成 `svg[aria-hidden=true]` 和 `use` 的 xlink 引用 `#symbol-id`。上游声明中的 viewBox、url 字段不参与渲染，不能用 `{ url: "..." }` 替代字符串图片地址；无 id 的普通对象不属于支持内容。SVG id 字段的存在性决定 symbol 分支，显式 id=undefined 仍生成 `#undefined`，不会回退 URL。

标题使用已交付 Typography.Title：有图片分支时为 h4，无图片时为 h6 且内联 fontWeight=400。图片为字符串、symbol、renderer，或声明了图片 slot 时均按有图处理；空图片 slot 或返回空内容的 renderer 不会改成 h6。标题不是独立的 role 包装。

## 原生内容与动态所有权

<ClientOnly><VaporDemo example="empty/Dynamic.vapor" /></ClientOnly>

title、description、children 支持标量或同步原生 Vapor renderer；image、darkModeImage 另支持 symbol 对象。富内容使用 renderer 或 slot，可包含条件分支、fragment、多根、嵌套组件和稳定 key 的 For。每个渲染位置分别创建自己的内容，不复用已经挂载的 Block，也不传 React 元素、VDOM VNode、Promise、thenable 或任意对象。锁定 Vue 的底层 VaporRenderResult 类型包含 VNode，不代表原生 factory 路径支持 VNode；组件不检查或转换 VNode。

image、darkModeImage、title、description、default 五个无参数 slot 分别优先对应属性，default 对应 children。slot 声明存在性与实际输出分开：已声明的 title/description/default slot 即使条件输出为空，也保留该区域容器；动态移除声明才重新使用属性。组件不预执行 slot 判空，不缓存、克隆或字符串化 renderer 结果。interop 宿主 slot 由 Vue bridge 管理；属性 renderer 始终为同步原生 Vapor factory。

标量 title/description/children 沿用上游 truthy 条件：0、NaN、空字符串、false、null、undefined 不创建对应容器；true 创建容器但没有文字。非空字符串按文本转义，非零数字正常显示。公开声明约束输入类型，组件不会把运行时异常值统一改成“合理默认”。例如 layout=null 或空字符串不添加布局类，声明外的 truthy layout 仍形成相应类；image 非字符串值须经过上游的 `id in value` 检查，truthy 的数字或 boolean 可能抛出 TypeError，不能将其解释为图片内容支持。image=0/false/null/undefined 不产生图形；数字 0 作为原生文本保留。异常输入不扩大公开承诺。

示例把响应式读取放在原生子组件内部，更新上下文保留输入 DOM、编辑值和焦点。renderer 自身若依赖响应式值并重新创建子树，组件不承诺跨 factory 调用复用 DOM。真实条件卸载会释放子树，重挂创建新节点。For 使用稳定 key 保留增删重排中未删除项目的节点与输入值；浏览器 DOM 移动可能改变焦点，不把节点保留描述为完整焦点保留。上下文由原生 Vue 所有权传播，不移植私有实例字段。

## 深浅插画、RTL 与样式

<ClientOnly><VaporDemo example="empty/Theme.vapor" /></ClientOnly>

Empty 挂载时，只有 darkModeImage 属性为 truthy 或声明了 darkModeImage slot 才订阅所属 document 的 body 属性变更，并读取 `theme-mode`。值严格等于 `dark` 且当前仍有暗图来源时选择暗图，否则选择 image。仅切换局部 `semi-always-dark` 类不会切换图片来源；它控制 CSS tokens。挂载后才新增暗图不会补建 observer，需在初次挂载时提供暗图，或显式卸载重挂。已建立的观察在暗图被移除后继续保留到 Empty 卸载，卸载断开并忽略失效回调。没有定时器、RAF、图片加载异步任务或尺寸观察器。

示例用固定 NoResult/NoResultDark 插画，来自公开资源入口，沿用既有来源、许可证和 SVG 引用隔离。Empty 没有内置任何一张插画，也不引入公共 Image 组件。自定义图片子树由其原生分支拥有，主题切换可以卸载浅图、挂载暗图；标题和操作内容不因图像分支切换而整体重建。

class/className 和 style 作用于根 div，imageStyle 作用于始终存在的图片容器。vertical 的内容上间距为 24px，horizontal 的内容左间距为 32px；ConfigProvider 的 RTL 祖先类让水平内容改用右间距。仅切换方向不交换图片内容。组件没有自动窄屏断点，示例在窄屏操作时显式改为 vertical。Vue CSS 属性不自动为非零数字长度补 px，长度需明确单位。

## API

| 属性              | 类型                                  | 默认值   | 说明                                               |
| ----------------- | ------------------------------------- | -------- | -------------------------------------------------- |
| layout            | `"vertical" \| "horizontal"`          | vertical | 布局类，显式 undefined 恢复默认                    |
| image             | EmptyImage                            | 无       | 字符串 URL、symbol 对象或原生内容                  |
| darkModeImage     | EmptyImage                            | 无       | body theme-mode 为 dark 时的图片；观察初始化见上文 |
| title             | EmptyContent                          | 无       | 标题区域，slot 优先                                |
| description       | EmptyContent                          | 无       | 描述区域，字符串属性同时作为 URL 图片 alt          |
| children          | EmptyContent                          | 无       | 操作区域，default slot 优先                        |
| imageStyle        | CSSProperties                         | 无       | 图片容器样式，不自动设置尺寸                       |
| style             | CSSProperties                         | 无       | 根 div 样式                                        |
| className / class | string / 字符串、字符串数组或布尔映射 | 无       | 根 div 类                                          |

EmptyContent 为 string、number、boolean、null、undefined 或同步 EmptyRenderResult renderer；EmptyImage 另包含 `{ id?: string; viewBox?: string; url?: string }`，实际仅消费 id。五个 slots 均为无参数同步原生内容函数，没有 scoped 参数、通知事件、取消回调或 ref DOM 代理。

## DOM、可访问性与交互

根 div 内固定按顺序放 image 和 content 两个 div；content 内依次为可选 Title、description div、footer div。保留上游 `x-semi-prop` 标记。根只透传 `data-*`，不自动透传 id、aria-\*、role、tabindex 或原生事件；class 是 Vue 适配别名。没有额外 role、aria-live、aria-hidden 或键盘协议，symbol svg 的 aria-hidden 是上游明确行为。

有意义的读屏名称与交互语义放在真实内容元素上。Button、输入框保持原生键盘和焦点行为，内容的 click 正常冒泡到外层原生祖先，Empty 不拦截事件。图片容器按固定样式 pointer-events:none，交互操作应放到 footer。字符串按文本转义，不提供 innerHTML 路径。

## 上游、验证与限制

来源为 Semi Design 2.103.0、固定 SHA `8bed560dd3f36579f85b7a522f19762f2bace756` 的 Empty 源码、类型、入口、中文文档及 SCSS。上游没有 EmptyFoundation 类；本实现仅复用常量语义、固定 empty 样式和 Typography.Title 的必要协作。按需样式闭包、资源维护和已完成能力见[上游对齐与完成度](../guide/upstream-matrix.md)、[资源说明](../guide/resources.md)。

真实示例对应 `website/tests/empty-checks.ts`，由文档开发/生产浏览器检查和 `tests/e2e/empty.spec.ts` 共用。覆盖默认无图、标题语义、转义、URL/symbol、键盘操作、DOM 身份/编辑值/焦点、上下文、卸载重挂、slot 声明与输出、稳定列表、body 主题、RTL、自定义尺寸与窄屏。代表截图用于人工查看布局，不声明完整像素一致。严格声明、纯 Vapor、interop、tree-shaking 与四条真实 tarball 消费者独立验证；预编译消费者不替代 RC9/vue-jsx peer 严格安装验证，不扩大既有兼容边界。
