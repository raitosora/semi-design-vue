import { defineVaporComponent, ref } from "vue";
import { Button, List } from "semi-ui-vue";
export default defineVaporComponent(() => {
  const records = ref(["甲", "乙"]);
  const actions = ref(0),
    listClicks = ref(0),
    itemClicks = ref(0),
    bubbles = ref(0),
    rightClicks = ref(0),
    currentTag = ref("");
  return (
    <section data-list-basic="">
      <h3>数据项与声明式内容</h3>
      <div
        onClick={() => {
          bubbles.value++;
        }}
      >
        <List
          bordered
          data-basic-list=""
          dataSource={records.value}
          footer="数据项之后追加声明式内容"
          header="团队成员"
          loadMore={() => (
            <Button
              onClick={() => {
                records.value = [
                  ...records.value,
                  `新增${records.value.length - 1}`,
                ];
              }}
            >
              {() => <>加载更多</>}
            </Button>
          )}
          onClick={(event) => {
            listClicks.value++;
            currentTag.value = (event.currentTarget as HTMLLIElement).tagName;
          }}
          onRightClick={(event) => {
            event.preventDefault();
            rightClicks.value++;
          }}
          renderItem={(item) => (
            <List.Item
              data-record={item}
              extra={() => (
                <Button
                  onClick={() => {
                    actions.value++;
                  }}
                  theme="borderless"
                >
                  {() => <>查看{item}</>}
                </Button>
              )}
              header={() => <span aria-hidden="true">●</span>}
              main={`<b>${item}</b>`}
            />
          )}
        >
          {() => (
            <List.Item
              data-manual=""
              onClick={() => {
                itemClicks.value++;
              }}
            >
              {() => <button type="button">独立操作</button>}
            </List.Item>
          )}
        </List>
      </div>
      <p>
        操作 <output data-actions="">{actions.value}</output> / 列表回调{" "}
        <output data-list-clicks="">{listClicks.value}</output> / 条目回调{" "}
        <output data-item-clicks="">{itemClicks.value}</output> / 外层冒泡{" "}
        <output data-bubbles="">{bubbles.value}</output> / 右键{" "}
        <output data-right-clicks="">{rightClicks.value}</output> /
        currentTarget <output data-current-tag="">{currentTag.value}</output>
      </p>
      <p>
        List 的点击回调由未指定自身回调的 Item
        继承。操作控件使用真实按钮，点击正常冒泡；loadMore
        内容由调用方负责更新数据。
      </p>
    </section>
  );
});
