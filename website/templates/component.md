# 组件名称

> 编写模板。使用时创建实际页面，删除本段；未实现能力不要写为支持。

## 用途与导入

写清使用场景、已验证的包入口和样式入口。

样式沿用[安装与样式](../src/zh-CN/guide/styles.md)的固定来源和按需入口；新增模块需登记其完整 SCSS 闭包，并验证默认/定制前缀、CSS tokens、明暗、RTL 与独立消费者。仅存在样式不能作为组件实现完成的证据。

## 基础示例

在 website/examples/<module>/ 新增真实 TSX 默认导出，使用 ClientOnly + VaporDemo 的 example 属性引用路径。

## API

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |

分别列出事件参数与返回值、slots/render callbacks、公开 ref、静态子组件及根/子路径导出。无相关能力时明确原因；遵循 [API 与类型约定](../src/zh-CN/guide/api-contracts.md)。受控字段存在性在默认值归一化前检测；明确通知与返回值回调的区分、受控切换策略、attrs 的目标与过滤、slot 动态参数访问、普通 Ref 类型赋值和静态/泛型边界。

## 受控、边界与无障碍

列出已实现的状态控制、键盘行为、焦点和 ARIA，以及空值/禁用/错误状态。

## 验证与限制

链接实际交互测试；登记类型、浏览器、SSR/ClientOnly 与视觉验证范围。源码必须来自实际执行的文件。

连接 Foundation 时遵循 [Foundation 桥接](../src/zh-CN/guide/foundation.md)：列出 props watch 驱动的具体更新、同步状态与 DOM 回调边界、资源归属、异步过期策略，以及所需上游入口的补丁/依赖闭包验证。

资源使用遵循[图标、插画与语言数据](../src/zh-CN/guide/resources.md)：从生成资源的公开入口导入，保留动态 size/color 与 SVG 引用隔离；资源名与数量以[资源索引](../src/zh-CN/guide/resource-index.md)为准。语言数据选择与 Provider 行为分开描述，不把静态字典展示当作全局国际化实现。
