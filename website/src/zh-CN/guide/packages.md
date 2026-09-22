# 本地产物与消费方式

Semi Design Vue 尚未发布可安装版本，六个包均保持 private。当前本地包名没有 scope；未来发布统一使用 `@raitosora`。Vapor 是编译和运行模式，不是另一个项目名。

## 产物入口

| 本地包                   | 已有入口与内容                                                                                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `semi-ui-vue`            | 浏览器 / 默认条件的根入口含 Spin、Icon、ConfigProvider / ConfigConsumer、LocaleProvider / LocaleConsumer、状态、Foundation 桥接、context、DOM、浮层、虚拟列表与 pointer 工具；`spin`、`icons`、`configProvider`、`locale`、`locale/source/<名称>`、`locale/interface`；已登记的 CSS / SCSS |
| `semi-animation-vue`     | 动画工具根入口与 `lifecycle` 共享资源子入口                                                                                                                                                                                                                                                |
| `semi-icons-vue`         | 根具名 SVG 导出与图标名称子路径；`Icon` 子路径与根入口的 `convertIcon`                                                                                                                                                                                                                     |
| `semi-icons-lab-vue`     | 根具名导出与实验图标名称子路径                                                                                                                                                                                                                                                             |
| `semi-illustrations-vue` | 根具名导出与插画名称子路径                                                                                                                                                                                                                                                                 |
| `vite-plugin-semi-theme` | Vite 主题插件根入口                                                                                                                                                                                                                                                                        |

JavaScript 为预编译 ESM，声明为 `.d.ts`，附带 source map 和随包可读取的源快照。消费者不需要再次编译库内部 TSX。没有 CJS / `require` 入口，也不承诺组件 SSR 或水合。

`semi-ui-vue` 根入口按条件导出：浏览器和默认条件提供 `Spin`、`Icon`、`ConfigProvider`、`ConfigConsumer`、`LocaleProvider`、`LocaleConsumer`；纯 Node 导入条件只提供原有的静态工具，不提供这些浏览器组件。对应条件的 `.d.ts` 也保持一致。浏览器应用以 TypeScript 的 `moduleResolution: "Bundler"` 使用组件；NodeNext 消费者仅可依赖已验证的静态工具，不应把该检查当作 浏览器组件的 Node、SSR 或 CJS 支持。`semi-icons-vue` 根入口和 `semi-icons-vue/Icon` 仍是浏览器 Vapor 编译/运行路径。

资源名称见[资源索引](./resource-index.md)，样式入口见[安装与样式](./styles.md)。这些入口不表示完整的 Input、Tooltip 或其他公共组件已交付；Icon 的范围见[图标页面](../components/icons.md)。

## 依赖与构建

当前浏览器包要求精确的 `vue@3.6.0-rc.9`。UI 包通过正式依赖声明使用 `semi-animation-vue` 和 `date-fns@2.30.0`；主题插件要求 `vite@8.3.0`。应用自己编写 Vapor TSX 时使用 `vue-jsx@3.3.0-rc.2`，配置见[编写示例](./authoring.md)。

当前六包的编译辅助代码已内联，产物没有需要消费者另装的 `vue-jsx` / `@vue-jsx/runtime` 外部运行时导入。内联代码保留 MIT 许可；不能由应用的编译依赖推断库的 peer 依赖。后续产物若出现新的外部导入，必须同步包清单并重新验收。

锁定的 `vue-jsx@3.3.0-rc.2` 将 Vue peer 声明为 `^3`，严格 npm 安装会拒绝 `vue@3.6.0-rc.9` 这个预发布版本。当前隔离消费者使用预编译的应用 JS 与库 ESM，不安装应用编译器。这证明预编译消费路径可行，不代表独立应用的 TSX 编译工具链已经可以无配置地严格安装；不建议用强制安装或依赖覆盖隐藏这一限制。

Foundation `2.103.0` 是固定的构建输入。当前 UI 样式产物携带必要的 Foundation / Theme SCSS、来源和许可；六包尚未包含具体组件的 Foundation 状态机。消费者无需安装官方 Foundation 或应用仓库补丁。构建验证还单独打包现有状态机夹具，检查补丁代码及 es-toolkit 内联后的隔离消费；夹具不是公共入口。

## 本地检查

在仓库安装锁定开发依赖后执行：

```sh
pnpm check:packages
```

此命令构建六包并检查真实 tarball。测试在仓库外的临时目录安装，使用独立配置和工具，按实际包间依赖解析，不继承源码 alias、workspace 链接、patch 或 override。它覆盖普通严格 TypeScript、声明子路径、ESM、生产构建、样式主题、资源及真实浏览器；纯 Vapor 与普通 Vue interop 分别构建和验证。

纯 Vapor 使用 `createVaporApp`。普通 Vue 应用消费这些 Vapor 产物时，按[兼容边界](./compatibility.md)安装 `vaporInteropPlugin`；interop 的结果不代表纯 Vapor 运行。

CSS / SCSS 保留副作用声明，JavaScript 不自动加载全部样式。请显式导入需要的[样式](./styles.md)或[主题](./theme.md)。按名称导入资源和语言数据可避免携带未使用的资源。

严格声明检查保留 `skipLibCheck: false`。额外的 `exactOptionalPropertyTypes` 调用点检查不代表 Vue RC 依赖声明完全支持该选项。浏览器 Bundler 类型和基础 NodeNext 工具消费者均有独立验证；浏览器、ref / slots、SSR 与视觉范围继续以[兼容边界](./compatibility.md)为准。

`semi-ui-vue/configProvider` 提供默认与具名 ConfigProvider、具名 ConfigConsumer、useConfigContext、defaultResponsiveMap 及对应类型，与浏览器根的组件身份相同。其原生 scoped slot 与 React Consumer 的差异、稳定包装和响应式清理见[组件页面](../components/configProvider.md)。

`semi-ui-vue/locale` 提供 LocaleProvider / LocaleConsumer 及语言消费类型与 hook；与浏览器根入口同一组件身份。`locale/source/*` 与 `locale/interface` 仍为独立静态资源入口，可在 Node 使用，不依赖组件运行时。组件的 fallback 与只读 Ref slot 见[Locale API](../components/locale.md)，日期格式化与时区边界见[国际化指南](./internationalization.md)。

`semi-ui-vue/spin` 提供默认与具名 Spin、SpinProps、SpinSize 与 SpinSlots，和浏览器根组件身份一致。只在浏览器 Vapor 运行时使用；Node 根类型及 ESM 具名导入均拒绝 Spin。加载图案使用固定上游 SVG 与 SCSS，延迟状态复用既有生命周期资源，不引入官方 Spin Foundation 的重复计时器。样式显式加载 `semi-ui-vue/styles/base.css` 与 `semi-ui-vue/styles/components/spin.css`。原生 slot、首次延迟语义及清理差异见[Spin](../components/spin.md)。
