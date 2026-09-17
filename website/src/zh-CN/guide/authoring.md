# 文档编写模板

从首个公共组件开始，每项实现同时维护中文页面、API 表、真实示例与测试。完整模板位于 `website/templates/component.md`。

## 页面结构

1. 组件用途与适用边界。
2. 导入方式、必要样式和依赖说明，仅写已验证能力。
3. 基础、状态、组合及边界示例。
4. Props、默认值、事件参数与返回值、slots、ref、静态子组件表。
5. 受控行为、键盘和无障碍说明。
6. 已测浏览器、类型及 SSR 限制。

## 真实源码流程

在 `website/examples/<module>/` 新增 `.tsx` 文件，默认导出 Vue `defineVaporComponent`。setup 直接返回 TSX；编译器和 TS-Macro 共用 `vapor: true` 配置。不要把普通 VDOM render 函数当作 Vapor。

页面使用 ClientOnly 包裹 VaporDemo，通过去掉 `.tsx` 后的相对路径选择示例。源码展示与执行模块在同一次预编译中从同一 TSX 文件生成，不手抄代码。运行 `pnpm docs:dev` 会先重新构建；修改示例后重新启动该命令刷新预编译快照，不声明 TSX 示例热更新支持。不要复制夹具到公共包。

```html
<ClientOnly>
  <VaporDemo example="fixture/Counter.vapor" />
</ClientOnly>
```

## 验证

运行 `pnpm check:docs`：预编译、严格类型、依赖策略、静态构建、链接与锚点、生产/开发浏览器检查全部完成后，才能标记文档完成。新增交互必须添加有效行为断言；目录或截图存在不算通过。

公共协议参见 [API 与类型约定](./api-contracts.md)。新增交互须在真实 TSX 与生成声明两条路径验证，不依赖类型断言掩盖协议缺口。
