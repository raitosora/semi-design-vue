# 国际化

Semi Design Vue 提供生成的完整语言字典，以及浏览器原生 Vapor 的 LocaleProvider / LocaleConsumer。应用通过 Provider 选择语言，通过 Consumer 或 `useLocaleContext` 读取响应式来源；字典包含的组件名称不表示对应组件已经实现。

## 选择语言

```tsx
import { LocaleProvider, LocaleConsumer } from "semi-ui-vue";
import enUS from "semi-ui-vue/locale/source/en_US";

<LocaleProvider locale={enUS}>
  {() => (
    <LocaleConsumer<"Modal">
      componentName="Modal"
      v-slots={{
        default: ({ locale }) => (
          <span>{locale.value.componentLocale?.confirm}</span>
        ),
      }}
    />
  )}
</LocaleProvider>;
```

语言包子路径按需导入，不需要从 UI 根加载全部字典。完整列表见[资源索引](./resource-index.md)。没有 Provider 时使用 zh_CN；LocaleProvider 缺省或显式 undefined 同样重置中文。每个 app 与子树的语言独立，切换无需重挂后代，也不设置全局单例。真实动态、嵌套、多 app 与 fallback 示例见[LocaleProvider 国际化](../components/locale.md)。

## 和全局配置共同使用

如果已经使用 ConfigProvider，可以直接配置它的 locale。LocaleConsumer 优先读取 ConfigProvider 有效来源，其后才是最近的 LocaleProvider。内部 LocaleProvider 不会盖过外部 ConfigProvider；需要释放配置来源时显式设置 `ConfigProvider locale={undefined}`。ConfigProvider 字段缺失会继承，不等同于清空；根层未传 locale 仍有中文默认值。参见[ConfigProvider](../components/configProvider.md)与[上下文指南](./context.md)。

Consumer 返回稳定的只读 Ref，读取 `locale.value` 保持动态更新。它不是 React Consumer 的四参数回调，slot 仅返回 Vapor 可渲染块，不直接返回字符串、null、undefined 或异步结果。

## fallback 与自定义文案

选中包的 code 缺失或为空会整包回中文；有 code 时不深合并、不逐字段补中文。组件字段可能缺失；dateFnsLocale 仅对 undefined 回退中文，currency 不额外补齐。完整 Locale 是公共类型要求，自定义文案应从完整语言对象复制相关组件字段，不应依赖运行时补全。外部载入的数据先做校验；库没有公共异步语言 loader，过期请求失效由应用自己的加载流程负责。

Locale 不自动设置 `lang`、RTL、时区、货币格式或 aria-label。应用应为实际页面语言和辅助技术提供合适的原生属性；需要方向上下文时使用 ConfigProvider direction。

## 日期语言与时区的边界

<ClientOnly><VaporDemo example="locale/DateBoundary.vapor" /></ClientOnly>

日期语言数据使用固定 `date-fns@2.30.0`；调用方需要显式传给格式化函数。这里用本地日历日期显示月份名，语言切换只改变文案。ConfigProvider 的 timeZone 保留调用方配置，包括数字 0，不对 date-fns 或 JavaScript Date 安装全局时区行为。

Intl 一段为同一个 UTC 时间点分别显式指定 `UTC` 和 `Asia/Shanghai`；此调用与 ConfigProvider 的数字偏移配置没有自动映射。字符串时区、数值偏移和现有日期设施的能力边界应在具体日期 API 接入时分别验证，不能从此示例推导 DatePicker、TimePicker、夏令时转换或所有日期 API 已支持。

## 资源、运行环境与维护

所有生成语言包保留固定上游文案、占位符、dateFnsLocale 和许可；通过生成器更新并检查来源和完整性。语言数据是 Node 安全的静态子路径；Provider/Consumer 是浏览器组件，不承诺组件 SSR、水合或 CJS。文档使用 ClientOnly 挂载；包仍 private，未来发布统一使用 `@raitosora` scope。

变更组件 API、字典来源或真实示例时，同时更新中文组件页、类型正反用例、浏览器行为和真实 tarball 消费检查。参见[资源指南](./resources.md)、[兼容边界](./compatibility.md)和[完成度矩阵](./upstream-matrix.md)。
