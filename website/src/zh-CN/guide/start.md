# 项目介绍

Semi Design Vue 是面向 Vue 的 Semi Design 实现，Vapor 是采用的编译和运行模式。

当前正在建设基础设施，尚无可安装使用的公共组件版本。包保持 private，未来发布统一使用 `@raitosora` scope；现在不提供 npm 安装命令。

本地构建包的 CSS / SCSS 入口见[安装与样式](./styles.md)，明暗、RTL 和自定义主题见[定制主题](./theme.md)。

## 从真实示例开始

[打开真实 Vapor 示例](./runtime.md)，体验独立状态、挂载与卸载，再对照可复制的 TSX 源码。

示例只有必要原生 HTML 夹具，不是 Semi 的 Button 等公共组件。文档 shell 使用普通 Vue；示例本身由专用 JSX 编译器生成直接 DOM 操作。

## 支持范围

请先阅读[兼容边界](./compatibility.md)。文档站静态构建成功不代表组件库支持 SSR 或水合。
