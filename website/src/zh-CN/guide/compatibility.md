# 兼容边界

## 已建立的路径

文档 shell 为 VitePress 普通 Vue SSR/客户端水合；真实 TSX 示例预编译为 Vapor，在 ClientOnly 中动态导入并使用独立 `createVaporApp` 挂载。示例不复用服务端 DOM，不把客户端挂载称为示例水合。

另行验证 shell 的 interop 及独立纯 Vapor 构建。当前组合为 Vue 3.6.0-rc.8、vue-jsx 3.3.0-rc.1、Vite 8.3.0、VitePress 2.0.0-alpha.20；均以锁文件为准，预发布工具链仍需持续验收。

## 尚未验证的能力

- 公共组件尚未实现；SSR、组件水合与全量 Semi 视觉对齐尚未验收。
- 先前 SSR 探针存在点击后静态文本丢失的水合问题，本页没有以 ClientOnly 掩盖为已修复。
- 只在指定 Chromium 验证；Firefox、WebKit、真实移动设备不在当前验收范围。
- JSX ref 形状检查仍有工具链限制，不能推断公共组件 ref 协议已解决。
- 生成声明与现有协议/版本入口消费检查，不等于 tarball 安装或完整生产消费者验证。
- 截图为人工布局证据，没有跨平台像素回归基线。

[返回运行示例](./runtime.md)

[API 与类型约定](./api-contracts.md)提供已验证协议夹具、props 存在性方案及 slot 解构/JSX ref 的具体限制，不代表已交付公共组件。
