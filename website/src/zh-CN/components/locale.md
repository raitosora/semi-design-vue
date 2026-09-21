# LocaleProvider 国际化

LocaleProvider 为后代选择语言数据，LocaleConsumer 按组件名读取文案、语言代码、date-fns locale 与货币代码。它们不创建日期选择器、对话框或其他公共组件。

```tsx
import { LocaleProvider, LocaleConsumer, useLocaleContext } from "semi-ui-vue";
import LocaleProviderFromPath, {
  LocaleConsumer as ConsumerFromPath,
} from "semi-ui-vue/locale";
import enUS from "semi-ui-vue/locale/source/en_US";
```

组件从浏览器 Vapor 入口导入；语言包子路径是可在纯 Node 读取的静态数据。组件自身不引入样式、不创建布局 DOM；示例需要主题 tokens 时显式导入 `semi-ui-vue/styles/base.css`。当前包保持 private，尚未发布到 npm；未来发布使用 `@raitosora` scope。

## 动态语言与独立应用

下方每个示例由独立 Vapor app 挂载。使用键盘 Enter 或鼠标切换语言，子树计数和文本节点保留；第一份的语言、局部主题、方向不会改变第二份。卸载再挂载该示例会创建新的局部状态。

<ClientOnly><VaporDemo example="locale/Dynamic.vapor" /></ClientOnly>
<ClientOnly><VaporDemo example="locale/Dynamic.vapor" /></ClientOnly>

文本来自 `Modal` 字典，界面为原生 output 和 button，不代表 Modal 已实现。`aria-live="polite"` 由示例提供；Provider/Consumer 不增加焦点、角色或键盘处理。局部主题与 RTL 由原生容器负责，locale 本身不推导方向。

## 默认、fallback 与部分字典

没有任何 Provider 时默认中文 `zh_CN`。LocaleProvider 不传 locale 或显式传 `undefined` 均重置为中文，不继承外层 LocaleProvider；有有效语言时整体替换。

选择语言后，Consumer 先检查 `code` 是否为真值。缺少或空 code 时整包回退中文；有 code 的包不会逐字段补齐：缺失组件对象得到 `undefined`，组件对象里的缺失字段也保持 `undefined`。`dateFnsLocale` 仅在值为 `undefined` 时回退中文；`currency` 不单独回退。空 componentName 与不存在的组件名都按字典键读取；现有语言包没有这些键，因此得到 `undefined`。

<ClientOnly><VaporDemo example="locale/Fallback.vapor" /></ClientOnly>

此例用明确的类型转换模拟不完整外部输入，以观察真实运行时规则。公开 prop 类型要求完整 `Locale`，不把部分字典声明成合法输入；实际应用应在数据边界验证完整性，通常从现有完整语言包复制并覆盖必要字段。它不是深合并 API，不为 `null` 等非法输入提供日期格式化保证。

## 嵌套与 ConfigProvider 协作

Consumer 使用当前 ConfigProvider 的有效 locale，其优先级高于最近 LocaleProvider，即使 LocaleProvider 在 ConfigProvider 内层。ConfigProvider 的语言继承、字段移除和显式清空遵循[全局配置](./configProvider.md)：显式 `locale={undefined}` 清空该来源后，Consumer 才使用 LocaleProvider。没有传 locale 的 ConfigProvider 仍可能继承父配置或使用根中文默认值。

<ClientOnly><VaporDemo example="locale/Nested.vapor" /></ClientOnly>

两个来源各自随所属组件树更新；没有模块级可变全局语言。LocaleProvider 不异步加载语言包，不存在公共异步 loader 或请求取消 API。应用自行加载外部资源时，需自行验证数据并防止旧请求覆盖新选择。

## 日期与时区

<ClientOnly><VaporDemo example="locale/DateBoundary.vapor" /></ClientOnly>

Consumer 提供 `dateFnsLocale`，示例把它显式传给 `date-fns@2.30.0` 的 `format` 来格式化月份文字。`timeZone` 由 ConfigProvider 传递，不是 LocaleProvider prop，也不会让 date-fns 自动执行时区转换。另一段 Intl 演示对固定 UTC 时间点显式指定 IANA 时区，和配置值展示分别处理；没有实现 DatePicker/TimePicker。详见[国际化指南](../guide/internationalization.md)。

## API

### LocaleProvider

| 属性   | 类型                  | 默认值  | 说明                                |
| ------ | --------------------- | ------- | ----------------------------------- |
| locale | `Locale \| undefined` | `zh_CN` | 整包选择；省略或 undefined 重置中文 |

default slot 返回原生 Vapor 可渲染块。Provider 无事件、受控 value/model、公开 ref 方法或静态子组件，不接受 DOM attrs、class、style、direction、timeZone、children ReactNode 或 loader。布局请在外层添加原生元素。

### LocaleConsumer

| 属性          | 类型                  | 默认值 | 说明                                                           |
| ------------- | --------------------- | ------ | -------------------------------------------------------------- |
| componentName | `string \| undefined` | `''`   | 读取选定字典的组件字段；显式泛型指定已知名称时获得对应字段类型 |

default scoped slot 接收 `{ locale }`，locale 为只读 Ref，`.value` 包含：

| 字段            | 类型与含义                                                           |
| --------------- | -------------------------------------------------------------------- |
| componentLocale | 显式已知名称泛型对应组件字典或 undefined；未指定泛型或未知名称需收窄 |
| localeCode      | 选中语言的 code                                                      |
| dateFnsLocale   | 用于显式 date-fns 格式化的 locale                                    |
| currency        | 选中语言的 currency，不按语言代码推导                                |

```tsx
<LocaleConsumer<"Modal">
  componentName="Modal"
  v-slots={{
    default: ({ locale }) => (
      <span>{locale.value.componentLocale?.confirm}</span>
    ),
  }}
/>
```

当前编译器不会根据 componentName 属性自动推断 slot 字段类型；需要显式写 `<LocaleConsumer<"Modal">>`，或自行收窄 unknown。也支持函数 children 简写：`<LocaleConsumer<"Modal"> componentName="Modal">{({ locale }) => <span>{locale.value.componentLocale?.confirm}</span>}</LocaleConsumer>`。这是原生 Vapor scoped slot，不是 React `(componentLocale, localeCode, dateFnsLocale, currency) => ReactNode` 四参数回调。Ref 身份稳定，必须在响应式使用处读取 `.value`；不要在 setup 解构成静态文本。

slot 返回 JSX/原生块；文本请包在 `<span>` 中，空内容用 `<></>` 或 `[]`，不直接返回字符串、null、undefined 或 Promise。Consumer 没有额外 DOM 根、通知事件、公开 ref 方法或静态子组件，也不接受任意 attrs。

### 组合函数与类型

`useLocaleContext(() => "Modal")` 返回相同只读来源；动态组件名可传响应式 getter。它在 setup / 组件 scope 中使用，不读取其他 app 的语言。Provider 更新会触发所属组件的响应式读取；组件卸载后停止其渲染与作用域 watcher，不保留跨 app 的语言缓存。外部主动保留的 Ref 不属于可销毁句柄，本接口不承诺卸载后读取它一定失效。

`useLocaleContext()` 也可不传参数，此时按空字符串读取组件字段，现有字典返回 `undefined`；语言代码、日期 locale 和 currency 仍可读取。

| 公开类型                                                  | 用途                                 |
| --------------------------------------------------------- | ------------------------------------ |
| `LocaleProviderProps` / `LocaleProviderSlots`             | 完整字典输入与默认 slot              |
| `LocaleConsumerProps<Name>` / `LocaleConsumerSlots<Name>` | 字符串 key 与只读 Ref 作用域         |
| `LocaleContextValue<Name>` / `LocaleContextSource<Name>`  | 当前字段及元数据快照、只读响应式来源 |
| `Locale`（`locale/interface` 子路径）                     | 生成的完整语言包接口                 |

上述组件类型从浏览器根或 `semi-ui-vue/locale` 导出。语言包保留固定来源的完整 `Locale` 声明，包含实际组件字段；不因对应 UI 组件尚未实现而裁剪字典。

## 验证与限制

真实示例参与文档开发与生产浏览器检查、E2E、源码及生成声明类型检查；回归覆盖动态语言、默认/fallback、嵌套、ConfigProvider 优先级、组件实例与 DOM 保留、多 app 隔离和卸载。局部深浅色、RTL、375px 窄屏截图用于人工审阅，不代表完整像素级一致性。

组件是浏览器原生 Vapor API，没有组件 SSR、水合或 CJS 支持承诺；ClientOnly 只在浏览器挂载示例。纯 Vapor 与普通 Vue interop 证据分开。保持 `skipLibCheck=false`；额外 exactOptional 调用点验证不表示所有依赖声明均兼容。Vue RC9 与 vue-jsx RC2 独立 TSX 编译器的严格 peer 安装限制仍有效。详见[兼容边界](../guide/compatibility.md)。

## 上游与同步维护

来源固定为 Semi Design 2.103.0、提交 `8bed560dd3f36579f85b7a522f19762f2bace756` 的 locale Provider、Consumer、interface、字典与文档。语言包从既有生成器维护，不直接修改生成物。Vue 使用作用域注入和原生 slot 替代 React Context/Consumer；ConfigProvider 按字段继承及稳定包装沿用现有 Vue 契约。fallback、整体替换、日期语言与 currency 读取依据固定上游行为。

查看[资源索引](../guide/resource-index.md)、[完成度矩阵](../guide/upstream-matrix.md)及[API 与类型约定](../guide/api-contracts.md)。同名导出和完整字典本身不构成公共 UI 组件的行为验收。
