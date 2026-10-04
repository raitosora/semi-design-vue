import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
const favicon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='7' fill='%23006'/%3E%3C/svg%3E";
export default defineConfig({
  lang: "zh-CN",
  title: "Semi Design Vue",
  description: "面向 Vue 的 Semi Design · 原生 Vapor 模式探索",
  srcDir: "src",
  cleanUrls: false,
  appearance: true,
  head: [
    [
      "link",
      {
        rel: "icon",
        href: favicon,
      },
    ],
  ],
  vite: {
    plugins: [
      {
        name: "semi-docs-dev-favicon",
        apply: "serve",
        transformIndexHtml() {
          return [
            {
              tag: "link",
              attrs: { rel: "icon", href: favicon },
              injectTo: "head",
            },
          ];
        },
      },
    ],
    publicDir: fileURLToPath(new URL("../.generated/public", import.meta.url)),
    resolve: { dedupe: ["vue", "@vue/shared", "@vue-jsx/runtime"] },
    server: { strictPort: true },
  },
  themeConfig: {
    nav: [
      { text: "指南", link: "/zh-CN/guide/start" },
      { text: "运行示例", link: "/zh-CN/guide/runtime" },
    ],
    sidebar: [
      {
        text: "开始使用",
        items: [
          { text: "项目介绍", link: "/zh-CN/guide/start" },
          { text: "本地产物与消费", link: "/zh-CN/guide/packages" },
          { text: "真实 Vapor 示例", link: "/zh-CN/guide/runtime" },
          { text: "API 与类型约定", link: "/zh-CN/guide/api-contracts" },
          { text: "Foundation 桥接", link: "/zh-CN/guide/foundation" },
          { text: "上下文与默认配置", link: "/zh-CN/guide/context" },
          { text: "DOM 与键盘交互", link: "/zh-CN/guide/dom" },
          { text: "浮层容器与触发器", link: "/zh-CN/guide/overlay" },
          { text: "动画与可见性", link: "/zh-CN/guide/animation" },
          {
            text: "虚拟滚动与指针交互",
            link: "/zh-CN/guide/virtualization-pointer",
          },
          { text: "安装与样式", link: "/zh-CN/guide/styles" },
          { text: "定制主题", link: "/zh-CN/guide/theme" },
          { text: "Icon 图标", link: "/zh-CN/components/icons" },
          {
            text: "ConfigProvider 全局配置",
            link: "/zh-CN/components/configProvider",
          },
          { text: "Locale 国际化", link: "/zh-CN/components/locale" },
          { text: "Spin 加载中", link: "/zh-CN/components/spin" },
          { text: "IconButton 图标按钮", link: "/zh-CN/components/iconButton" },
          { text: "Button 按钮", link: "/zh-CN/components/button" },
          { text: "Divider 分割线", link: "/zh-CN/components/divider" },
          { text: "Space 间距", link: "/zh-CN/components/space" },
          { text: "Grid 栅格", link: "/zh-CN/components/grid" },
          { text: "Layout 布局", link: "/zh-CN/components/layout" },
          { text: "Skeleton 骨架屏", link: "/zh-CN/components/skeleton" },
          { text: "Highlight 高亮文本", link: "/zh-CN/components/highlight" },
          { text: "Progress 进度条", link: "/zh-CN/components/progress" },
          { text: "Tooltip 文字提示", link: "/zh-CN/components/tooltip" },
          { text: "Popover 气泡卡片", link: "/zh-CN/components/popover" },
          { text: "Collapsible 折叠", link: "/zh-CN/components/collapsible" },
          {
            text: "OverflowList 溢出列表",
            link: "/zh-CN/components/overflowList",
          },
          { text: "Avatar 头像", link: "/zh-CN/components/avatar" },
          { text: "Tag 标签", link: "/zh-CN/components/tag" },
          { text: "国际化指南", link: "/zh-CN/guide/internationalization" },
          { text: "图标、插画与语言数据", link: "/zh-CN/guide/resources" },
          { text: "资源索引", link: "/zh-CN/guide/resource-index" },
          { text: "上游对齐与完成度", link: "/zh-CN/guide/upstream-matrix" },
          { text: "兼容边界", link: "/zh-CN/guide/compatibility" },
          { text: "文档编写模板", link: "/zh-CN/guide/authoring" },
        ],
      },
    ],
    outline: { label: "本页内容" },
    docFooter: { prev: "上一页", next: "下一页" },
    darkModeSwitchLabel: "外观",
    lightModeSwitchTitle: "切换浅色模式",
    darkModeSwitchTitle: "切换深色模式",
    mobileMenuLabel: "打开导航",
    sidebarMenuLabel: "目录",
    returnToTopLabel: "回到顶部",
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: "搜索文档", buttonAriaLabel: "搜索文档" },
              modal: {
                noResultsText: "没有找到结果",
                resetButtonTitle: "清空搜索",
                backButtonTitle: "返回",
                displayDetails: "显示详情",
                footer: {
                  selectText: "选择",
                  navigateText: "切换",
                  closeText: "关闭",
                },
              },
            },
          },
        },
      },
    },
    footer: {
      message: "面向 Vue 的组件库建设中 · 当前包均为 private",
      copyright: "Semi Design Vue",
    },
  },
});
