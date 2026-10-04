# 兼容边界

## 已建立的路径

文档 shell 为 VitePress 普通 Vue SSR/客户端水合；真实 TSX 示例预编译为 Vapor，在 ClientOnly 中动态导入并使用独立 `createVaporApp` 挂载。示例不复用服务端 DOM，不把客户端挂载称为示例水合。

另行验证 shell 的 interop 及独立纯 Vapor 构建。当前组合为 Vue 3.6.0-rc.9、vue-jsx 3.3.0-rc.2、Vite 8.3.0、VitePress 2.0.0-alpha.20；均以锁文件为准，预发布工具链仍需持续验收。浏览器 Bundler 条件下的 UI 根入口提供 `Avatar`、`AvatarGroup`、`OverflowList`、`Collapsible`、`Popover`、`Tooltip`、`Progress`、`Highlight`、`Skeleton`、`Layout`、`Row`、`Col`、`Space`、`Divider`、`Button`、`ButtonGroup`、`SplitButtonGroup`、`IconButton`、`Spin`、`Icon`、`ConfigProvider`、`ConfigConsumer`、`LocaleProvider` 与 `LocaleConsumer`；纯 Node 条件的根入口只保留静态工具，其声明也按同一条件收窄。

## 尚未验证的能力

- Avatar、AvatarGroup、OverflowList、Collapsible、Popover、Tooltip、Progress、Highlight、Skeleton、Layout、Row、Col、Space、Divider、Button、ButtonGroup、SplitButtonGroup、IconButton、Spin、Icon、ConfigProvider、ConfigConsumer、LocaleProvider 与 LocaleConsumer 已实现客户端 Vapor 路径；组件 SSR、水合、CJS 与全量 Semi 视觉对齐尚未验收。`semi-icons-vue` 根入口和 `semi-icons-vue/Icon` 同样只在浏览器 Vapor 路径验证。`semi-ui-vue/avatar`、`semi-ui-vue/avatar/avatarGroup`、`semi-ui-vue/overflowList`、`semi-ui-vue/collapsible`、`semi-ui-vue/popover`、`semi-ui-vue/tooltip`、`semi-ui-vue/progress`、`semi-ui-vue/highlight`、`semi-ui-vue/skeleton`、`semi-ui-vue/layout`、`semi-ui-vue/grid`、`semi-ui-vue/space`、`semi-ui-vue/divider`、`semi-ui-vue/button`、`semi-ui-vue/button/buttonGroup`、`semi-ui-vue/button/splitButtonGroup`、`semi-ui-vue/iconButton`、`semi-ui-vue/spin`、`semi-ui-vue/configProvider` 与 `semi-ui-vue/locale` 同样仅用于浏览器；其他公共组件的交付状态以[上游对齐与完成度](./upstream-matrix.md)和各组件页面为准。
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

[本地产物与消费方式](./packages.md)列出实际 ESM / 声明 / 样式入口、依赖和独立安装范围。没有 CJS 入口；Node 根入口只提供静态工具，不导出 Avatar、AvatarGroup、OverflowList、Collapsible、Popover、Tooltip、Progress、Highlight、Skeleton、Layout、Row、Col、Space、Divider、Button、ButtonGroup、SplitButtonGroup、IconButton、Spin、Icon、ConfigProvider、ConfigConsumer、LocaleProvider 或 LocaleConsumer，也不代表组件 SSR / 水合支持。语言字典 `locale/source/*` 与 `locale/interface` 保持纯 Node 可用静态入口。

[上游对齐与完成度](./upstream-matrix.md)按固定来源生成模块与导出清单，分别展示同名存在、内部设施、公开交付与行为验收；资源和测试夹具不计为完整公共组件。

Popover 复用 Tooltip 的当前 document/realm HTML trigger refs、primitive callback 与 owned content slots；默认 focus/关闭策略与 Tooltip 不同，见 [Popover](../components/popover.md)。没有 title/footer、custom arrow slot 或除 focusTrigger 外的实例方法；两者浏览器路径均不构成组件 SSR/水合/CJS 支持。

Avatar 的字符串 `children` 使用真实文本节点测量；富内容使用原生默认 slot，不自动缩放。AvatarGroup 根据已挂载 Avatar 的注册和真实 DOM 顺序折叠，保留折叠实例并隔离焦点；`renderMore` 接收只读描述而非可重复挂载的子节点。图片回调代次、顶部内容与上游差异见 [Avatar](../components/avatar.md)。没有公共 Image、Avatar.Group 或实例方法。
