import { defineVaporComponent } from "vue";
import { Highlight } from "semi-ui-vue";

export default defineVaporComponent(() => (
  <section data-highlight-basic="">
    <h3>原文与匹配片段</h3>
    <p data-highlight-sentence="">
      <Highlight
        searchWords={["设计系统", "Semi Design"]}
        sourceString="从 Semi Design 到 Any Design，快速定义你的设计系统。"
      />
    </p>
    <p data-highlight-overlap="">
      <Highlight
        searchWords={["aba", "ba", "aba", "semi", ""]}
        sourceString="ababa / Semi SEMI semi"
      />
    </p>
    <p data-highlight-safe="" style={{ overflowWrap: "anywhere" }}>
      <Highlight
        searchWords={["<script>", "&amp;", "[a+b]", "😀", "中文"]}
        sourceString={
          '<script>alert("x")</script> &amp; <style>body{color:red}</style> [a+b] 😀 中文'
        }
      />
    </p>
    <p>Highlight 不增加外层元素；段落、换行和布局由这里的原生 p 容器负责。</p>
  </section>
));
