import { defineConfig } from "vitepress";
export default defineConfig({
  lang: "zh-CN",
  title: "Semi Design Vue",
  description: "面向 Vue 的 Semi Design · 原生 Vapor 模式探索",
  srcDir: "src",
  cleanUrls: false,
  appearance: true,
  vite: {
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
          { text: "真实 Vapor 示例", link: "/zh-CN/guide/runtime" },
          { text: "API 与类型约定", link: "/zh-CN/guide/api-contracts" },
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
