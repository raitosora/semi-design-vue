import { createTextNode, ref, type ComponentInstance } from "vue";
import { Empty as RootEmpty } from "semi-ui-vue";
import Empty, {
  Empty as NamedEmpty,
  type EmptyProps,
  type EmptySlots,
  type EmptyContent,
  type EmptyImage,
  type EmptyRenderResult,
} from "semi-ui-vue/empty";
const root: typeof Empty = RootEmpty;
const named: typeof Empty = NamedEmpty;
const props: EmptyProps = {
  layout: "horizontal",
  image: { id: "art", viewBox: "0 0 20 20", url: "/unused" },
  darkModeImage: () => <svg />,
  title: "Title",
  description: () => ["escaped", 0, <b>native</b>],
  children: () => <button>Action</button>,
  className: "custom",
  class: ["alias"],
  style: { color: "red" },
  imageStyle: { width: "150px" },
  "data-state": "ready",
};
const slots: EmptySlots = {
  image: () => <svg />,
  darkModeImage: () => <svg />,
  title: () => <span>Title</span>,
  description: () => createTextNode("Description"),
  default: () => (
    <>
      <button>Action</button>
      <span>tail</span>
    </>
  ),
};
const instance = ref<ComponentInstance<typeof Empty> | null>(null);
const fixture = <Empty {...props} ref={instance} v-slots={slots} />;
const scalar: EmptyContent = () => [false, undefined, null, 0, "text"];
const image: EmptyImage = () => <svg />;
const result: EmptyRenderResult = [createTextNode("text"), <i />];
const removed: EmptyProps = {
  layout: undefined,
  title: undefined,
  image: undefined,
  darkModeImage: undefined,
  description: undefined,
  children: undefined,
  style: undefined,
  imageStyle: undefined,
  className: undefined,
  class: undefined,
  "v-slots": undefined,
};
const inline = (
  <Empty
    v-slots={{
      title: () => <span>Title</span>,
      default: () => <button>Action</button>,
    }}
  />
);
void [root, named, fixture, scalar, image, result, removed, inline];
