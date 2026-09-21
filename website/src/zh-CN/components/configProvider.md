# ConfigProvider 全局配置

ConfigProvider 为后代提供语言数据、时区、方向、弹层容器和响应式断点配置。每层配置继承最近的来源；不同 Vue app 的配置独立。它不创建日期控件、弹层组件或语言 Consumer。

```tsx
import { ConfigProvider, ConfigConsumer, useConfigContext } from "semi-ui-vue";
// 同一组件的子路径：
import ConfigProviderFromPath from "semi-ui-vue/configProvider";
```

仅浏览器 Vapor 入口提供这些组件。UI 的纯 Node 根入口仍是静态工具，组件 SSR、水合与 CJS 尚不支持。包保持 private；当前没有 npm 发布安装命令。ConfigProvider 本身不自动导入 CSS；需要主题规则时显式导入 `semi-ui-vue/styles/base.css`。

## 嵌套、动态配置与 RTL

切换外层语言、时区和方向，再覆盖、清空或移除内层方向。子树计数保留，方向切换不会重挂组件。局部深浅色按钮使用原生外层的 semi-always-light / semi-always-dark 类与既有 CSS tokens，主题不是 ConfigProvider prop，也不修改文档站主题。语言与时区只传递数据，此例不执行翻译 fallback 或日期转换。

<ClientOnly><VaporDemo example="configProvider/Nested.vapor" /></ClientOnly>

缺失字段继承最近配置；显式 `undefined` 清空 locale、timeZone、direction 和 getPopupContainer，删除 own 字段恢复继承。`responsiveMap={undefined}` 恢复默认 map，`responsiveObserve={undefined}` 关闭监听。locale 整体替换，不深合并字典。通过响应式 getter 或替换对象更新，不保证普通对象的非响应式原地改写会通知。

Provider 始终渲染一个稳定的 `div`。它设置 `dir`，仅 RTL 时添加 `semi-rtl`；内层 LTR 可以覆盖父层方向。与上游 React 仅在 RTL 添加包装的方式不同，本实现保持根节点和后代局部状态。`direction={undefined}` 清空上下文与自身 `dir`，浏览器仍按原生 DOM 继承祖先文字方向，不能把它解释成强制 LTR。

## 响应式订阅与清理

调整窗口宽度，观察 md 与通知次数；暂停后保留最后快照，恢复时重新采样。卸载最后一个订阅者会解除该 Provider 的全部媒体监听；重新挂载会创建新的订阅。

<ClientOnly><VaporDemo example="configProvider/Responsive.vapor" /></ClientOnly>

`responsiveObserve` 默认 false；开启后仍按需监听，第一位订阅者才创建六个 MediaQueryList。每次订阅同步交付当前快照。替换 map 引用或重新启用会重新读取媒体状态并通知；不监听同一个 map 对象的字段原地修改。禁用会释放监听并保留快照。Provider 卸载会使旧回调失效。要求现代 `MediaQueryList.addEventListener`，不提供 legacy addListener 兼容层。

## 弹层容器与独立应用

以下两个示例分别由独立 app 挂载。打开各自浮层，切换第一份的容器和方向，第二份保持原状态。浮层由已有 `createOverlayHost` 创建；它通过显式 StaticContext 读取当前 Provider 的配置，移动同一个节点并保留内部计数。

<ClientOnly><VaporDemo example="configProvider/Overlay.vapor" /></ClientOnly>
<ClientOnly><VaporDemo example="configProvider/Overlay.vapor" /></ClientOnly>

`getPopupContainer` 是惰性 getter；读取配置不调用它。Provider 将其交给已有 Semi context，host 在需要容器时读取。示例容器都在同一 document；host 仍限制创建它的 realm/document。不能通过配置把已有 Vapor host 移入另一个 document；iframe 内需由 iframe 自己的环境创建 app/host。卸载配置区域会清理自己的 host，不销毁另一 app 的浮层。详见[浮层指南](../guide/overlay.md)。

## ConfigProvider API

| 属性              | 类型                                            | 默认值 / 继承        | 说明                                                               |
| ----------------- | ----------------------------------------------- | -------------------- | ------------------------------------------------------------------ |
| locale            | `Locale \| undefined`                           | 根层 zh_CN           | 传递语言资源；后代 LocaleConsumer 按独立优先级与 fallback 规则读取 |
| timeZone          | `string \| number \| undefined`                 | 无                   | 保留 0 和空字符串；不转换日期                                      |
| direction         | `'ltr' \| 'rtl' \| undefined`                   | 根层 ltr             | 动态上下文与稳定 div 的方向                                        |
| getPopupContainer | `(() => HTMLElement \| undefined) \| undefined` | 无                   | 惰性容器，undefined 由使用方按其容器规则回退                       |
| responsiveMap     | `ResponsiveMap \| undefined`                    | defaultResponsiveMap | 六个字段完整替换，不是局部 patch                                   |
| responsiveObserve | `boolean \| undefined`                          | false                | 开关本层按需媒体订阅                                               |

没有通知事件、受控 value/model、公开 ref 方法或静态子组件。default slot 返回 JSX/原生可渲染块；文本请用 `<span>` 包裹，空内容用 `<></>`（空 fragment）或 `[]`，不直接返回字符串、null 或 undefined。不接受任意 DOM attrs、style、className 或 prefixCls；需要布局和主题容器时由调用方在外层提供原生元素。

静态成员 `ConfigProvider.defaultResponsiveMap` 与子路径命名导出 `defaultResponsiveMap` 是同一个只读映射：

| 断点 | 媒体查询              |
| ---- | --------------------- |
| xs   | `(max-width: 575px)`  |
| sm   | `(min-width: 576px)`  |
| md   | `(min-width: 768px)`  |
| lg   | `(min-width: 992px)`  |
| xl   | `(min-width: 1200px)` |
| xxl  | `(min-width: 1600px)` |

## ConfigConsumer 与组合函数

ConfigConsumer 使用原生 Vapor scoped slot；参数里的 `config` 是只读 Ref，动态字段通过 `config.value` 读取。它不是 React Context.Consumer 的 children 回调运行机制，不会缓存、克隆 VNode 或通过重挂载伪造更新。

```tsx
<ConfigConsumer
  v-slots={{ default: ({ config }) => <span>{config.value.direction}</span> }}
/>
```

也支持函数 children 简写：`<ConfigConsumer>{({ config }) => <span>{config.value.direction}</span>}</ConfigConsumer>`。两种形式均进行源码与构建声明的正反类型检查。

setup 内也可以 `const config = useConfigContext()`，得到相同的来源协议。不要把 `config.value.direction` 解构成 setup 常量。slot 的 `config` 来源身份稳定，而 `.value` 随配置更新。

ConfigContextValue 包含上表六个字段，并提供只读 `screens` 和 `onBreakpoint`。没有 Provider 时使用根默认配置、六个 false 的 screens，onBreakpoint 为 undefined。

```ts
import { onScopeDispose } from "vue";

const config = useConfigContext();
const stop = config.value.onBreakpoint?.((screens) => {
  console.log(screens.md);
});
// 或只订阅指定断点；初次为每个指定 key 同步通知。
const stopMd = config.value.onBreakpoint?.(["md"], (screen, match) => {
  console.log(screen, match);
});
onScopeDispose(() => {
  stop?.();
  stopMd?.();
});
```

订阅返回幂等取消函数；订阅者负责在自己的 scope 结束时取消，Provider 卸载另有整体兜底清理。回调可读取自身响应式状态，不应因此重复注册媒体监听。

公开类型包括 ConfigProviderProps、ConfigProviderSlots、ConfigConsumerProps、ConfigConsumerSlots、ConfigContextValue、ConfigContextSource、Breakpoint、ResponsiveMap、BreakpointScreens、OnBreakpoint、OnBreakpointScreensCallback、OnBreakpointChangeCallback 和 ResponsiveConfig。slot 接收响应式配置来源，类型不宣称与 ReactNode/React Consumer 同构。

## 差异与验证边界

来源固定为 Semi Design 2.103.0。本实现明确增加按字段的嵌套继承、动态移除恢复及稳定 DOM 包装；上游 React Provider 不自动合并父配置。上游订阅本来就返回取消函数；本实现另明确卸载后的失效保护，以及 responsiveObserve 重启和 map 更新时重新采样并通知的行为。响应式生命周期、回调失效与多 app 隔离由真实浏览器测试验证。

locale/timeZone/getPopupContainer 复用已有 context；`semiGlobal` 的默认 props 初始化策略保持[上下文指南](../guide/context.md)约定，不自动订阅进程单例。[LocaleProvider/LocaleConsumer](./locale.md) 提供语言选择与 fallback；实际 ConfigProvider 的非空 locale 优先于独立 LocaleProvider。ConfigProvider 自身仍只传递字典与时区，不执行日期格式化。

运行示例参与源码与生成声明检查、文档开发/生产浏览器及包消费者验证。纯 Vapor 与普通 Vue interop 分开验证；`skipLibCheck=false` 保留，额外 exactOptional 调用点检查不代表所有依赖声明兼容。Vue RC9 / vue-jsx RC2 的独立编译器严格 peer 安装限制仍在，预编译消费者不代表该限制已解除。仅在 Chromium 验证，截图不是完整像素级一致性。详见[兼容边界](../guide/compatibility.md)与[完成度矩阵](../guide/upstream-matrix.md)。
