# 项目介绍

Semi Design Vue 是面向 Vue 的 Semi Design 实现，Vapor 是采用的编译和运行模式。

当前提供 [Divider 分割线](../components/divider.md)、[Button / ButtonGroup / SplitButtonGroup](../components/button.md)、[IconButton](../components/iconButton.md)、[Spin](../components/spin.md)、[Icon](../components/icons.md) 、[ConfigProvider / ConfigConsumer](../components/configProvider.md) 与 [LocaleProvider / LocaleConsumer](../components/locale.md)，其余组件仍在建设中。它们仅在浏览器 Vapor 应用中从 `semi-ui-vue` 根入口使用；纯 Node 根入口只保留静态工具。包保持 private，未来发布统一使用 `@raitosora` scope；现在不提供 npm 安装命令。

本地 tarball、预编译 ESM、声明与依赖说明见[本地产物与消费方式](./packages.md)。

本地构建包的 CSS / SCSS 入口见[安装与样式](./styles.md)，明暗、RTL 和自定义主题见[定制主题](./theme.md)。

## 从真实示例开始

[打开真实 Vapor 示例](./runtime.md)，体验独立状态、挂载与卸载，再对照可复制的 TSX 源码。

组件页面提供已交付组件的真实示例；运行模式与基础设施页面使用必要原生 HTML 夹具和辅助控件，不表示未列出的公共组件已交付。文档 shell 使用普通 Vue；示例本身由专用 JSX 编译器生成直接 DOM 操作。

## 支持范围

请先阅读[兼容边界](./compatibility.md)。文档站静态构建成功不代表组件库支持 SSR 或水合。

[上游对齐与完成度](./upstream-matrix.md)按固定来源生成模块与导出清单，分别展示同名存在、内部设施、公开交付与行为验收；资源和测试夹具不计为完整公共组件。
