# Tag 标签

Tag 用于简短标记；TagGroup 按配置列表展示标签与数量折叠，SplitTagGroup 将直接子元素连成首尾带圆角的组合。示例使用已交付组件和原生 HTML。

## 导入与样式

```tsx
import { Tag, TagGroup, SplitTagGroup } from "semi-ui-vue";
import TagFromPath from "semi-ui-vue/tag";
import TagGroupFromPath from "semi-ui-vue/tag/group";
import SplitTagGroupFromPath from "semi-ui-vue/tag/splitTagGroup";
import type {
  TagProps,
  TagGroupProps,
  SplitTagGroupProps,
} from "semi-ui-vue/tag";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/tag.css";
import "semi-ui-vue/styles/components/icons.css";
```

头像组合还需 `styles/components/avatar.css`，溢出浮层需 `styles/components/popover.css`（其中包含所需的浮层动效样式）；也可以使用完整入口 `semi-ui-vue/styles.css`。三个组件分别具名导出，没有 `Tag.Group` 或 `Tag.SplitTagGroup` 静态别名，也没有公开的命令式 ref 方法。Tag 只保留识别元信息 `__SemiComponentName__ = "Tag"`。纯 Node 根不提供组件值，不声明 SSR、水合或 CJS 支持。

## 颜色、形状与头像

<ClientOnly><VaporDemo example="tag/Basic.vapor" /></ClientOnly>

color 支持 17 个主题色；type 为 light、solid、ghost。size 的实际默认值是 default，与 small 一样使用 20px 高度；large 为 24px。shape 支持 square、circle。colorful 与 gradient 是 Tag 的样式选项，渐变样式须与 colorful 一起使用。

avatarSrc 非空时复用 Avatar，avatarShape 默认 square。Tag 只向内置头像传递 src 和 shape，内置 img 不自动生成 alt，也没有 avatarAlt、imgAttr 或自定义图片事件属性；需要独立图片替代文本与错误处理时，可在自有内容中使用 [Avatar](./avatar.md)。内置头像采用 Avatar 已有的图片版本与失败回退规则，不创建另一套图片预加载生命周期。

字符串 children 使用省略样式，富内容通过 default slot 或同步内容函数创建。prefixIcon、suffixIcon 接受同步标量或原生 renderer，并放入对应图标容器；不同位置应分别创建内容，不能复用已挂载的节点。富内容的可访问性与布局由调用者负责，组件不预执行 slot 判断返回值。

## 关闭与受控可见性

<ClientOnly><VaporDemo example="tag/Interaction.vapor" /></ClientOnly>

closable 提供固定的关闭图标。固定上游没有 closeIcon、closeContent 或 close slot；自定义关闭交互应由自有内容和调用方的 visible/列表状态配合实现，不把 suffixIcon 当作内建关闭图标的替换接口。

关闭首先阻止事件冒泡与同一原生事件后续监听，再调用 `onClose(children, event, tagKey)`。只有 `event.preventDefault()` 阻止内置隐藏；返回 false 不阻止，组件也不等待 Promise。事件已经被取消时仍通知 onClose。关闭图标不会再触发 Tag.onClick。同一关闭事件在入口捕获 children、tagKey 和回调集合的快照，合并监听器收到同一组参数；回调完成后是否仍为受控则读取最新状态，允许调用方同步更新控制方式。同步抛错由调用环境处理，不吞掉异常或伪装为关闭成功。

未提供 visible 时，关闭会添加 `semi-tag-invisible`，通过 display:none 隐藏；根、原生内容和头像实例仍保留，并非卸载。提供 visible 后由调用者控制状态，组件不自动修改它，也不提供 update:visible 或 afterClose。**显式 visible={undefined} 仍属于受控输入并隐藏**，不等同于省略；删除 visible 属性后沿用最近的可见状态。需要重新显示时显式更新 visible，或者真正卸载后重挂实例。CSS 隐藏并未卸载：对保留节点手动重复派发事件仍可通知，不能据界面不可见推断回调只执行一次。真正卸载后，即使业务仍持有旧节点并手动派发事件，也不会继续通知旧实例的回调。

交互标签在根 div 上提供 role=button 与 tabIndex，关闭图标自身没有独立 Tab 停靠点。交互判断将有效 onClick 与实例创建时捕获的默认 onClick 比较：仅配置全局默认回调或显式传入同一函数，不自动添加交互角色；显式传入不同函数、closable 或内部 click 浮层触发器会启用交互。全局默认回调仍接收原生 click，非交互 Tag 的 Enter 不会额外调用它。Enter 调用 onClick；Delete/Backspace 在 closable 时调用 onClose；Escape 让事件目标失焦。Delete/Backspace 的内建 preventDefault 在 onClose 之后执行，随后调用 onKeyDown。Enter 也先调用 onClick，再阻止默认行为与冒泡，最后调用 onKeyDown。Space 没有额外激活协议。关闭后的焦点由真实 DOM 与浏览器行为决定，不自动转移到相邻 Tag。

## 列表与数量折叠

<ClientOnly><VaporDemo example="tag/Groups.vapor" /></ClientOnly>

TagGroup 通过 tagList 接收配置，不读取默认 slot。普通模式中，每项未提供有效 size/avatarShape 时继承组值；关闭顺序为 item.onClose → onTagClose → Tag 自身决定是否隐藏。item.onClose 调用 preventDefault 不会跳过 onTagClose；两个回调返回值都不控制删除。TagGroup 不修改传入数组，调用方应在 onTagClose 中按 tagKey 生成新列表。只隐藏 Tag 而未删除数据时，该项仍参与数量计数。

为可变列表提供稳定且唯一的 tagKey。沿用固定来源的有效 key 规则：truthy tagKey 优先，否则使用字符串或数字 children；因此显式 0/空字符串 tagKey 可能被 children 替代。缺少以上 key 的配置以记录对象身份获得稳定私有 key，不重复使用上游每次 Math.random 的重挂策略。重复有效 key 会明确报错。替换没有显式 key 的配置对象意味着新项；不能据内容看似相同推断 DOM 身份不变。私有 key 不作为关闭参数公开：富内容没有 tagKey 时 onClose/onTagClose 的第三参数仍为 undefined；业务需要关联删除时应显式提供 tagKey。配置本身不会被修改。

maxTagCount 未提供或为 undefined 时全部显示；0 折叠全部。默认提示数量为 `tagList.length - maxTagCount`，truthy restCount 覆盖提示数量。仅提示数量大于 0 时执行 slice 并生成 +N；restCount=0 回到计算值，负 restCount 禁止折叠。数值边界保留 JavaScript 算术与 slice：负数、小数可能使提示与实际余项数不同；NaN/Infinity 通常不折叠，-Infinity 可产生 +Infinity。运行时非 number 值（包括 null）会报错，不转成数字。业务使用非负整数可获得直观结果。这是数量折叠，不按宽度或字体自动测量；需要宽度折叠请使用 [OverflowList](./overflowList.md)。

showPopover 让 +N 打开既有 Popover，默认 hover、top、showArrow=true、autoAdjustOverflow=true。popoverProps 可覆盖这些设置；切换到 click 触发时，+N 根具备 button 角色并可聚焦，通过 Enter 打开浮层，也保留鼠标点击。content 属性显式存在时，包括显式 undefined，优先于内部余项内容。自定义 content 沿用 Popover 的同步内容契约。浮层打开、关闭和卸载由 Popover 统一管理，TagGroup 不增加另一套尺寸观察、计时器或全局监听。折叠边界两侧是不同的原生内容分支，不保证跨分支移动保留同一实例；同一分支稳定 key 重排应保留其 DOM。

onPlusNMouseEnter 的公开声明保留上游 `() => void` 形式，运行时实际转发一个原生 MouseEvent。Popover 注册了 mouseenter 处理时，先执行浮层处理，再通知该用户回调；返回值不控制浮层。

mode 只接受 default/custom；固定上游把其他字符串也作为普通模式，本库对它们明确报错。mode="custom" 时 tagList 是同步内容数组，函数在所属原生 outlet 中创建内容；组不会给自定义项注入 size、avatarShape 或 onClose，也不会替它发 onTagClose。函数身份充当稳定 key，重复的有效身份会被拒绝；更新闭包中的响应式值可以更新内容，替换函数则是新内容所有者。不能将已经渲染的原生 Block 当作可重复消费的数据项。

SplitTagGroup 的默认 slot 渲染一次，以根下直接真实 Element 的顺序装饰 semi-tag-first/last；文本与注释不计，单项同时是首尾，隐藏元素仍计位置。直接非 Tag 元素也参与位置；嵌套后代不参与，嵌套组各自管理自己的根。Fragment、For、多根和条件分支按实际展开的直接元素处理，不模仿 React Fragment 上不可下传的 class 注入。内容增删、重排和 class 更新会重新协调首尾，卸载释放观察器。组合间距来自固定主题的 1px 样式，没有 separator 属性。

`semi-tag-first` / `semi-tag-last` 是组合使用的内部位置标记。首次协调某个标记时，若调用方已提供同名类，组件保留其归属；组件自行补加的标记则由组件在重排、移除和卸载时清理。后续 class 更新中重复声明组件已拥有的同名标记，不转移其归属：原生 DOM 观察不能区分有意接管与保留已有类。普通自定义类可以动态更新并保留；请避免通过动态重声明这些内部标记控制组合边缘。

## 主题与可访问性

<ClientOnly><VaporDemo example="tag/Theme.vapor" /></ClientOnly>

主题和方向由局部真实 DOM 承载，示例不修改 body.dir。Tag 默认不会根据组件名给所有内容添加交互角色；只有可点击或可关闭时才启用根交互协议。显式 aria-label 优先，字符串内容可生成默认说明，富内容应提供有意义的标签。SplitTagGroup 根使用 role=group 与调用者的 aria-label；TagGroup 根只是 div，不增加 group/list/roving 语义。RTL 使用固定样式，组合圆角沿上游左右规则，不承诺全部像素镜像。

## Tag API

| 属性                    | 类型                                                                                                      | 默认值         | 说明                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------- |
| children                | TagContent                                                                                                | 无             | 标量或同步原生内容函数，default slot 优先 |
| size                    | 'default' \| 'small' \| 'large'                                                                           | 'default'      | default/small 为 20px，large 为 24px      |
| color                   | TagColor                                                                                                  | 'grey'         | 17 个主题色                               |
| type                    | 'light' \| 'solid' \| 'ghost'                                                                             | 'light'        | 样式类型                                  |
| shape                   | 'square' \| 'circle'                                                                                      | 'square'       | 标签形状                                  |
| closable                | boolean                                                                                                   | false          | 显示固定关闭图标                          |
| visible                 | boolean                                                                                                   | 未提供时 true  | 通过属性存在性决定受控，见上文            |
| tagKey                  | string \| number                                                                                          | 无             | 关闭回调携带的标识                        |
| avatarSrc               | string                                                                                                    | 无             | 内置头像地址                              |
| avatarShape             | 'square' \| 'circle'                                                                                      | 'square'       | 内置头像形状                              |
| prefixIcon / suffixIcon | TagContent                                                                                                | 无             | 前后内容，不替代关闭按钮                  |
| colorful / gradient     | boolean                                                                                                   | false          | 多彩/渐变样式                             |
| class / className       | Vue class / string                                                                                        | 无             | 与组件类合并                              |
| style                   | Vue StyleValue                                                                                            | 无             | 根样式                                    |
| aria-label              | string                                                                                                    | 字符串内容说明 | 显式原生可访问名称                        |
| tabIndex                | number                                                                                                    | 交互时 0       | 交互根的 tabIndex，-1 可禁用顺序聚焦      |
| onClick                 | (event: MouseEvent \| KeyboardEvent) => void                                                              | 无             | click 或 Enter 激活                       |
| onClose                 | (children: TagContent, event: MouseEvent \| KeyboardEvent, tagKey: string \| number \| undefined) => void | 无             | 先通知后决定隐藏，preventDefault 取消     |
| onMouseEnter            | (event: MouseEvent) => void                                                                               | 无             | 原生进入通知                              |
| onKeyDown               | (event: KeyboardEvent) => void                                                                            | 无             | 内部键盘处理后通知                        |

TagColor 包括 amber、blue、cyan、green、grey、indigo、light-blue、light-green、lime、orange、pink、purple、red、teal、violet、yellow、white。默认 slot 无参数；内容函数只在所属原生分支中运行，不是可供回调重新执行的 DOM 快照。close 的 children 参数在没有 default slot 时保留公开 children 数据值；存在 slot 时携带该 slot 函数身份，不执行它。回调不得再次调用该函数来获取“当前子项数组”，否则会创建没有正确原生所有者的内容。

`tag` 子路径还导出 TagProps、TagSlots、TagColor、TagType、TagSize、TagShape、AvatarShape、TagContent、TagRenderResult、TagGroupProps、SplitTagGroupProps、SplitTagGroupSlots；AvatarShape 是该家族的 square/circle 类型别名，不是额外组件。`tag/interface` 为类型兼容入口。

## TagGroup 与 SplitTagGroup API

| TagGroup 属性             | 类型                                                 | 默认值           | 说明                                                                                |
| ------------------------- | ---------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| tagList                   | readonly TagProps[]；custom 时 readonly TagContent[] | []               | 缺省视为空数组                                                                      |
| mode                      | 'default' \| 'custom'                                | 'default'        | 配置项或自有原生内容                                                                |
| maxTagCount               | number                                               | 无               | 数量限制，不测量宽度                                                                |
| restCount                 | number                                               | 无               | truthy 时覆盖 +N 数值                                                               |
| size                      | 'small' \| 'large'                                   | 运行时 'default' | 未指定有效尺寸的项继承                                                              |
| avatarShape               | 'square' \| 'circle'                                 | 'square'         | 未指定有效头像形状的项继承                                                          |
| showPopover               | boolean                                              | false            | 用 Popover 展示余项                                                                 |
| popoverProps              | PopoverProps                                         | 内部默认配置     | 后覆盖，content 存在性有优先级                                                      |
| onTagClose                | TagProps['onClose']                                  | 无               | 单项回调之后通知，调用方负责删除数据                                                |
| onPlusNMouseEnter         | () => void                                           | 无               | 运行时传入原生 MouseEvent；已注册的 Popover mouseenter 处理先执行，返回值不控制浮层 |
| class / className / style | Vue class / string / CSSProperties                   | 无               | 组 div 类与样式                                                                     |

TagGroup 不接收 children 或 slots，也不透传任意属性到内部项。SplitTagGroup 接收 class、className、style、aria-label 和 default slot；不接收 children 数据、分隔符或命令式 ref。default slot 为同步原生 Vapor 内容，允许 null/undefined；不要传 Promise 或裸字符串 slot，文本可放在 JSX fragment 内。

## 默认值、边界与所有权

Tag 默认值在实例初始化时捕获全局配置；省略、显式 undefined 和动态移除默认属性会恢复捕获值，visible 的存在性规则是例外。TagGroup/SplitTagGroup 不获取 Tag 的全局组默认配置。null 不统一等同于 undefined：运行时 callback=null 按无回调处理，children/prefixIcon/suffixIcon=null 是空内容，avatarSrc=null 不显示头像；这些运行时清空边界不扩大对应公开声明。枚举、boolean、tagKey、tabIndex 的 null 会被拒绝，TagGroup 的 tagList/popoverProps=null 也不是空配置。其他非法回调、列表和配置对象会明确校验，不依赖错误类型触发隐式转换。

缺省 tagList 作为空数组与固定上游直接 map 报错不同；稳定对象 key 与重复 key 拒绝用于保护原生列表所有权。普通字符串/数字内容、null/undefined/boolean 空内容和同步 renderer 分开处理；Promise/thenable 不支持。原生 slot、renderer 的 fragment、多根、For 与嵌套内容由所属分支释放，不预执行、克隆、检查或缓存 VNode，不强制字符串化富内容。

interop 宿主可以通过 Vue bridge 向 Tag、SplitTagGroup 提供 default slot，包括在宿主 slot 中使用 `h()`。这与内容函数的契约不同：TagGroup 的 custom 项，以及 children、prefixIcon、suffixIcon 等内容 factory，仍必须创建原生 Vapor 内容；`() => h(...)` 返回 VNode，不能作为原生内容 factory 使用。锁定的 Vue 3.6.0-rc.9 公开 `VaporRenderResult` 联合类型本身包含 VNode，因此 TypeScript 检查通过不表示原生内容 factory 支持该返回值；运行时不会探测 VNode 或将其转换为原生内容。只支持实际验证的原生 Vapor 内容路径与通过 Vue bridge 的 interop slot 路径。

普通安全 attrs 由真实根承载，组件过滤不安全 HTML 和会夺取内容所有权的属性。过滤不是对业务 URL、CSS 或自有 renderer 的通用净化服务。隐藏保留内容不代表业务资源暂停；真正移除列表项或卸载组件才会释放它们。

## 上游与验证范围

来源固定为 Semi Design 2.103.0、SHA `8bed560dd3f36579f85b7a522f19762f2bace756` 的 Tag、TagGroup、SplitTagGroup、类型、中文文档、常量与 SCSS。该家族没有独立 TagFoundation；复用 Avatar、Popover 已有实现，不复制 OverflowList 测量与调度。静态入口、原生内容、事件类型和 split 直接 DOM 顺序是 Vue 适配的一部分。

文档与独立示例交互检查分别位于 `website/tests/tag.spec.ts`、`tests/e2e/tag.spec.ts`，核心边界由源码浏览器测试补充。截图用于查看主题、RTL、窄屏、关闭、头像、组合与余项浮层，不代表完整像素一致；DOM 身份、焦点、真实几何和资源释放需由对应断言验证。严格声明、pure Vapor、interop、四条真实 tarball 消费者分别验证，入口维护见[上游对齐与完成度](../guide/upstream-matrix.md)。
