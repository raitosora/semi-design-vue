# 上下文与默认配置

Semi Design Vue 提供类型化的上下文内核，用于应用自己的组合函数和原生 Vapor 组件。当前接口从 `semi-ui-vue` 根入口导出；尚无公开 ConfigProvider、LocaleProvider 或命令式弹层组件。

## 动态继承与应用隔离

下面两个示例分别运行在独立的 Vapor 应用中。切换左侧示例的语言、时区或内层覆盖，不影响另一个示例。静态接口按钮读取的是当前外层配置，不创建额外的组件或 DOM。

<ClientOnly><VaporDemo example="context/Context.vapor" /></ClientOnly>
<ClientOnly><VaporDemo example="context/Context.vapor" /></ClientOnly>

```ts
import { provideSemiContext, useSemiContext } from "semi-ui-vue";
import { ref } from "vue";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

// 在父组件 setup 中：getter 保留后续响应式更新。
const direction = ref<"ltr" | "rtl">("ltr");
provideSemiContext(() => ({ locale: zhCN, direction: direction.value }));

// 在后代组件 setup 中：读取 .value，不解构成一次性快照。
const context = useSemiContext();
```

每个 Provider 调用派生一个来源，不修改父层。优先级是显式调用方字段 → 最近的注入来源 → 内核默认值。按 own key 判断存在性：缺失继承、显式 `undefined` 清除，移除自己的字段后恢复继承。方向只接受 `ltr`、`rtl` 或 `undefined`；时区保留 `0` 和空字符串，内核只传递设置，不执行日期转换。

`locale` 整体替换；`date` 和 `config` 合并各自的第一层 own 属性，显式 `undefined` 可清空整个字段。`overrideDefaultProps` 是 config 的一个属性，内层提供它时替换整个映射，不做隐藏的深合并。输入通过 getter 读取响应式状态；普通非响应式对象的原地修改不保证通知，推荐用 ref/shallowRef 替换快照。快照为浅只读，不深冻结调用方的语言对象、回调或其他业务数据。

## 上下文字段

| 字段        | 类型                                            | 无覆盖时的默认值   | 说明                                                         |
| ----------- | ----------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `locale`    | `Locale \| undefined`                           | 固定来源的 `zh_CN` | 使用现有语言资源；清空后由具体消费者决定 fallback            |
| `config`    | `SemiGlobalConfig \| undefined`                 | `{}`               | 类型化组件默认值映射；不隐式订阅进程级 semiGlobal            |
| `direction` | `'ltr' \| 'rtl' \| undefined`                   | `'ltr'`            | 传递方向数据，组件自行应用到 DOM                             |
| `date`      | `DateSettings \| undefined`                     | `{}`               | 当前支持 `timeZone?: string \| number`                       |
| `container` | `(() => HTMLElement \| undefined) \| undefined` | `undefined`        | 惰性获取容器；读取上下文不会调用它，不隐式访问 document.body |

`createSemiContext(input?, parent?)` 返回只读响应式来源，可在组件外构造。`provideSemiContext(input?)` 和 `useSemiContext(explicit?)` 在 setup 中调用。`semiContextKey` 是公开的类型化 InjectionKey；需要应用级注入时，可用 Vue 的 `app.provide(semiContextKey, source)`。多 app 应各自创建来源；显式共享同一个来源时，更新自然会共享。

组件的显式字段应从未归一化的 props bag 或公开 `useAttrs()` 构造。受存在性检测约束的字段不要登记为带默认值的 runtime props，也不要无条件构造 `{ direction: props.direction }`：这会把缺失变成显式清空。详见 [API 与类型约定](./api-contracts.md)。

## 全局默认值与初始化

`createSemiGlobal<Components>()` 创建独立配置容器。`configure(config)` **替换**配置，`configure({})` 移除覆盖；读取 `.config` 获得只读快照。导出的 `semiGlobal` 是可选择使用的模块单例，适合单应用的启动配置。多 app、测试隔离或请求级数据应使用各自的 factory 实例。

```ts
import { createSemiGlobal, createDefaultPropsResolver } from "semi-ui-vue";

type AppProps = {
  Preview: { enabled?: boolean; count?: number; label?: string };
};
const defaults = createSemiGlobal<AppProps>();
defaults.configure({
  overrideDefaultProps: { Preview: { enabled: false, count: 0, label: "" } },
});

// 每个组件实例在 setup 中创建一次。
const resolver = createDefaultPropsResolver(defaults, "Preview", {
  enabled: true,
});
const first = resolver.resolve({ label: undefined });
// first: enabled=false, count=0, label=undefined
const restored = resolver.resolve({});
// restored.label === ""
```

优先级为调用方 own props → 创建 resolver 时捕获的全局覆盖 → 内置默认值。`false`、`0`、空字符串和显式 `undefined` 都保留。`resolve` 不更改输入，不调用作为值传入的函数，也不解包 Ref。后续 `configure` 只影响新建 resolver；已有 resolver 保留初始默认快照，但每次 `resolve(rawProps)` 都读取最新的调用方字段。

`Components` 将组件名与对应 props 关联。`SemiComponentProps` 是为库内公开组件保留的可扩展接口，目前没有虚构尚未交付组件的 props。应用自有的默认配置应使用显式泛型，如上面的 `AppProps`。这个例子的 Preview 只是类型名称，不是组件导出。

## Foundation 与静态调用

```ts
import {
  createStaticContext,
  getFoundationContexts,
  useSemiContext,
} from "semi-ui-vue";

// setup 内捕获最近的明确来源。
const context = useSemiContext();
const staticContext = createStaticContext(context);
// 回调或组件外的调用者显式持有该句柄。
const latest = staticContext.get();
// 提前失效可调用 dispose；重复调用安全。
staticContext.dispose();
// get() 现在返回 undefined。

// 接入 useFoundation 的选项：
const contexts = () => getFoundationContexts(context);
```

`getFoundationContexts` 仅返回命名的 locale/config/direction/date/container 快照；Foundation 每次读取 getter 可取得当前值。它不枚举实例注入对象，也不会透传其他库的上下文。该 getter 不会自动重跑 Foundation 的 init 或 props watcher；具体组件需显式消费相关依赖，定义哪些状态随上下文更新。

在 setup 或 Vue effect scope 中创建的静态句柄随所属 scope 卸载失效，之后不再读取原来源。组件外创建时由调用方显式 `dispose()`；无参数创建的句柄不猜测“最后一个应用”，`get()` 返回 `undefined`。句柄可以传给另一个应用中的测试或调用者，它始终指向创建时指定的来源。这是上下文传递协议，不包含 host、Portal、Toast、Notification 或 Modal 的生命周期 API。

## 与固定 Semi 来源的映射

基准为 Semi Design `2.103.0`。上游 ConfigContext 暴露 direction/timeZone/locale/getPopupContainer；此处将日期和容器拆成明确字段。上游 ConfigProvider 默认 zh_CN/ltr/responsiveObserve=false，但嵌套 Provider 并不自动合并父层；这里的按字段继承是明确的 Vue 契约。

上游独立 LocaleContext 与 ConfigContext 有双来源优先级，LocaleConsumer 还负责中文 fallback 与 date-fns fallback。当前内核提供统一语言来源，尚未实现这些公开 Provider/Consumer 的完整策略。responsiveMap、screens、onBreakpoint 和默认 responsive map 已登记为未来 Provider 的接口范围，当前不注册媒体监听。

上游 `semiGlobal.config.overrideDefaultProps` 使用延迟读取的 Proxy，配置可在组件导入后设置。这里用创建实例时捕获的默认值和显式 `configure` 替换配置；不依赖框架默认 props 工厂。上游 `semiGlobal.config.createRoot` 只用于 React 渲染根，不提供 Vue 映射。上游静态通知的默认配置/选项合并行为只作为接口依据，当前没有对应公共组件。

## 验证范围

`exactOptionalPropertyTypes` 的调用方字段支持显式 `undefined`。锁定的 Vue 3.6 RC 自身声明在该选项下仍有类型不兼容，因此不承诺整个依赖链的 exact-optional 检查通过；普通严格声明检查与额外的调用点检查分别运行。

真实 Vapor 示例覆盖响应式更新、嵌套覆盖、显式清空、移除恢复、多 app 与卸载重挂；类型与仅含构建产物的独立消费者验证同一接口。纯 Node 导入与惰性容器验证不等于组件 SSR/水合支持。JSX ref、slots、浏览器及视觉边界继续见[兼容边界](./compatibility.md)。当前包保持 private，未来发布统一使用 `@raitosora` scope。
