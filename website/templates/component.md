# 组件名称

> 编写模板。使用时创建实际页面，删除本段；未实现能力不要写为支持。

## 用途与导入

写清使用场景、已验证的包入口和样式入口。

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
