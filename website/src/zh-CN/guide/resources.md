# 图标、插画与语言数据

资源来自 Semi Design `2.103.0` 的固定源码提交，生成浏览器原生 Vapor SVG 与独立语言模块。查看[资源索引](./resource-index.md)中的完整名称与来源。

## 使用示例

<ClientOnly><VaporDemo example="resources/Resources.vapor" /></ClientOnly>

同一个实验图标的两个实例各自持有 SVG 定义与引用。按钮演示动态尺寸、颜色和语言数据选择；语言选择仅影响这一段文字。

```tsx
import { IconHome } from "semi-icons-vue";
import IconDatePicker from "semi-icons-lab-vue/IconDatePicker";
import IllustrationNoContent from "semi-illustrations-vue/IllustrationNoContent";
import zhCN from "semi-ui-vue/locale/source/zh_CN";

<IconHome size={24} color="#1169aa" />;
<IconDatePicker size={40} />;
<IllustrationNoContent size={160} />;
const confirmText = zhCN.Modal.confirm;
```

当前包用于本地工作区且保持 private，尚未发布到 npm。未来发布统一使用 `@raitosora` scope。应用使用生成后的 ESM 与声明，无需编译库内部 TSX。

## 尺寸、颜色与 SVG 属性

资源组件直接输出 SVG。`size` 设置宽高；`color` 设置当前颜色，只有使用 `currentColor` 的单色图形随之改变，多色实验图标与插画保留原来的配色。`width` / `height`、`class`、`style` 和 SVG 属性用于具体调整。资源 SVG 自己的 `size` 协议独立于 [Icon 图标](../components/icons.md) 外层的具名 `IconSize`。

具名尺寸沿用图标基线：`extra-small` 8、`small` 12、`default` 16、`large` 20、`extra-large` 24；`inherit` 使用当前字体尺寸。插画默认尺寸沿用来源 SVG。

这些资源不包含通用 Icon 的自定义 SVG、spin、rotate 或外层 span 协议；需要这些能力时使用
[Icon 图标](../components/icons.md)。装饰图形不应重复朗读，具有含义的图形应提供适当的可访问名称。

## 按需导入

图标与插画同时提供根具名导出和名称子路径默认导出。生产构建可以移除未使用的资源；只需要单项时可直接使用名称子路径。语言数据按 `semi-ui-vue/locale/source/<名称>` 默认导入，不从 UI 根入口加载整套语言。

语言数据完整保留上游文案、占位符和 `dateFnsLocale`，后者使用声明的 `date-fns@2.30.0`。静态资源入口只提供数据，不设置全局语言或时区。组件树的语言选择与 fallback 使用 [LocaleProvider / LocaleConsumer](../components/locale.md)，完整规则见[国际化指南](./internationalization.md)。

## 来源与贡献

资源索引由固定输入清单生成，包含来源版本、提交、资源名和数量。每个包的产物携带来源清单及完整第三方许可。SVG 从固定上游图形提取，不携带 React 包装；语言对象保留其 date-fns 来源。

提交资源问题时，请包含资源包与导出名、预期和实际结果、Vue / 浏览器版本，以及可复现的最小用法。修正文案时注明语言名称、上下文和上游差异；修正 SVG 时保留 viewBox、渐变、clipPath 与原始许可。新增或更新资源需要同步固定来源、生成索引、类型和实际浏览器用例，不能仅手改生成文件。

## 验证范围

当前验证浏览器客户端的原生 Vapor、动态尺寸和颜色、多实例 SVG 引用隔离，以及独立消费者的声明、按需生产构建和运行。示例通过 ClientOnly 挂载；不承诺资源 SSR 或水合，也不依据截图宣称全部资源像素一致、跨浏览器或真实移动设备支持。详见[兼容边界](./compatibility.md)。
