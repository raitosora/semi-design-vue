# Input 输入框

Input 接收单行文本，TextArea 提供多行输入、自动高度与行号，InputGroup 组合多个 Input。文本值由原生表单控件承载。

## 导入与样式

```tsx
import { Input, TextArea, InputGroup } from "semi-ui-vue";
import InputFromPath from "semi-ui-vue/input";
import TextAreaFromPath from "semi-ui-vue/input/textarea";
import InputGroupFromPath from "semi-ui-vue/input/inputGroup";
import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/input.css";
```

浏览器根提供三个具名组件，组件子路径提供对应默认入口和类型。没有 `Input.TextArea`、`Input.Group` 或其他静态子组件；不要依据其他组件库的命名推断入口。按需样式包含 Input、TextArea、InputGroup 与组标签所需规则，也可使用完整 `semi-ui-vue/styles.css`。组件采用原生 Vapor TSX，普通 Vue 宿主需要已有的互操作配置，详见[安装指南](../guide/start.md)。

## 输入、标签与原生表单

<ClientOnly><VaporDemo example="input/Basic.vapor" /></ClientOnly>

`id`、`name`、`required`、`autocomplete`、`inputmode`、ARIA、data 属性和安全原生事件转发到实际 input/textarea；`class`、`className`、`style` 作用于外层，内部样式分别使用 `inputStyle`、`textareaStyle`。不接受 `innerHTML`、`textContent` 来覆盖组件内容。

原生小写 `maxlength` / `minlength` 映射到同一长度约束：实例显式提供 `maxLength` / `minLength` 键时（包括值为 undefined）优先使用驼峰字段，否则使用小写字段；两者不会同时生效。Input 的实例小写字段也优先于全局默认配置。TextArea 的 maxLength 可动态更新，minLength 保留初始化快照；getValueLength 生效时仍移除原生 maxlength，按组件算法处理。

独立输入通过原生 `label for` 与控件 `id` 关联，或显式提供 `aria-label` / `aria-labelledby`。`insetLabelId` 只给前缀区域设置 id，不自动设置控件的 `aria-labelledby`。Input 在 `validateStatus="error"` 时强制 `aria-invalid="true"`；TextArea 的相同状态仅改变外观，ARIA 由调用方设置。`required` 标签标记与原生输入的 `required` 约束是不同能力。

密码模式仅支持 `mode="password"`。眼睛按钮有原生焦点、button role 和 `Show password` / `Hidden password` 名称，Enter 与空格激活；普通输入保留 Tab、选择、复制、原生表单提交等浏览器行为，不增加方向键协议。

## 受控值与 v-model

`value` 的**键存在性**决定是否受控，显式 `value={undefined}` 仍为受控；省略 `value` 才使用首次 `defaultValue`。`defaultValue` 后续变化不重置当前输入。`null` / `undefined` 在 DOM 上显示空字符串；0 显示 `0`，不会因 falsy 而被当作缺失值。

每次变化先通知 `update:value`，再调用 `onChange(value, event)`。使用 `value` + `onUpdate:value`，或编译器的命名 `v-model:value`；没有 `modelValue` / `update:modelValue` 别名。不需要双向绑定时，只监听 onChange 并决定是否更新 value。程序化更新不会伪造用户输入事件。

```tsx
const value = ref("");
// 等价于命名 v-model:value：value 与 update:value 成对使用。
<Input
  value={value.value}
  onUpdate:value={(next) => {
    value.value = next;
  }}
/>;
```

固定上游缓存最后一次 props.value：仅当新 value 与缓存严格不等时同步本地值。动态移除一个已定义 value 会按 undefined 变化清空，不恢复旧 defaultValue；若旧值本来就是 undefined，移除键仅切换控制模式。组合输入中的临时文本也遵循这一缓存规则。普通受控输入在父级拒绝更新时恢复当前状态；值未改变时避免无必要地重写原生选区。异常运行时值不属于公开类型支持承诺，尤其 TextArea 行号需要字符串，不能把任意对象视作安全文本输入。

## 输入法与事件顺序

<ClientOnly><VaporDemo example="input/Composition.vapor" /></ClientOnly>

`composition` 默认 false。开启时，组合期间保留原生文字与内部临时值，但不通知 change；compositionEnd 先调用用户的结束回调，再通知一次 update:value / change。关闭时，组合期间仍通知 change，组合结束可能因自定义长度截断追加一次通知。原生 input 事件仍独立通知 onInput。

Vue 中的产品 onChange 在原生 input 事件上处理，不等待失焦产生的原生 change；回调使用原生 Event，而非 React SyntheticEvent。自动化使用真实浏览器的 CompositionEvent/InputEvent 派发和 Chromium IME 协议检查时序；协议候选文本产生可信 input，但协议提交的 compositionend 不保证 isTrusted。该范围不代表全部操作系统输入法或真实移动设备。

| 事件                              | 参数与顺序                                                 |
| --------------------------------- | ---------------------------------------------------------- |
| onChange                          | `(value: string, event: Event) => void`；update:value 之后 |
| onUpdate:value                    | `(value: string) => void`；用于命名双向绑定                |
| onInput                           | 原生输入事件；不等同于 change 通知                         |
| onFocus / onBlur                  | 原生焦点事件；TextArea 的清空路径还可能传 MouseEvent       |
| onKeyDown / onKeyUp / onKeyPress  | 原生 KeyboardEvent，保留 preventDefault 与冒泡             |
| Input.onEnterPress                | keypress 为 Enter 时，在用户 onKeyPress 后通知             |
| TextArea.onEnterPress             | keydown 的 keyCode 为 13 时，在用户 onKeyDown 后通知       |
| onCompositionStart / Update / End | 原生 CompositionEvent；结束先通知 end 后 change            |
| onClear                           | 清空事件；见下方两组件区别                                 |

Input 清空由 **mousedown** 触发：非受控时清空状态，通知 update:value / change，再通知 clear，最后停止该事件冒泡；事件带有固定上游的 `__fromClearBtn` 标记。它不主动 preventDefault 或恢复焦点，也不额外调用 onBlur。readonly 不阻止 Input 清空。

TextArea 清空由 **click** 触发，readonly 会隐藏清空按钮。若当时内部仍为 focus，先用该点击事件通知 onBlur，再通知 update:value / change / clear，最后停止冒泡。真实鼠标操作的 mousedown 也可能先引发原生 blur，因此不要假设所有清空操作都有完全相同的 blur 数量。TextArea blur 在 maxLength 生效时还会再次检查截断。

## TextArea 尺寸、计数与行号

<ClientOnly><VaporDemo example="input/TextArea.vapor" /></ClientOnly>

autosize 只自动改变高度。true 使用 rows 作为最小行数；对象允许 minRows / maxRows。其测量考虑当前字体、padding、边框、宽度与 value / placeholder，隐藏后显示和容器变化会重新测量。autosize 使 resize 为 none；其他情况下 resize 仅在显式传入时覆盖 textareaStyle.resize。

`onResize({ height })` 表示自动高度变化；启用原生缩放时变化通知额外包含 width，初次观察只记住尺寸，不通知。回调不是每次输入必然触发。行号使用 canvas 字体宽度估算软换行，不能保证与所有字体、混合文字和浏览器的逐字换行完全一致；逻辑换行按 `\n` 分割。滚动同步行号面板，用户 onScroll 被固定上游的内部处理覆盖，不作为公开通知能力宣传。

maxCount 仅显示计数、总数与超出样式，**不截断输入**。要限制原生输入长度使用 maxLength；传入 getValueLength 时改由组件的固定截断算法处理，不给原生控件透传 maxLength。算法按 UTF-16 位置搜索，计数含义由回调决定，不自动引入分字库。showCounter 只显示当前计数；保留固定上游的超出样式判断。

## 组合与原生内容所有权

<ClientOnly><VaporDemo example="input/Group.vapor" /></ClientOnly>

InputGroup 通过最近的内部上下文向接入的 Input 提供 size、disabled、focus / blur 回调。组 size 覆盖成员 size；成员显式 boolean disabled 优先于组设置；成员有效 focus / blur 回调优先组回退。组 disabled=true 时仍保留上游的 aria-disabled=true：即使成员显式 disabled=false 允许原生编辑，辅助技术仍可能按祖先组解释禁用状态，建议避免这种矛盾配置。原生 focusin / focusout 仍会冒泡到组，回退回调可能和组回调各通知一次，不能将其误写为自动去重。

Input 的根节点直接位于最近组容器时接收组设置；直接 TextArea 也继承 disabled、focus / blur，但没有 size 公共 API，不注入无效的 size 属性。包在额外 div 中的控件不继承组设置。嵌套组隔离外层设置，保留调用方的 fragment、多根、条件内容与 For 稳定 key。不枚举、预执行或克隆 slot 内容，未知包装元素不会被隐式改写；不提前提供 InputNumber、Select、日期选择器等组件。

Input 的 addonBefore / addonAfter / prefix / suffix / insetLabel / clearIcon 支持同名原生 slot，slot 声明优先对应属性。声明为空仍是已提供内容，移除声明才恢复属性。TextArea 没有内容 slot。InputGroup.default 优先 children。普通内容属性接受标量或同步原生 renderer；不要传 React 节点、异步 renderer 或强制字符串化富内容。稳定更新保留 DOM、局部状态与焦点，真实 DOM 重排不承诺保留焦点；卸载重挂创建新实例。

图标间距根据已经挂载的直接 DOM 分类：忽略注释和空文本后，唯一根为带内部标记的 Icon 或原生 SVG 时使用 icon 类，支持自定义 Icon 前缀。多根、混合非空文本和额外非 Icon 包装不自动判为图标；fragment 中的唯一 Icon 可以识别。该适配不检查 React 元素类型、不预执行 slot，动态内容由 DOM 观察更新。标量字符串属性使用 text 类，slot 中的富文本不等同于字符串属性。

InputGroup 只有 label.text 为 truthy 时才呈现组标签布局。label.name 指向组 span 的 id，不是可被 HTML label 激活的输入，因此它不能代替每个 input 的 for/id 或 aria-label；也不要给组与输入设置重复 id。required 只是标签标记，optional 从当前 Form locale 字典取文本；不会隐式设置输入 required / aria-required。内部 Label 只供必要协作，不提供公开 Form.Label。

## 主题与布局

<ClientOnly><VaporDemo example="input/Theme.vapor" /></ClientOnly>

深浅色复用既有 CSS tokens，局部 ConfigProvider 提供 RTL；不会修改 body.dir。前后缀与密码按钮按固定样式布局，窄容器中的单行长文字使用原生水平滚动，多行长内容按 textarea 自身规则换行。组件不自动切换 size 或布局，也不保证任意调用方样式下无溢出。

## Input API

| 属性                      | 类型                                   | 默认值 / 说明                                              |
| ------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| value / defaultValue      | string \| number                       | 受控值 / 首次默认值                                        |
| size                      | small \| default \| large              | default                                                    |
| type / mode               | string / password                      | type=text；mode 未设置                                     |
| disabled / readonly       | boolean                                | 禁用 / 只读                                                |
| showClear / hideSuffix    | boolean                                | false；有内容且 focus/hover 时可清空，清空显示时可隐藏后缀 |
| prefix / suffix           | InputContent                           | 前后缀；prefix truthy 优先 insetLabel                      |
| addonBefore / addonAfter  | InputContent                           | 外侧前后标签                                               |
| insetLabel / insetLabelId | InputContent / string                  | 内嵌标签及前缀容器 id                                      |
| clearIcon                 | InputContent                           | 自定义清空图标；falsy 回退默认图标                         |
| placeholder               | string \| number                       | 空文本                                                     |
| validateStatus            | default \| error \| warning \| success | default；success 不增加特殊样式                            |
| borderless / onlyBorder   | boolean / number                       | 无边框 / 边框宽度，style 可覆盖                            |
| style / inputStyle        | CSSProperties                          | 外层 / 原生 input 样式                                     |
| class / className         | Vue class / string                     | 外层类名                                                   |
| autoFocus / preventScroll | boolean                                | 挂载聚焦 / 聚焦时是否阻止滚动                              |
| composition               | boolean                                | false                                                      |
| maxLength / minLength     | number                                 | 原生长度约束；自定义长度时按上述规则适配                   |
| getValueLength            | (value: string) => number              | 自定义长度函数，直接读取其返回值                           |
| forwardRef                | Ref 或节点回调                         | 原生 HTMLInputElement；卸载清空                            |

showClearIgnoreDisabled 为固定上游内部协作字段，不代表新增日期组件。其他安全原生 input 属性沿用浏览器语义；readonly 小写覆盖 readOnly。

Input 在实例创建时读取 `semiGlobal` 的 Input 默认配置，显式属性优先；已创建实例不会因之后修改全局默认配置而自动更新。TextArea 与 InputGroup 使用各自静态默认值，不提供同名全局默认配置能力。

## TextArea API

| 属性                                  | 类型                                                      | 默认值 / 说明                      |
| ------------------------------------- | --------------------------------------------------------- | ---------------------------------- |
| value / defaultValue                  | string                                                    | 受控值 / 首次默认值                |
| rows / cols                           | number                                                    | 4 / 20，按源码默认值               |
| autosize                              | boolean \| { minRows?: number; maxRows?: number }         | false                              |
| resize                                | none \| both \| horizontal \| vertical \| block \| inline | 未传不干预；autosize 优先          |
| textareaStyle / style                 | CSSProperties                                             | textarea / 外层样式                |
| showLineNumber / lineNumberStart      | boolean / number                                          | false / 1                          |
| lineNumberClassName / lineNumberStyle | string / CSSProperties                                    | 行号区域；实测高度覆盖相应高度样式 |
| showCounter / maxCount                | boolean / number                                          | false / 未设置；统计而不截断       |
| showClear / disabled / readonly       | boolean                                                   | 清空 / 禁用 / 只读                 |
| composition / getValueLength          | boolean / 长度函数                                        | 与前述组合和长度规则一致           |
| maxLength / minLength                 | number                                                    | 长度约束                           |
| validateStatus / borderless           | 状态联合 / boolean                                        | 外观，不自动补 aria-invalid        |
| class / className / placeholder       | Vue class / string / string                               | 外层类名 / 原生占位                |
| autoFocus                             | boolean                                                   | 挂载时聚焦                         |
| forwardRef                            | Ref 或节点回调                                            | 原生 HTMLTextAreaElement；卸载清空 |
| onResize                              | ({ height: number; width?: number }) => void              | 尺寸变化通知                       |

事件见共用表。固定类型中 onPressEnter 不被实现调用，不要用于回车监听，使用 onEnterPress。disabledEnterStartNewLine 是内部 Enter 行为开关；普通应用可像示例一样通过 onKeyDown.preventDefault 显式控制原生换行。

## InputGroup 与标签 API

| 属性                      | 类型                               | 默认值 / 说明              |
| ------------------------- | ---------------------------------- | -------------------------- |
| size                      | small \| default \| large          | default，覆盖成员尺寸      |
| disabled                  | boolean                            | 成员的显式 boolean 优先    |
| onFocus / onBlur          | (event: FocusEvent) => void        | 成员回退及原生冒泡         |
| class / className / style | Vue class / string / CSSProperties | 组样式                     |
| label                     | InputGroupLabelProps               | text truthy 时显示标签布局 |
| labelPosition             | string                             | top / left 产生对应布局类  |
| children / default slot   | 同步内容 / 原生 slot               | slot 声明优先              |

label 对象包含 text、children、extra 内容，name（映射 label.for）、id、align（left / right）、width、style、className、disabled、required、optional。text !== undefined 优先 children；extra truthy 才显示；width truthy 覆盖 style.width，处理时不会修改调用方 style 对象。labelPosition 属于 InputGroup，不是 Label 对象字段。

## ref 与验证边界

`forwardRef` 接收 Vue Ref 或 `(element | null) => void`。通过原生节点执行 focus、blur、select、setSelectionRange、scrollTop 等操作；组件 ref 不伪装为原生元素，不公开 `$el`、Foundation 或 React 内部方法。普通 Ref 赋值与成员消费有严格类型约束，锁定 JSX 编译器对 ref 属性形状的已知限制仍见[兼容边界](../guide/compatibility.md)。

文档示例由 `website/examples/input` 的实际源码预编译；对应交互覆盖开发/生产文档页面与独立 Vapor harness。浅色、深色、RTL、窄屏截图只表示代表性场景，不声明完整像素一致。浏览器 ESM、纯 Vapor 与普通 Vue 互操作分别验证；不声明 SSR、水合、CJS、Firefox/WebKit 或全部真实设备能力。来源固定为 Semi 2.103.0，范围见[完成度矩阵](../guide/upstream-matrix.md)。
