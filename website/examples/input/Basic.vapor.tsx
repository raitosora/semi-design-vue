import { defineVaporComponent, ref } from "vue";
import { Icon, Input } from "semi-ui-vue";
import { IconSearch } from "semi-icons-vue";

export default defineVaporComponent(() => {
  const value = ref("初始内容"),
    element = ref<HTMLInputElement | null>(null),
    events = ref<string[]>([]),
    submitted = ref(0);
  const record = (message: string) => {
    events.value = [...events.value, message];
  };
  return (
    <section data-input-basic="">
      <h3>受控输入、清空与原生标签</h3>
      <label for="input-example-name">用户名</label>
      <div onMousedown={() => record("mousedown-bubble")}>
        <Input
          forwardRef={element}
          id="input-example-name"
          onChange={(next) => record(`change:${next}`)}
          onClear={(event) => record(`clear:${event.type}`)}
          onInput={() => record("input")}
          onUpdate:value={(next) => {
            record(`update:${next}`);
            value.value = next;
          }}
          showClear
          value={value.value}
        />
      </div>
      <button
        onClick={() => {
          events.value = [];
        }}
        type="button"
      >
        清空输入事件
      </button>
      <button
        onClick={() => {
          value.value = "程序更新";
        }}
        type="button"
      >
        程序化赋值
      </button>
      <button
        onClick={() => {
          element.value?.focus();
          element.value?.setSelectionRange(1, 3);
        }}
        type="button"
      >
        聚焦并选中
      </button>
      <output data-input-value="">{value.value}</output>
      <output data-input-events="">{events.value.join(",")}</output>
      <h4>前后缀、密码与校验样式</h4>
      <Input
        addonAfter=".com"
        addonBefore="https://"
        aria-label="站点"
        defaultValue="semi"
        prefix="网址"
        suffix="域名"
      />
      <Input aria-label="图标前后缀" defaultValue="搜索内容" showClear>
        {{
          addonBefore: () => (
            <Icon type="search">{() => <IconSearch size="inherit" />}</Icon>
          ),
          prefix: () => (
            <Icon type="search">{() => <IconSearch size="inherit" />}</Icon>
          ),
          suffix: () => (
            <Icon type="search">{() => <IconSearch size="inherit" />}</Icon>
          ),
        }}
      </Input>
      <Input aria-label="密码" defaultValue="safe-password" mode="password" />
      <Input
        aria-label="错误状态"
        defaultValue="待修正"
        validateStatus="error"
      />
      <Input aria-label="只读内容" defaultValue="只读" readonly />
      <Input aria-label="禁用内容" defaultValue="禁用" disabled />
      <Input
        aria-label="转义文本"
        placeholder="<img src=x onerror=alert(1)>"
        prefix="<b>文本</b>"
        size="small"
      />
      <Input
        aria-label="按码点计数"
        getValueLength={(text) => Array.from(text).length}
        maxLength={3}
        placeholder="最多三个 Unicode 码点"
      />
      <p>
        示例的自定义长度按 Unicode 码点计数，不将复合 emoji 自动视为一个字素。
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted.value++;
        }}
      >
        <label for="input-native-form">原生提交字段</label>
        <Input id="input-native-form" name="query" required />
        <button type="submit">原生表单提交</button>
      </form>
      <output data-input-submitted="">{submitted.value}</output>
      <p>
        标签通过原生 for/id 关联。forwardRef 获取原生 input，可使用 focus、blur
        和选区 API；组件不提供 React 类实例。
      </p>
    </section>
  );
});
