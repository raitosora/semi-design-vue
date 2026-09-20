# 兼容边界

## 已建立的路径

文档 shell 为 VitePress 普通 Vue SSR/客户端水合；真实 TSX 示例预编译为 Vapor，在 ClientOnly 中动态导入并使用独立 `createVaporApp` 挂载。示例不复用服务端 DOM，不把客户端挂载称为示例水合。

另行验证 shell 的 interop 及独立纯 Vapor 构建。当前组合为 Vue 3.6.0-rc.9、vue-jsx 3.3.0-rc.2、Vite 8.3.0、VitePress 2.0.0-alpha.20；均以锁文件为准，预发布工具链仍需持续验收。

## 尚未验证的能力

- 公共组件尚未实现；SSR、组件水合与全量 Semi 视觉对齐尚未验收。
- 先前 SSR 探针存在点击后静态文本丢失的水合问题，本页没有以 ClientOnly 掩盖为已修复。
- 只在指定 Chromium 验证；Firefox、WebKit、真实移动设备不在当前验收范围。
- JSX ref 形状检查仍有工具链限制，不能推断公共组件 ref 协议已解决。
- 当前六包通过本地 tarball 的独立安装与生产消费者检查；这不等于完整公共组件或 npm 发布验收。
- 截图为人工布局证据，没有跨平台像素回归基线。

样式与主题的独立 tarball 消费者验证默认 CSS、按需 SCSS、明暗/RTL、前缀与主题插件；不依赖 Foundation 运行时包或仓库 patch/override。只覆盖登记的基础、Input / Tooltip 样式，不意味着这些公共组件可用，不扩展为全部组件样式或公开发布承诺。

[返回运行示例](./runtime.md)

[API 与类型约定](./api-contracts.md)提供已验证协议夹具、props 存在性方案及 slot 解构/JSX ref 的具体限制，不代表已交付公共组件。

[Foundation 桥接](./foundation.md)验证固定上游输入与浮层状态机的有限路径。补丁只覆盖实际依赖闭包，不表示全套 Foundation 已兼容；资源清理只覆盖状态机自身的 destroy 与显式登记资源。

[本地产物与消费方式](./packages.md)列出实际 ESM / 声明 / 样式入口、依赖和独立安装范围。没有 CJS 入口；Node 静态导入安全不代表组件 SSR / 水合支持。
