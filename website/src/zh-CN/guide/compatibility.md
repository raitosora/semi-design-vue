# 兼容边界

## 已建立的路径

文档 shell 为 VitePress 普通 Vue SSR/客户端水合；真实 TSX 示例预编译为 Vapor，在 ClientOnly 中动态导入并使用独立 `createVaporApp` 挂载。示例不复用服务端 DOM，不把客户端挂载称为示例水合。

另行验证 shell 的 interop 及独立纯 Vapor 构建。当前组合为 Vue 3.6.0-rc.9、vue-jsx 3.3.0-rc.2、Vite 8.3.3、VitePress 2.0.0-alpha.20；均以锁文件为准，预发布工具链仍需持续验收。浏览器 Bundler 条件下的 UI 根入口提供 `Tag`、`TagGroup`、`SplitTagGroup`、`Avatar`、`AvatarGroup`、`OverflowList`、`Collapsible`、`Popover`、`Tooltip`、`Progress`、`Highlight`、`Skeleton`、`Layout`、`Row`、`Col`、`Space`、`Divider`、`Button`、`ButtonGroup`、`SplitButtonGroup`、`IconButton`、`Spin`、`Icon`、`ConfigProvider`、`ConfigConsumer`、`LocaleProvider` 与 `LocaleConsumer`；纯 Node 条件的根入口只保留静态工具，其声明也按同一条件收窄。

## 尚未验证的能力

- Badge、Tag、TagGroup、SplitTagGroup、Avatar、AvatarGroup、OverflowList、Collapsible、Popover、Tooltip、Progress、Highlight、Skeleton、Layout、Row、Col、Space、Divider、Button、ButtonGroup、SplitButtonGroup、IconButton、Spin、Icon、ConfigProvider、ConfigConsumer、LocaleProvider 与 LocaleConsumer 已实现客户端 Vapor 路径；组件 SSR、水合、CJS 与全量 Semi 视觉对齐尚未验收。`semi-icons-vue` 根入口和 `semi-icons-vue/Icon` 同样只在浏览器 Vapor 路径验证。`semi-ui-vue/badge`、`semi-ui-vue/tag`、`semi-ui-vue/tag/group`、`semi-ui-vue/tag/splitTagGroup`、`semi-ui-vue/avatar`、`semi-ui-vue/avatar/avatarGroup`、`semi-ui-vue/overflowList`、`semi-ui-vue/collapsible`、`semi-ui-vue/popover`、`semi-ui-vue/tooltip`、`semi-ui-vue/progress`、`semi-ui-vue/highlight`、`semi-ui-vue/skeleton`、`semi-ui-vue/layout`、`semi-ui-vue/grid`、`semi-ui-vue/space`、`semi-ui-vue/divider`、`semi-ui-vue/button`、`semi-ui-vue/button/buttonGroup`、`semi-ui-vue/button/splitButtonGroup`、`semi-ui-vue/iconButton`、`semi-ui-vue/spin`、`semi-ui-vue/configProvider` 与 `semi-ui-vue/locale` 同样仅用于浏览器；其他公共组件的交付状态以[上游对齐与完成度](./upstream-matrix.md)和各组件页面为准。
- 先前 SSR 探针存在点击后静态文本丢失的水合问题，本页没有以 ClientOnly 掩盖为已修复。
- 只在指定 Chromium 验证；Firefox、WebKit、真实移动设备不在当前验收范围。
- JSX ref 形状检查仍有工具链限制，不能推断公共组件 ref 协议已解决。
- 当前六包通过本地 tarball 的独立安装与生产消费者检查；这不等于完整公共组件或 npm 发布验收。
- 截图为人工布局证据，没有跨平台像素回归基线。

Layout 的原生 Vapor slot 可含 fragment、条件 Sider 和稳定 key 列表；当前 vue-jsx RC2 的默认 slot 唯一根若写为裸 `visible && <Layout.Sider>`，条件转假可能不卸载，调用方应使用 `v-if={visible}`。动态切换 `tagName` 会更换真实根节点并可能重挂内容；普通侧栏增删不更换保留的内容节点。重排已聚焦节点可能使浏览器焦点丢失。断点只发通知，不提供自动折叠，详见 [Layout](../components/layout.md)。

样式与主题的独立 tarball 消费者验证默认 CSS、按需 SCSS、明暗/RTL、前缀与主题插件；不依赖官方 Foundation 运行时包或仓库 patch/override。覆盖登记的基础与组件样式。Input 仅有内部样式夹具；公共 Tooltip 的范围见[组件页面](../components/tooltip.md)。样式检查不扩展为全部组件或公开发布承诺。

[返回运行示例](./runtime.md)

[API 与类型约定](./api-contracts.md)提供协议夹具、props 存在性方案及 slot 解构/JSX ref 的具体限制；夹具本身不代表额外公共组件交付。

[Foundation 桥接](./foundation.md)验证固定上游输入与浮层状态机的有限路径。补丁只覆盖实际依赖闭包，不表示全套 Foundation 已兼容；资源清理只覆盖状态机自身的 destroy 与显式登记资源。

[本地产物与消费方式](./packages.md)列出实际 ESM / 声明 / 样式入口、依赖和独立安装范围。没有 CJS 入口；Node 根入口只提供静态工具，不导出 Tag、TagGroup、SplitTagGroup、Avatar、AvatarGroup、OverflowList、Collapsible、Popover、Tooltip、Progress、Highlight、Skeleton、Layout、Row、Col、Space、Divider、Button、ButtonGroup、SplitButtonGroup、IconButton、Spin、Icon、ConfigProvider、ConfigConsumer、LocaleProvider 或 LocaleConsumer，也不代表组件 SSR / 水合支持。语言字典 `locale/source/*` 与 `locale/interface` 保持纯 Node 可用静态入口。

[上游对齐与完成度](./upstream-matrix.md)按固定来源生成模块与导出清单，分别展示同名存在、内部设施、公开交付与行为验收；资源和测试夹具不计为完整公共组件。

Popover 复用 Tooltip 的当前 document/realm HTML trigger refs、primitive callback 与 owned content slots；默认 focus/关闭策略与 Tooltip 不同，见 [Popover](../components/popover.md)。没有 title/footer、custom arrow slot 或除 focusTrigger 外的实例方法；两者浏览器路径均不构成组件 SSR/水合/CJS 支持。

Avatar 的字符串 `children` 使用真实文本节点测量；富内容使用原生默认 slot，不自动缩放。AvatarGroup 根据已挂载 Avatar 的注册和真实 DOM 顺序折叠，保留折叠实例并隔离焦点；`renderMore` 接收只读描述而非可重复挂载的子节点。图片回调代次、顶部内容与上游差异见 [Avatar](../components/avatar.md)。没有公共 Image、Avatar.Group 或实例方法。

Tag 的 visible 属性按存在性区分受控，隐藏保留 DOM；富内容由原生 slot/同步 renderer 拥有。TagGroup 的稳定有效 key 在同一内容分支内保留实例，跨折叠边界可重挂；SplitTagGroup 按直接真实元素位置装饰，不检查 React/Vue VNode。无 Tag.Group 静态别名，原生事件、默认值及异常输入的差异见 [Tag](../components/tag.md)。

Typography 保留浏览器原生内容所有权；React 节点遍历、克隆和类实例 ref 不在适配范围。Numeral 的富内容格式化须显式使用 `format(value)`。稳定 key 重排验证节点身份与生命周期；锁定 Vapor 在移动已聚焦 DOM 时可能丢失焦点，组件不额外引入焦点恢复协议。复制沿固定上游同步 `execCommand` 布尔结果及反馈，不宣称异步 Clipboard API 的权限或降级能力普遍可用。复制 renderer 重执行可重挂其分支；自定义复制 renderer 没有默认操作图标的 ref 测量保证。详见 [Typography 的差异与限制](../components/typography.md)。

[Card](../components/card.md)、CardGroup 与 Card.Meta 使用客户端原生 Vapor 内容，浏览器根导出 Card/CardGroup，三个组件子路径分别为 `card`、`card/cardGroup`、`card/meta`。Node 根不导出该族；没有 Card.Group、根 Meta、类实例 ref 方法、size/layout/selected 属性或选中通知。Card 字符串 title 自动进入现有 Typography.Title 的单行 ellipsis/showTooltip 路径，继承其测量、资源清理和省略差异，应用需显式 provideAriaIdScope；ConfigProvider 不代替 ARIA scope。

Card loading 卸载正文并显示 Skeleton，标题、封面、actions 和页尾保持各自原生所有权；恢复正文会重新挂载。CardGroup 复用 Space wrap，默认间距以固定源码的 16px 为准，grid 强制为 0；它不克隆或注入子组件，不计算列数。slot 声明存在性与空输出分开，稳定 key 列表保留未删除节点，但不保证浏览器移动后的焦点。actions 的包装身份为数组索引；需要业务 key 的列表使用原生内容与 For。以上不构成 React 元素/VDOM VNode、异步 renderer、SSR、水合、CJS 或完整像素等价支持。

## List 适配边界

List / List.Item 使用原生 Vapor 所有权，不探测或克隆 VNode。固定源码数据与声明式 children 为追加关系；数据 renderer 的 React child key 无法通过原生块反向读取，具体所有权/key差异见[List 文档](../components/list.md)。没有 rowKey、Item.Meta、actions、额外角色、aria-live 或键盘协议。loading 通过 Spin 保留内容。空态只显示 List 语言文本或自定义 emptyContent，不实例化 Empty；也没有 List Foundation 状态机。组件仅提供浏览器 ESM，纯 Vapor 和普通 Vue interop 分开验证，既有严格 TSX 编译器 peer 安装限制、SSR/水合/CJS 边界保持。

锁定 Vue RC9 的互操作边界：普通 Vue `h(List)` 的 VDOM slot 再直接创建 `h(List.Item)` 时，Item 无法取得 List 的原生上下文；该组合不受支持。需要先用原生 Vapor 应用组件组合 List 与 Item，再通过普通 Vue 挂载该应用组件并传入 VDOM 内容 slot。此限制不以 slot 预执行、VNode 检查或私有实例字段规避；具体已验证组合见 [List 的普通 Vue 互操作边界](../components/list.md#普通-vue-互操作边界)。

List 的公开 `loading` 类型仍是 boolean。非法运行时真值被归一为 `true`，非法假值 `null`、`0`、`NaN`、空字符串则保留 Spin 原有语义；在全局 `Spin.delay > 0` 时可能持续 busy，因此这些越过类型边界的输入不宣称与上游完全等价。

## Descriptions 适配边界补充

固定上游的 Descriptions 调用 Foundation 分行，并会修改尾行数据的 span。Vapor 使用固定算法的私有不可变适配，保留布局与数值运算规则，避免修改调用方数据；不扩大 Foundation 补丁或运行时来源闭包。React children 提取改为原生 Item 注册，原生 renderer 仅执行实际显示分支，不能依赖上游重复调用的副作用。类型、DOM、上下文、动态内容和普通 Vue 互操作支持面见[描述列表](../components/descriptions.md)。既有 Vue RC peer 严格安装限制及 SSR、水合、CJS、完整像素等价的未支持状态保持。

## Timeline 适配边界补充

固定上游 Timeline 不实例化 Foundation，仅使用 constants、SCSS 和 React children 检查/克隆。Vapor 使用原生直接 Item 的顺序注册，保留内容所有权，支持调用方稳定 key；fragment、空位、包装组件的排列不宣称与 React.Children 完全等价。MutationObserver 仅观察根 childList 并在卸载断开；缺少该能力时不保证纯 DOM 重排的位置同步。没有横向、reverse 或 pending API。普通 Vue 显式安装 `vaporInteropPlugin` 后，已验证直接 `h(Timeline)` 数据路径与 default slot 中直接 `h(Timeline.Item)` 的 default/time slots、上下文、mode 更新、DOM 身份与焦点、条件内容卸载重挂及清理；该范围无需额外包装组件，不扩展为原生 renderer 支持任意 VNode。纯 Vapor、interop 与异常值边界见[时间轴](../components/timeline.md)。

## Breadcrumb 适配边界补充

Breadcrumb 按固定 Foundation 源码以最小原生函数适配路由归一、点击和展开协议，避免引入未补丁的 lodash 路径；声明式 Item 通过原生协作处理顺序，不检查或克隆 VNode。fragment、条件空位、包装组件的处理不宣称与 React.Children 完全等价。Item 图标不自动注入属性，使用 icon slot 的 className/size 显式绑定；renderMore 使用只读原生内容工厂数组；隐藏路由的 renderItem 按实际内容挂载惰性执行，与固定 React 先 map 全部 routes 再裁剪的调用次数和时机不同，不承诺副作用等价。调用方未阻止事件传播时，点击弹层省略项在自身和父级回调后触发展开并移除弹层；在 Item.onClick 或 Breadcrumb.onClick 中调用 stopPropagation 可阻止内部容器展开，但不取消 Item→Breadcrumb 显式通知，preventDefault 本身不阻止展开。更广的事件冒泡遵循原生 Portal 的实际 DOM，不重新派发事件模拟 React 的逻辑祖先传播。折叠、弹层与展开之间允许内容重挂；稳定 key 的身份保留以渲染分支不变为前提，带 href 项切换 active 时 span/a 分支会重建。稀疏 routes 的 renderMore rest 保留隐藏区原始 length 与空位，Popover 仍按原索引分隔，不按可见项压缩。根层标量和普通原生节点不参与 Item 排序与折叠，不能视为固定 React children 的完全等价路径。没有 Breadcrumb 上下文的 Item 虽可渲染，点击仍会在自身回调之后因缺少父级通知函数抛 TypeError，子路径不提供独立点击能力。没有按宽度折叠、受控 collapsed 或新增 ref 方法；纯 Vapor、interop、字符串截断、ARIA scope 与异常输入边界见[面包屑](../components/breadcrumb.md)。
