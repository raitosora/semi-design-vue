# 真实 Vapor 示例

同一份 TSX 文件预编译后由两个独立 `createVaporApp` 容器运行。点击其中一个计数器，另一个保持自己的状态；卸载会移除监听器和定时器，重新挂载会重置状态。

<ClientOnly><VaporDemo example="fixture/Counter.vapor" /><VaporDemo example="fixture/Counter.vapor" /></ClientOnly>

## API 表示例

以下为文档测试夹具的参数，不是未来公共组件协议。

| 参数  | 类型   | 默认值     | 说明                             |
| ----- | ------ | ---------- | -------------------------------- |
| label | string | 独立计数器 | 夹具标题，interop 验证中动态更新 |

无公开事件、slots、ref 或静态子组件；此处不预设公共组件 API。

## Shell interop

下面是普通 Vue 文档 shell 安装 `vaporInteropPlugin` 后消费同一个预编译夹具。它与上面的独立 Vapor 应用分开验证，不用于证明整个站点为纯 Vapor。

<ClientOnly><InteropProbe /></ClientOnly>

[阅读兼容边界](./compatibility.md)
