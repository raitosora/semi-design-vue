# Popover 气泡卡片

Popover 在目标附近展示补充信息或轻量操作。内容中的标题、正文和底部操作使用原生 HTML 或已交付组件组合；Popover 没有 `title`、`footer` 属性，也不提供确认、取消或异步提交状态机。

## 导入与样式

```tsx
import { Popover } from "semi-ui-vue";
import PopoverFromPath from "semi-ui-vue/popover";
import type {
  PopoverProps,
  PopoverSlots,
  PopoverInstance,
} from "semi-ui-vue/popover";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/popover.css";
```

浏览器根提供 `Popover` 值，以及 `PopoverProps`、`PopoverSlots`、`PopoverInstance`、`PopoverState`、`PopoverTriggerScope`、`PopoverTriggerProps`、`ArrowProps` 七个类型。`semi-ui-vue/popover` 提供默认/具名组件与上述类型，并额外提供 `Position`、`Trigger`、`ArrowBounding`、`RenderContent`、`RenderContentProps`。PopoverState 只映射上游历史 `{readonly popConfirmVisible:boolean}` 形状，不是可读写的运行时组件状态；ArrowProps 是类型映射，不是公开 Arrow 组件；arrowStyle 的结构通过 `PopoverProps["arrowStyle"]` 消费，ArrowStyle 不是单独具名导出。完整样式可使用 `semi-ui-vue/styles.css`。没有静态子组件。Node 根条件仅提供基础设施，不提供公共组件；ESM、严格声明及运行时边界见[本地产物与消费](../guide/packages.md)。

Popover 自动申请浮层 ID，需要祖先在 setup 中提供明确的应用级 ARIA scope。一个应用使用唯一且稳定的 prefix；独立客户端示例使用 `crypto.randomUUID()` 区分实例，不构成 SSR ID 复用方案。Popover 不提供 wrapperId 属性。

```tsx
import { defineVaporComponent } from "vue";
import { Popover, provideAriaIdScope } from "semi-ui-vue";

export default defineVaporComponent(() => {
  provideAriaIdScope(`my-app-${crypto.randomUUID()}`);
  return (
    <Popover content="应用说明">
      {(scope) => (
        <button
          {...scope.attrs}
          {...scope.triggerProps}
          ref={scope.triggerRef}
          type="button"
        >
          查看说明
        </button>
      )}
    </Popover>
  );
});
```

应用级 `app.provide(ariaIdScopeKey, createAriaIdScope(prefix))` 也可使用，完整协议见 [DOM 与 ARIA ID](../guide/dom.md)。

## 原生目标与定位

<ClientOnly><VaporDemo example="popover/Basic.vapor" /></ClientOnly>

默认 `hover`、`bottom`、无箭头；进入/离开延迟继承 Tooltip 的 50ms。默认关闭 hover 的 focus/blur 监听，因此仅聚焦目标不会显示；需要键盘聚焦打开时使用 `trigger="focus"` 或显式 `disableFocusListener={false}`。目标仍需要可见文字或无障碍名称。

Popover 不自动包裹或检查 children。default slot 将 `scope.triggerRef` 与 `scope.triggerProps` 显式绑定同一原生 HTML 目标；调用方额外 attrs 通过 `scope.attrs` 放在选定目标上。多根使用 `scope.getTriggerRef(key)`，每个 key 独立且稳定。所有 refs 限于创建组件的当前 document/realm 的 HTMLElement/null；JSX 的 `Element | null` callback 签名不承诺 SVG、MathML、组件实例或跨 realm 支持。禁用原生按钮可由显式 HTML 外层接收事件。

```tsx
<Popover content="补充信息">
  {(scope) => (
    <button
      {...scope.attrs}
      {...scope.triggerProps}
      ref={scope.triggerRef}
      type="button"
    >
      查看信息
    </button>
  )}
</Popover>
```

业务事件须与 `triggerProps` 的内部事件明确组合；后面的 spread 或 `onClick` 不应覆盖内部处理。可以依次调用 `scope.triggerProps.onClick?.(event)` 与业务函数。`scope.attrs` 中同名监听也由调用方组合。原生事件共同字段类型与 [Tooltip 触发协议](./tooltip.md#原生目标与全部定位)一致；组件 `onClickOutSide`/`onEscKeyDown` 则保留完整原生 PointerEvent/KeyboardEvent 类型。

十六种物理位置与 Tooltip 相同，RTL 不把 left/right 自动改名。最终方向可由溢出调整改变，通过实际弹层的 `x-placement` 检查。无箭头默认 spacing=4，有箭头 spacing=10；显式 spacing=0 保留零间距。`margin` 参与可用边界计算，与 `style.margin` 分开。内容尺寸、滚动、resize 和 `rePosKey` 更新触发定位重算。基础例子在同一位置阵列中切换无箭头/有箭头与 arrowPointAtCenter，避免将“显示箭头”与“箭头居中”混为同一能力。

## 五种触发与可见性

<ClientOnly><VaporDemo example="popover/Triggers.vapor" /></ClientOnly>

- hover：鼠标进入/离开；默认不监听焦点。
- focus：焦点进入/离开；与 hover 的 `disableFocusListener` 分开。此失焦关闭示例显式设置 `guardFocus={false}`，允许焦点移到外部。默认 `guardFocus=true` 使用共享浮层焦点圈定，尝试将焦点移到外部时会恢复到浮层内部；下方结构内容示例保留默认值并验证该行为。
- click：点击打开，外部指针关闭；弹层 role=dialog。
- contextMenu：右键打开并阻止该次原生菜单；role=tooltip。
- custom：只由 `visible` 驱动；role=dialog。点击目标、外部或 Escape 通知不直接改变父级状态，示例在通知中显式更新 visible。

`visible` 无默认值，也没有 `defaultVisible`。非 custom 的 `visible=false` 不拒绝所有内部触发；完全由父级控制时使用 custom。显式 undefined/缺失不构成 custom 的 true。切换到 custom 按当前 visible 同步，离开 custom 继续内部状态及后续触发。`v-model:visible` 使用 visible 与 `onUpdate:visible`，不使用 modelValue。

`onVisibleChange` 与 `onUpdate:visible` 是通知，不使用返回值决定状态。true 在定位后通知，false 在请求关闭时通知；退出动画仍可能保留 DOM。`condition=false` 只阻止新的自动显示，不主动关已开弹层，也不阻止 custom/显式 visible 更新；已经排队的进入延迟沿用 Tooltip 行为。延迟任务在取消、模式切换和卸载时失效。

## 结构内容、焦点与容器

<ClientOnly><VaporDemo example="popover/Advanced.vapor" /></ClientOnly>

`content` 接受同步 primitive（string/number/boolean/null/undefined）或返回这些值的函数。函数参数是 `{ initialFocusRef }`；DOM、React 节点、Vapor JSX 对象和 Promise 不属于返回值范围。复杂结构用 owned `content` slot，slot 优先于 content callback，不执行被替代的 callback。slot 中的动态字段应访问 `scope` 属性，避免解构造成首次值快照。

```tsx
<Popover trigger="click">
  {{
    default: (scope) => (
      <button
        {...scope.attrs}
        {...scope.triggerProps}
        ref={scope.triggerRef}
        type="button"
      >
        打开操作
      </button>
    ),
    content: (scope) => (
      <section>
        <h4>操作说明</h4>
        <p>这里是业务内容。</p>
        <footer>
          <button ref={scope.initialFocusRef} type="button">
            第一项操作
          </button>
        </footer>
      </section>
    ),
  }}
</Popover>
```

initialFocusRef 绑定当前 document/realm 内的可聚焦 HTMLElement；并非任意 HTML 节点都能取得焦点。默认 `guardFocus=true` 使用 G11 共享浮层：约束 Tab/Shift+Tab，并把程序式移到外部的焦点恢复到当前浮层；固定上游 Foundation 只处理 Tab 圈定。`closeOnEsc=true` 由顶层浮层仲裁，`returnFocusOnClose=true` 尝试回到仍连接且可用的触发目标；preventDefault 的 Escape 保持打开。嵌套仅关闭顶层，销毁非顶层不会抢走其他浮层焦点。焦点/ShadowRoot/slot 的支持范围见[浮层工具](../guide/overlay.md)；不推断 closed tree 内部路径。

启用 guardFocus 时，内容失焦会等待一个微任务确认共享浮层的焦点恢复结果；焦点仍在当前浮层或触发目标内便保持打开，避免 mouseLeaveDelay=0 时先同步关闭、再被圈定回焦的竞态。已卸载或浮层已失效时不执行旧失焦操作。guardFocus=false 仍保留零延迟的同步失焦关闭。该时序分别有默认延迟与零延迟的真实回归验证。

`focusTrigger()` 遵循非 custom 且 `returnFocusOnClose=true` 的回焦规则；符合条件时，即使浮层已打开且 guardFocus 开启，也可将焦点移回当前可用的原生触发器，不需要先关闭浮层。显式命令只暂挂自身浮层的焦点圈定，在该原生触发器保持焦点期间保留这一例外；同一目标与浮层的 content 或 rePosKey 更新不会取消它。焦点离开触发器、trigger/guardFocus/returnFocusOnClose 变化、目标实际移除、浮层替换或失效、关闭或卸载都会结束例外，仍活动的自身浮层恢复当前有效的焦点圈定设置。它不能越过更高的嵌套浮层夺焦；disabled、不可聚焦或已断开的目标仍受真实原生能力限制。custom 或 returnFocusOnClose=false 时不执行回焦。

容器优先级是显式 `getPopupContainer`、当前 Semi context 容器、当前 document.body。同 document 的容器变化迁移同一 popup 和内容节点；页面例子检查展开后状态与焦点。跨 document 容器和目标拒绝，已有资源先释放再报告错误。`focusTrigger()` 是唯一公开实例方法，无 show/hide/rePosition/getPopupId；目标 `data-popupid` 与原生 ARIA 提供弹层关系。

`keepDOM=true` 关闭后保留隐藏内容；隐藏时移出可交互/ARIA范围并让出物理层优先级。退出期间 DOM 与层保留至动画结束，快速重开取消旧退出；卸载立即释放 Foundation 延迟、观察器、监听和动画资源。`afterClose` 在关闭结束通知，不把取消中的旧动画当关闭完成。

## 明暗、RTL、窄屏与溢出

<ClientOnly><VaporDemo example="popover/Theme.vapor" /></ClientOnly>

独立 Popover 样式还加载内部生成的最小 motion 规则：来自固定 Tooltip SCSS 的 zoomIn/zoomOut keyframes 和 `semi-tooltip-animation-show`/`semi-tooltip-animation-hide` 两个选择器，保留原动画变量；不加载 Tooltip 的完整视觉规则。该协作没有新增公开样式子路径或组件属性。主题从原生容器与 CSS tokens 继承；portal 挂到主题容器才能继承局部样式。`prefixCls` 改变类名，需要同步编译匹配的 SCSS 前缀。`contentClassName` 附加到内部卡片，`className`/Vue `class` 与 `style` 沿实际外层 Tooltip popup 生效；`arrowStyle` 控制箭头 borderColor/backgroundColor/borderOpacity，没有 arrow slot。示例内容的最大宽度属于业务样式，不把窄屏布局自动推断为任何内容都不会溢出。

## API

可选属性显式允许 undefined；默认值在实例建立时结合全局默认捕获，caller 属性优先。显式 undefined 和移除 caller 属性沿既有 Tooltip own-key/default 规则处理，后续更新不读取另一个应用的配置。`contentClassName` 数组包含条件类/嵌套值，其成员是 unknown，不代表任意对象可以作为 content。

| 属性                               | 类型                                 | 默认值                                  | 说明                                                                              |
| ---------------------------------- | ------------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------- |
| children（上游映射）               | public prop 为 never                 | 无                                      | 使用原生 default slot，不接受 React children 值                                   |
| autoAdjustOverflow                 | boolean                              | true                                    | 空间不足时调整位置                                                                |
| content                            | primitive 或同步函数                 | undefined                               | 结构内容使用 content slot                                                         |
| visible                            | boolean                              | 无                                      | custom 的请求可见性                                                               |
| position                           | Position                             | bottom                                  | 十六种物理位置                                                                    |
| motion                             | boolean                              | true                                    | CSS 进入/退出；保留取消与快速反转                                                 |
| margin                             | number 或四边对象                    | 0（Tooltip）                            | marginLeft/Top/Right/Bottom 边界                                                  |
| mouseEnterDelay                    | number                               | 50（Tooltip）                           | 进入延迟 ms                                                                       |
| mouseLeaveDelay                    | number                               | 50（Tooltip）                           | 离开延迟 ms                                                                       |
| trigger                            | hover/focus/click/custom/contextMenu | hover                                   | 触发模式                                                                          |
| contentClassName                   | string 或 readonly unknown[]         | 无                                      | 内部卡片附加类                                                                    |
| onVisibleChange                    | (visible:boolean)=>void              | 无                                      | 可见通知                                                                          |
| onUpdate:visible                   | (visible:boolean)=>void              | 无                                      | Vue 命名 model 通知                                                               |
| onClickOutSide                     | (event:PointerEvent)=>void           | 空函数                                  | 外部指针通知                                                                      |
| showArrow                          | boolean                              | false                                   | 显示专用 SVG 箭头                                                                 |
| spacing                            | number 或 {x:number,y:number}        | 4/10                                    | 无箭头/有箭头默认；nullish 恢复默认                                               |
| stopPropagation                    | boolean 或 string                    | 无                                      | true 或非空字符串阻止对应原生事件传播；空字符串/false 不阻止，不作为可见状态 veto |
| arrowStyle                         | PopoverProps["arrowStyle"]           | {}                                      | borderColor/backgroundColor/borderOpacity                                         |
| arrowBounding                      | ArrowBounding                        | {offsetX:0,offsetY:6,width:24,height:8} | offsetX/offsetY/width/height 参与几何                                             |
| arrowPointAtCenter                 | boolean                              | true（Tooltip）                         | 箭头指向目标中心                                                                  |
| prefixCls                          | string                               | semi-popover                            | 样式前缀                                                                          |
| rePosKey                           | string 或 number                     | 无                                      | 变化时重算位置                                                                    |
| getPopupContainer                  | ()=>HTMLElement                      | context/body                            | 当前 document 的挂载容器                                                          |
| zIndex                             | number                               | 1030                                    | 外层叠层                                                                          |
| closeOnEsc                         | boolean                              | true                                    | 顶层 Esc 请求关闭                                                                 |
| guardFocus                         | boolean                              | true                                    | Tab 与程序式外部焦点圈定                                                          |
| returnFocusOnClose                 | boolean                              | true                                    | 关闭后恢复可用目标焦点                                                            |
| onEscKeyDown                       | (event:KeyboardEvent)=>void          | 空函数                                  | Escape 通知，可 preventDefault                                                    |
| clickToHide                        | boolean                              | 无                                      | 点击 popup 请求关闭                                                               |
| disableFocusListener               | boolean                              | true                                    | 禁用 hover 的 focus/blur                                                          |
| afterClose                         | ()=>void                             | 无                                      | 退出完成通知                                                                      |
| keepDOM                            | boolean                              | false（Tooltip）                        | 隐藏后保留内容 DOM                                                                |
| condition                          | boolean                              | true（Tooltip）                         | 自动触发的显示条件                                                                |
| className                          | string                               | 无                                      | BaseProps 外层类                                                                  |
| class                              | Vue HTMLAttributes class             | 无                                      | Vue 类别名                                                                        |
| style                              | Vue CSSProperties                    | 无                                      | 外层样式与箭头颜色输入                                                            |
| data-_ / aria-_ 与运行时其他 attrs | 目标 attrs（类型遵循实际声明）       | 无                                      | 通过scope.attrs由调用方绑定目标，非自动popup attrs                                |

`PopoverProps["arrowStyle"]` 的 borderColor/backgroundColor 为 string，borderOpacity 为 string|number。颜色字段仅在 undefined 或移除时回退到外层 style 的对应颜色（ArrowProps 中的 popStyle）；运行时显式 null 会清除对应箭头 path 的内联 fill，由 CSS 决定颜色，不回退到 popStyle。null 不扩展这两个公开 string 字段的类型。Position 与 Trigger 类型复用 Tooltip。上游 defaultProps 中的 cancelText/okText 不属于 PopoverProps，也未用于 Popover 渲染；本组件不新增这两个属性。没有 `disabled`、`title`、`footer`、`wrapperId`、`disableArrowKeyDown`、`clickTriggerToHide`、自定义 arrow slot 或通用 Tooltip 实例方法的公开承诺；需要结构/额外目标属性时用明确原生 slot。

| Slot / 实例    | 参数 / 返回值                            | 说明                                        |
| -------------- | ---------------------------------------- | ------------------------------------------- |
| default        | native trigger scope → VaporRenderResult | attrs/triggerProps/triggerRef/getTriggerRef |
| content        | {initialFocusRef} → VaporRenderResult    | 自有渲染所有权，覆盖 primitive content      |
| focusTrigger() | void                                     | 聚焦可用原生触发器                          |

## 验证与边界

真实示例分别由[文档浏览器测试](https://github.com/raitosora/semi-design-vue/blob/main/website/tests/popover.spec.ts)与[开发/生产 E2E](https://github.com/raitosora/semi-design-vue/blob/main/tests/e2e/popover.spec.ts)执行；源码类型和生成声明有正反例，独立 tarball 消费者分别验证纯 Vapor 与普通 Vue interop。它们覆盖已列的行为范围；截图与非零几何、交互及卸载断言分别检查，不表示完整像素一致。

浏览器组件不提供 SSR、水合或 CJS。Node 静态设施导入安全不构成组件 SSR。锁定 Vue 3.6.0-rc.9/vue-jsx3.3.0-rc.2 的独立 TSX 编译器严格安装 peer 约束、仅 Chromium、跨 realm、JSX ref 类型形状等边界见[兼容边界](../guide/compatibility.md)。纯说明用 [Tooltip](./tooltip.md)，轻量结构化操作用 Popover；两者可在明确的原生目标上组合，仍遵循顶层焦点/关闭仲裁。确认/取消及异步提交属于后续独立 Popconfirm 任务，当前没有公共 Popconfirm 页面或入口。本页面不接受尚未实现的 Popconfirm、Dropdown、Avatar、Modal 或其他公共族。
