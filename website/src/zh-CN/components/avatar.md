# Avatar 头像

Avatar 展示图片、文字或原生内容；AvatarGroup 为头像提供统一尺寸、形状、覆盖方向与数量折叠。示例使用原生 HTML、Avatar、AvatarGroup 和已交付的 Popover。

## 导入

```tsx
import { Avatar, AvatarGroup } from "semi-ui-vue";
import AvatarFromPath from "semi-ui-vue/avatar";
import AvatarGroupFromPath from "semi-ui-vue/avatar/avatarGroup";
import type {
  AvatarProps,
  AvatarGroupProps,
  AvatarGroupItem,
} from "semi-ui-vue/avatar";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/avatar.css";
```

完整样式入口是 `semi-ui-vue/styles.css`。浏览器根公开 Avatar、AvatarGroup；`avatar` 子路径默认导出 Avatar 并提供具名导出，`avatar/avatarGroup` 提供头像组入口。固定上游也没有 `Avatar.Group` 静态成员，不添加这个别名。Avatar 保留只读识别元信息 `__SemiComponentName__ = "Avatar"` 与 `elementType = "Avatar"`；这些不是 DOM ref 或操作方法。组件没有公开 imperative ref 方法。纯 Node 根不提供组件值，不声明组件 SSR、水合或 CJS 支持。

## 尺寸、形状与图片

<ClientOnly><VaporDemo example="avatar/Basic.vapor" /></ClientOnly>

size 的七个主题预设依次为 `extra-extra-small`（20px）、`extra-small`（24px）、`small`（32px）、`default`（40px）、`medium`（48px）、`large`（72px）、`extra-large`（128px）。默认属性值为 medium；名字为 default 的预设并不是默认属性值。也可传合法 CSS 长度字符串，由真实 CSS 布局决定宽高。运行时检查 size 是字符串，不自行解析 CSS 语法；空字符串或无效 CSS 值交给浏览器处理，不能保证它们形成指定尺寸。shape 支持 circle、square。

图片分支只有在 src 有效且当前请求尚未回退时渲染。提供描述图片内容的 alt；纯装饰图片可以明确使用空字符串。加载失败默认切换为 children 文本或 default slot 内容。顶层 `onError` 沿用实际 Foundation 的零参数回调；返回值严格等于 false 时保留失败图片，其余返回值允许默认回退。它不是传入原生 error Event 的通知接口。

imgAttr 沿用原生图片属性覆盖规则，可覆盖 src、srcset、alt；可点击分支的焦点和键盘处理与内部 class 优先。若提供函数 `imgAttr.onError`，它收到原生 Event 并替代顶层 onError 与默认回退逻辑，其返回值不会再交给顶层处理。显式 undefined 或运行时 null 视为未提供，回到内部处理器；这与固定上游对象展开可用 undefined 覆盖内部 onError 的细节不同。需要默认回退时使用顶层回调，不同时覆写原生处理器。

src、srcSet 以及 imgAttr 中覆盖的 src/srcset 组成图片版本；任一变化重置失败状态并由新分支拥有图片节点。当前版本的 error 先调用处理器，再根据返回值判断回退；如果处理器同步更换 src，旧版本不能把新图片标为失败。旧节点即使在同一 tick 内尚未卸载，其迟到 error/load/abort 也不能通知新版本的回调。卸载后旧节点回调失效；重新挂载属于新实例。

imgAttr.onLoad/onAbort 接收原生 Event，只通知当前版本；abort 通知本身不触发默认失败回退。处理器经过单一事件绑定，单次原生事件不因 attrs 展开而重复通知；这不保证业务手动对同一有效节点派发多次事件只通知一次。顶层 onError 严格同步判断 false，不等待 Promise；异步返回不是受支持的声明协议。缓存命中与浏览器加载事件由当前图片节点处理，不借用公共 Image 组件。

imgAttr 的图片源使用 Vue 标准 src/srcset，受守卫的事件使用 onLoad/onAbort/onError/onKeydown/onFocus/onBlur。忽略 `.src`、`^src`、srcSet 等图片源别名，以及 onload、`.onload`、`on:load`、onLoadOnce 等事件别名或修饰形式；这些不是额外公共 API，不能用来绕过图片版本和卸载守卫。顶层 Avatar 属性仍使用 srcSet。

## 文字缩放与原生内容

<ClientOnly><VaporDemo example="avatar/Measure.vapor" /></ClientOnly>

`children="AB"` 是显式字符串数据，使用同一份真实文字节点测量与缩放，左右默认留出 gap=3px。按固定 Foundation 的整数 offsetWidth 公式 `min(1, (头像宽度 - 2 * gap) / 文字宽度)` 计算比例，不为短文本放大。头像或文字宽度为零，或 `2 * gap >= 头像宽度` 时保留上次比例；因此过大的 gap 不承诺文字仍满足边缘间距。初始隐藏或零尺寸时保留可恢复的测量状态；容器恢复、尺寸、内容和字体变化后重新测量。没有另一套可聚焦测量副本。

原生富内容通过 default slot 提供：

```tsx
<Avatar size="large">
  {() => (
    <>
      <strong>原生</strong>
      <span>内容</span>
    </>
  )}
</Avatar>
```

default slot 返回同步原生 Vapor 内容，支持 fragment、多根、条件分支、For 与嵌套组件。default slot 存在时优先于 children；成功图片优先于这两种 fallback。数字 children 保持数字内容，不冒充字符串测量路径。rich slot 由调用者管理布局和可访问性，不探测 slot 结果来猜测字符串，也不自动缩放任意内容。children 的字符串路径与 rich slot 路径不同，不用 `String(rendererResult)` 转换原生结果。slot 不接受裸 string、number、boolean 或 Promise；文本请写在原生元素或 JSX fragment 内。

## 装饰、悬停与内容所有权

<ClientOnly><VaporDemo example="avatar/Decoration.vapor" /></ClientOnly>

hoverMask 在指针进入后展示、离开后移除；状态先更新，onMouseEnter/onMouseLeave 在 nextTick 后通知，实例已卸载则不再通知。连续进入/离开可能在同一批 DOM 更新中完成，回调不保证观察到每个中间覆盖层。顶部装饰只在 circle 与 extra-small 至 extra-large 的预设尺寸下显示；底部装饰也限于这六个预设尺寸，extra-extra-small 和自定义尺寸不显示这些位置。以上条件也适用于自定义 render。topSlot、bottomSlot 支持配置默认样式和内容，也可通过各自 render 完全接管该位置。自定义 render 返回自己的原生内容，不自动附加默认顶部或底部包装。border 是额外描边，不是状态徽标；contentMotion 和 border.motion 分别控制上游样式中的内容动效与边框动效。

hoverMask 与配置中的 text 使用 `AvatarContent`，可传同步标量或返回原生内容的函数；render 使用同步 `AvatarRenderResult`。hoverMask 的固定样式只提供覆盖头像的绝对定位容器，不自动居中文字、添加背景或提高层级；后置顶部装饰可能遮挡位于左上角的裸文本。调用者负责覆盖内容的布局，示例将装饰和居中的悬停覆盖层分开展示。raw renderer 内容的资源由当前原生分支管理；renderer 身份变化或分支卸载会释放旧内容。不同 renderer 位置不能共享同一份已经挂载的原生节点。组件不预执行 slot、不检查、缓存或克隆 VNode。Vue JSX 的结构类型不能拒绝所有 VDOM VNode；运行时支持范围以原生 Vapor 与单独验证的 interop 路径为准。

## AvatarGroup 与数量折叠

<ClientOnly><VaporDemo example="avatar/Group.vapor" /></ClientOnly>

AvatarGroup 默认 slot 只在所属原生 outlet 创建内容时执行。子 Avatar 注册自身，组通过真实 DOM 顺序确定参与者，不预执行 slot 获取“子元素数组”，不克隆子节点。非 Avatar 内容照常渲染但不参与数量统计；原生包装内的注册 Avatar 仍按真实 DOM 顺序参与，不把包装重排为直接子节点。组的 size、shape 覆盖成员自身对应值，动态修改传播到已注册头像；最近一层组拥有自己的成员，上层组不收集嵌套组的头像。

稳定 key 的成员增删、反转和条件显示由 Vapor 负责。折叠的注册头像保留原生 DOM 与子内容，使用 hidden、inert 和 aria-hidden 停止展示、聚焦与交互；扩大 maxCount 后恢复相同节点。因而数量折叠不代表实例已经卸载，不保证折叠项内部业务资源暂停，也不是虚拟列表。列表真正删除或组卸载时才释放该成员。

默认折叠提示是 `+N` 头像，不自动创建 Popover。renderMore 接收 `(restNumber, restAvatars)`：restAvatars 是只读的 `AvatarGroupItem[]` 描述快照，每项提供 id、index、props 和 label，不是 ReactNode 数组、DOM 节点或可重新挂载的头像。数组、描述记录和 props 快照浅冻结；props 内的嵌套业务对象没有深冻结，不应通过描述修改输入。成员或渲染函数更新时可重建更多内容的原生分支，不承诺这个 callback 返回内容保持 DOM 身份。可据 label 展示名单，或用自己的数据渲染新内容；示例用 Popover 和原生 button 提供可访问的交互入口。自定义更多内容不参与原列表计数。

maxCount 沿用固定上游的 number/slice 行为，而不是自动截断到非负整数：未提供或显式 undefined 不限制；0 折叠全部；负数和分数可使显示的剩余数量与实际折叠成员数不同；NaN、Infinity 不折叠，-Infinity 全折叠且提示为 `+Infinity`。运行时真正的 boxed Number 按其数字值处理；字符串、boolean、null、Symbol 或普通对象不强制转数，不启用数量折叠。类型声明仍只接受 number。业务应传非负整数获得清晰的 `+N` 含义。

没有 default slot 时不生成更多提示；存在空 slot 且 maxCount 为负数时可按数量运算生成提示。overlapFrom 的非法运行时值不生成覆盖顺序 class；renderMore 的非函数运行时值使用默认提示，函数返回 null/undefined/boolean 则为空内容。

固定主题仅为成员索引 0–20 生成 start/end 重叠层级样式；从第 22 个位置起，不再提供对应的 z-index 规则。数量统计与折叠仍可处理更多成员，但不承诺超出此范围的重叠顺序；默认更多提示也按其所在位置使用这组样式。

## 主题、方向与可访问性

<ClientOnly><VaporDemo example="avatar/Theme.vapor" /></ClientOnly>

主题与 RTL 使用真实外层 DOM 的 CSS tokens 和方向；示例只改变局部容器，不修改 body.dir。窄屏使用正常文档布局，AvatarGroup 按数量折叠，不根据容器宽度自动决定可见数量；需要宽度折叠时另见 [OverflowList](./overflowList.md)。

固定上游 Avatar 根为 listitem，AvatarGroup 根为 list。字符串内容具有 role=img 和替代说明；图片使用原生 img 的 alt。可点击图片/文字的说明沿用固定上游 `clickable Avatar: ` 前缀，不据组件名称擅自改为 button 角色。提供 onClick 的图片或字符串内容可聚焦，Enter 调用同一 onClick，Escape 取消焦点。onClick 收到实际 MouseEvent 或 KeyboardEvent，不伪造鼠标事件。rich slot 中的按钮、链接及键盘协议由调用者提供，组件不为任意富内容追加统一交互角色。测量不能产生第二份可聚焦内容；折叠内容不应成为 Tab 目标。

## 默认值、空值与运行时边界

省略、显式 undefined 或动态移除默认属性时，恢复实例初始化捕获的默认值；后续全局默认配置改变不会重写旧实例。null 不等于 undefined：size、shape、color、gap 的运行时 null 被拒绝，不作为重置操作。gap 必须是有限非负数；非法枚举、非字符串 size、对象 children、非函数顶层 onError、错误回调和数组形式的装饰配置会同步报错。

运行时 null 的 src/srcSet/alt、children、imgAttr、topSlot、bottomSlot、border 视为空内容或缺少配置；公开类型仍要求相应字符串/对象/boolean 或 undefined。children 的数字 0 可见，空字符串保留空文字分支；不会为它们创建默认姓名或图标。数字 children 不参加字符串测量，运行时非有限数字也不会转换成合法名称。

通知回调的返回值不改变点击或悬停状态。onError 是例外，只处理严格 false；同步抛错会向调用环境传播，不被吞掉或自动改写为成功。同步 renderer 可以返回标量、递归数组和原生内容，Promise/thenable 不受支持；raw renderer 的 boolean/null/undefined 不渲染。不要通过未声明属性或异步内容绕过原生分支所有权。

## Avatar API

可选属性接受显式 undefined。默认值捕获和 ConfigProvider 约定见[上下文与默认配置](../guide/context.md)，attrs/ref 与 slot 规则见 [API 与类型约定](../guide/api-contracts.md)。

| 属性          | 类型                                                  | 默认值   | 说明                                           |
| ------------- | ----------------------------------------------------- | -------- | ---------------------------------------------- |
| children      | string \| number                                      | 无       | 字符串走测量缩放路径；富内容使用 default slot  |
| src           | string                                                | 无       | 图片地址；空字符串不进入图片分支               |
| srcSet        | string                                                | 无       | 图片响应式候选地址                             |
| alt           | string                                                | 无       | 图片替代文本；文字未提供时使用字符串内容       |
| imgAttr       | Omit<ImgHTMLAttributes, 'innerHTML' \| 'textContent'> | 无       | 受支持的原生 img 属性与事件；不接受不安全 HTML |
| size          | string                                                | 'medium' | 七个主题预设或合法 CSS 长度                    |
| shape         | 'circle' \| 'square'                                  | 'circle' | 头像形状                                       |
| color         | AvatarColor                                           | 'grey'   | 主题色，仅非图片分支使用                       |
| gap           | number                                                | 3        | 字符串与左右两侧的像素间距                     |
| hoverMask     | AvatarContent                                         | 无       | 指针悬停内容                                   |
| topSlot       | AvatarTopSlot                                         | 无       | 顶部配置，见下表                               |
| bottomSlot    | AvatarBottomSlot                                      | 无       | 底部配置，见下表                               |
| border        | boolean \| { color?: string; motion?: boolean }       | 无       | 额外边框；对象字段 color、motion               |
| contentMotion | boolean                                               | 无       | 内容 CSS 动效                                  |
| className     | string                                                | 无       | 追加组件类名                                   |
| class         | Vue 原生 class                                        | 无       | 与内置类合并                                   |
| style         | Vue StyleValue                                        | 无       | 头像样式，自定义宽高覆盖 size 尺寸             |
| onClick       | (event: MouseEvent \| KeyboardEvent) => void          | 无       | 鼠标点击或 Enter 激活；返回值不决定状态        |
| onMouseEnter  | (event: MouseEvent) => void                           | 无       | 指针进入通知，先更新覆盖层状态                 |
| onMouseLeave  | (event: MouseEvent) => void                           | 无       | 指针离开通知，先清除覆盖层状态                 |
| onError       | () => boolean \| void                                 | 无       | 有效图片失败回调，严格 false 阻止默认回退      |

color 支持 amber、blue、cyan、green、grey、indigo、light-blue、light-green、lime、orange、pink、purple、red、teal、violet、yellow。

| 配置             | 字段                                     | 说明                             |
| ---------------- | ---------------------------------------- | -------------------------------- |
| AvatarTopSlot    | render?: () => AvatarRenderResult        | 完全自定义顶部内容，优先于 text  |
| AvatarTopSlot    | text?: AvatarContent                     | 默认顶部文字或原生 renderer      |
| AvatarTopSlot    | gradientStart?, gradientEnd?             | 渐变颜色，默认使用 primary token |
| AvatarTopSlot    | textColor?, className?, style?           | 默认顶部文字颜色、包装类和样式   |
| AvatarBottomSlot | render?: () => AvatarRenderResult        | 完全自定义底部内容，优先于 text  |
| AvatarBottomSlot | text?: AvatarContent                     | 默认底部文字或原生 renderer      |
| AvatarBottomSlot | shape?: 'circle' \| 'square'             | 底部形状，不自动沿用头像 shape   |
| AvatarBottomSlot | bgColor?, textColor?, className?, style? | 底部背景、文字颜色、类与包装样式 |

## AvatarGroup API

| 属性                             | 类型                                                                                | 默认值   | 说明                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| size                             | string                                                                              | 'medium' | 覆盖已注册 Avatar 的 size                                                                                         |
| shape                            | 'circle' \| 'square'                                                                | 'circle' | 覆盖已注册 Avatar 的 shape                                                                                        |
| overlapFrom                      | 'start' \| 'end'                                                                    | 'start'  | 按开始侧或结束侧覆盖                                                                                              |
| maxCount                         | number                                                                              | 无       | 数量折叠，不是宽度测量                                                                                            |
| renderMore                       | (restNumber: number, restAvatars: readonly AvatarGroupItem[]) => AvatarRenderResult | 默认 +N  | 同步原生内容；描述记录不包含可重挂内容                                                                            |
| class / style 与其他 Avatar 属性 | 对应 Avatar 属性类型                                                                | 无       | style 与其他属性按固定上游 rest 规则转交成员，不作为组 div 的 attrs；Group class/className 忽略，成员自己的类保留 |

AvatarGroup 容器固定为 `div.semi-avatar-group[role=list]`；需要容器属性或布局样式时使用外层原生元素。AvatarGroup 只有 default slot，没有 more 命名 slot；Avatar 的默认 slot 无参数。AvatarSlots 的 default 返回 VaporRenderResult；AvatarGroupSlots 的 default 还允许 null/undefined 为空内容，均不接受异步 slot。组件不公开内部 Foundation、注册信息或 DOM 操作方法。

`avatar` 子路径公开 AvatarProps、AvatarSlots、AvatarRenderResult、AvatarShape、AvatarSize、AvatarColor、AvatarContent、AvatarTopSlot、AvatarBottomSlot，以及 AvatarGroupProps、AvatarGroupSlots、AvatarGroupItem、AvatarGroupShape、AvatarGroupSize、AvatarGroupOverlapFrom。AvatarSize/AvatarGroupSize 描述七个预设名称，组件 size 属性仍接受自定义 CSS 字符串。

原生 attrs 与 imgAttr 经过内容所有权过滤：拒绝 innerHTML、outerHTML、textContent、innerText、outerText、children 与 ref，也拒绝这些名字的大小写、连字符和 Vue 强制属性/attribute 前缀变体，例如 `.innerHTML`、`^textContent`。普通透传事件的运行时过滤只保留函数或函数数组，不接收字符串形式的内联事件。由组件接管的 imgAttr.onLoad/onAbort/onError/onKeydown/onFocus/onBlur 沿用原生声明的单函数协议；undefined 或运行时 null 视为缺省，数组、字符串等错误类型会同步报错，不等到事件触发时才失败。调用者的普通 title、data-\*、ARIA 等属性仍由真实 DOM 承载；这不是对任意业务 URL、CSS 或 renderer 内容的通用净化服务。

## 上游与验证范围

来源锁定为 Semi Design 2.103.0、提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 Avatar、AvatarGroup、类型、中文文档、Foundation 和主题 SCSS。核心按已审 Foundation 公式与事件决策移植必要逻辑，不创建 React Avatar 或实例化完整 Foundation。使用已有 DOM 尺寸观察、调度与资源清理工具；Group 的注册与真实顺序适配替代 React 子节点克隆，不实现公共 Image、Tag、Badge 或 Typography。

相对上游的必要差异包括 Vue 事件与原生 slot、只读成员描述记录、折叠成员保留 DOM、图片异步失效保护和动态文字测量。实际默认值与事件参数按源码确定，不以旧文档里的 Event 参数替代 Foundation 的真实零参数 onError。

交互与真实几何断言在 `website/tests/avatar.spec.ts`、`tests/e2e/avatar.spec.ts`，源码浏览器回归位于 `tests/browser/avatar*.test.tsx`。图片请求、缓存、过期回调、卸载清理、字体、边界及跨实例行为需与独立浏览器回归共同检查；文档示例的截图不替代几何、DOM 身份或资源断言。截图用于查看明暗、RTL、窄屏、fallback、文字缩放与组折叠状态，不代表完整像素一致。纯 Vapor、普通 Vue interop、严格声明与四条真实 tarball 消费者保持分开验证；具体维护入口见[上游对齐与完成度](../guide/upstream-matrix.md)。
